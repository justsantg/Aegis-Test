import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamTemplateEntity } from './infrastructure/persistence/relational/entities/exam-template.entity';
import { QuestionEntity } from './infrastructure/persistence/relational/entities/question.entity';
import { QuestionOptionEntity } from './infrastructure/persistence/relational/entities/question-option.entity';
import { LevelEntity } from '../levels/infrastructure/persistence/relational/entities/level.entity';
import { CourseEntity } from '../courses/infrastructure/persistence/relational/entities/course.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { CreateExamTemplateDto } from './dto/create-exam-template.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ExamTypeEnum } from './exams.enum';
import { LevelTypeEnum } from '../levels/levels.enum';
import {
  parsePptxBuffer,
  parseRawTextToQuestions,
} from './pptx-parser.util';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(ExamTemplateEntity)
    private readonly templateRepository: Repository<ExamTemplateEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: Repository<QuestionEntity>,
    @InjectRepository(QuestionOptionEntity)
    private readonly optionRepository: Repository<QuestionOptionEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async parsePptx(buffer: Buffer) {
    return parsePptxBuffer(buffer);
  }

  async parseText(text: string) {
    return parseRawTextToQuestions(text);
  }

  async createTemplate(
    dto: CreateExamTemplateDto,
    creatorId?: number,
  ): Promise<ExamTemplateEntity> {
    const level = await this.levelRepository.findOne({
      where: { id: dto.levelId },
    });

    if (!level) {
      throw new NotFoundException(`Level with id ${dto.levelId} not found`);
    }

    // Regla de negocio Training: Solo tiene Midterm, no final interno
    if (
      level.levelType === LevelTypeEnum.TRAINING_APTIS &&
      dto.examType === ExamTypeEnum.FINAL
    ) {
      throw new BadRequestException(
        'El nivel Training (APTIS) únicamente admite Examen Intermedio (Midterm). La evaluación final es el examen oficial internacional APTIS.',
      );
    }

    let course: CourseEntity | null = null;
    if (dto.courseId) {
      course = await this.courseRepository.findOne({
        where: { id: dto.courseId },
      });
      if (!course) {
        throw new NotFoundException(`Course with id ${dto.courseId} not found`);
      }
    }

    let creator: UserEntity | null = null;
    if (creatorId) {
      creator = await this.userRepository.findOne({
        where: { id: creatorId },
      });
    }

    const totalQ = dto.questions ? dto.questions.length : (dto.totalQuestions ?? 30);

    const template = this.templateRepository.create({
      level,
      course,
      createdBy: creator,
      title: dto.title,
      description: dto.description,
      examType: dto.examType,
      totalQuestions: totalQ,
      durationMinutes: dto.durationMinutes ?? 45,
      isActive: true,
    });

    const savedTemplate = await this.templateRepository.save(template);

    // Save embedded questions if provided in creation payload
    if (dto.questions && dto.questions.length > 0) {
      for (let i = 0; i < dto.questions.length; i++) {
        const qDto = dto.questions[i];
        const blockNumber = qDto.blockNumber || Math.min(6, Math.floor(i / 5) + 1);
        const orderIndex = qDto.orderIndex || i + 1;

        const question = this.questionRepository.create({
          type: qDto.type,
          prompt: qDto.prompt,
          contextText: qDto.contextText,
          blockNumber,
          orderIndex,
          points: qDto.points ?? 1.0,
          examTemplate: savedTemplate,
        });

        const savedQuestion = await this.questionRepository.save(question);

        if (qDto.options && qDto.options.length > 0) {
          const options = qDto.options.map((opt) =>
            this.optionRepository.create({
              content: opt.content,
              isCorrect: opt.isCorrect ?? false,
              correctPosition: opt.correctPosition ?? null,
              blankId: opt.blankId ?? null,
              question: savedQuestion,
            }),
          );
          await this.optionRepository.save(options);
        }
      }
    }

    return this.findOneTemplate(savedTemplate.id);
  }

  async findAllTemplates(params?: {
    levelId?: number;
    courseId?: string;
    examType?: ExamTypeEnum;
  }): Promise<ExamTemplateEntity[]> {
    const query = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.level', 'level')
      .leftJoinAndSelect('template.course', 'course')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .where('template.isActive = :isActive', { isActive: true });

    if (params?.courseId) {
      if (params?.levelId) {
        query.andWhere(
          '(template.courseId = :courseId OR (template.levelId = :levelId AND template.courseId IS NULL))',
          { courseId: params.courseId, levelId: params.levelId },
        );
      } else {
        query.andWhere('template.courseId = :courseId', {
          courseId: params.courseId,
        });
      }
    } else if (params?.levelId) {
      query.andWhere('template.levelId = :levelId', {
        levelId: params.levelId,
      });
    }

    if (params?.examType) {
      query.andWhere('template.examType = :examType', {
        examType: params.examType,
      });
    }

    query.orderBy('template.courseId', 'DESC');
    query.addOrderBy('template.createdAt', 'DESC');

    return query.getMany();
  }

  async findOneTemplate(id: string): Promise<ExamTemplateEntity> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: [
        'level',
        'course',
        'createdBy',
        'questions',
        'questions.options',
      ],
      order: {
        questions: {
          orderIndex: 'ASC',
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Exam template with id ${id} not found`);
    }

    return template;
  }

  async deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with id ${id} not found`);
    }
    await this.templateRepository.remove(template);
    return { success: true, message: 'Examen eliminado correctamente' };
  }

  async updateTemplate(
    id: string,
    dto: CreateExamTemplateDto,
  ): Promise<ExamTemplateEntity> {
    const template = await this.findOneTemplate(id);

    template.title = dto.title;
    template.examType = dto.examType;
    template.description = dto.description;
    template.durationMinutes = dto.durationMinutes ?? template.durationMinutes;

    if (dto.questions && dto.questions.length > 0) {
      template.totalQuestions = dto.questions.length;

      // Delete existing questions for this template
      const existingQuestions = await this.questionRepository.find({
        where: { examTemplate: { id } },
      });
      if (existingQuestions.length > 0) {
        await this.questionRepository.remove(existingQuestions);
      }

      // Re-create questions with options
      for (let i = 0; i < dto.questions.length; i++) {
        const qDto = dto.questions[i];
        const blockNumber = qDto.blockNumber || Math.min(6, Math.floor(i / 5) + 1);
        const orderIndex = qDto.orderIndex || i + 1;

        const question = this.questionRepository.create({
          type: qDto.type,
          prompt: qDto.prompt,
          contextText: qDto.contextText,
          blockNumber,
          orderIndex,
          points: qDto.points ?? 1.0,
          examTemplate: template,
        });

        const savedQuestion = await this.questionRepository.save(question);

        if (qDto.options && qDto.options.length > 0) {
          const options = qDto.options.map((opt) =>
            this.optionRepository.create({
              content: opt.content,
              isCorrect: opt.isCorrect ?? false,
              correctPosition: opt.correctPosition ?? null,
              blankId: opt.blankId ?? null,
              question: savedQuestion,
            }),
          );
          await this.optionRepository.save(options);
        }
      }
    }

    await this.templateRepository.save(template);
    return this.findOneTemplate(id);
  }

  async addQuestion(
    templateId: string,
    dto: CreateQuestionDto,
  ): Promise<QuestionEntity> {
    const template = await this.findOneTemplate(templateId);

    const question = this.questionRepository.create({
      type: dto.type,
      prompt: dto.prompt,
      contextText: dto.contextText,
      blockNumber: dto.blockNumber,
      orderIndex: dto.orderIndex,
      points: dto.points ?? 1.0,
      examTemplate: template,
    });

    const savedQuestion = await this.questionRepository.save(question);

    if (dto.options && dto.options.length > 0) {
      const options = dto.options.map((opt) =>
        this.optionRepository.create({
          content: opt.content,
          isCorrect: opt.isCorrect ?? false,
          correctPosition: opt.correctPosition ?? null,
          blankId: opt.blankId ?? null,
          question: savedQuestion,
        }),
      );

      savedQuestion.options = await this.optionRepository.save(options);
    }

    return savedQuestion;
  }

  async getExamQuestions(
    templateId: string,
    hideSolutions = false,
  ): Promise<QuestionEntity[]> {
    const template = await this.findOneTemplate(templateId);

    if (!template.questions || template.questions.length === 0) {
      return [];
    }

    if (hideSolutions) {
      return template.questions.map((q) => {
        const sanitized = { ...q };
        if (sanitized.options) {
          sanitized.options = sanitized.options.map((opt) => {
            const { isCorrect, correctPosition, ...safeOpt } = opt as any;
            return safeOpt;
          });
        }
        return sanitized;
      }) as QuestionEntity[];
    }

    return template.questions;
  }
}
