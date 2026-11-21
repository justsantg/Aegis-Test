import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamTemplateEntity } from '../../../../exams/infrastructure/persistence/relational/entities/exam-template.entity';
import { QuestionEntity } from '../../../../exams/infrastructure/persistence/relational/entities/question.entity';
import { QuestionOptionEntity } from '../../../../exams/infrastructure/persistence/relational/entities/question-option.entity';
import { LevelEntity } from '../../../../levels/infrastructure/persistence/relational/entities/level.entity';
import { ExamTypeEnum, QuestionTypeEnum } from '../../../../exams/exams.enum';

@Injectable()
export class ExamSeedService {
  constructor(
    @InjectRepository(ExamTemplateEntity)
    private readonly templateRepository: Repository<ExamTemplateEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: Repository<QuestionEntity>,
    @InjectRepository(QuestionOptionEntity)
    private readonly optionRepository: Repository<QuestionOptionEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
  ) {}

  async run() {
    const level4A = await this.levelRepository.findOne({
      where: { code: '4A' },
    });

    if (!level4A) return;

    let template = await this.templateRepository.findOne({
      where: { title: 'Midterm Exam 4A - Grammar & Syntax' },
    });

    if (!template) {
      template = await this.templateRepository.save(
        this.templateRepository.create({
          title: 'Midterm Exam 4A - Grammar & Syntax',
          description: 'Examen intermedio oficial de 30 puntos para Nivel 4A',
          examType: ExamTypeEnum.MIDTERM,
          level: level4A,
          totalQuestions: 30,
          durationMinutes: 45,
          isActive: true,
        }),
      );

      // Pregunta 1: ICFES
      const q1 = await this.questionRepository.save(
        this.questionRepository.create({
          examTemplate: template,
          type: QuestionTypeEnum.ICFES_MULTIPLE_CHOICE,
          prompt: 'Choose the correct option to complete the dialogue.',
          contextText:
            'Mark: Where is Sarah?\nJohn: She ______ to the library ten minutes ago.',
          blockNumber: 1,
          orderIndex: 1,
          points: 1.0,
        }),
      );
      await this.optionRepository.save([
        this.optionRepository.create({
          content: 'goes',
          isCorrect: false,
          question: q1,
        }),
        this.optionRepository.create({
          content: 'went',
          isCorrect: true,
          question: q1,
        }),
        this.optionRepository.create({
          content: 'has gone',
          isCorrect: false,
          question: q1,
        }),
        this.optionRepository.create({
          content: 'gone',
          isCorrect: false,
          question: q1,
        }),
      ]);

      // Pregunta 2: Sentence Scramble (Ordenar la oración)
      const q2 = await this.questionRepository.save(
        this.questionRepository.create({
          examTemplate: template,
          type: QuestionTypeEnum.SENTENCE_SCRAMBLE,
          prompt:
            'Tap the words in the correct grammatical order to form a negative sentence:',
          contextText: null,
          blockNumber: 1,
          orderIndex: 2,
          points: 1.0,
        }),
      );
      await this.optionRepository.save([
        this.optionRepository.create({
          content: 'She',
          correctPosition: 1,
          question: q2,
        }),
        this.optionRepository.create({
          content: 'has',
          correctPosition: 2,
          question: q2,
        }),
        this.optionRepository.create({
          content: 'never',
          correctPosition: 3,
          question: q2,
        }),
        this.optionRepository.create({
          content: 'travelled',
          correctPosition: 4,
          question: q2,
        }),
        this.optionRepository.create({
          content: 'abroad.',
          correctPosition: 5,
          question: q2,
        }),
      ]);

      // Pregunta 3: Fill in the blank (Desplegable inline)
      const q3 = await this.questionRepository.save(
        this.questionRepository.create({
          examTemplate: template,
          type: QuestionTypeEnum.FILL_IN_BLANK,
          prompt:
            'Select the correct prepositions to complete the daily routine:',
          contextText: 'I usually wake up [blank_1] 7:00 AM [blank_2] Mondays.',
          blockNumber: 1,
          orderIndex: 3,
          points: 1.0,
        }),
      );
      await this.optionRepository.save([
        this.optionRepository.create({
          content: 'at',
          isCorrect: true,
          blankId: 1,
          question: q3,
        }),
        this.optionRepository.create({
          content: 'in',
          isCorrect: false,
          blankId: 1,
          question: q3,
        }),
        this.optionRepository.create({
          content: 'on',
          isCorrect: true,
          blankId: 2,
          question: q3,
        }),
        this.optionRepository.create({
          content: 'at',
          isCorrect: false,
          blankId: 2,
          question: q3,
        }),
      ]);

      // Pregunta 4: Sentence Completion (Texto exacto)
      const q4 = await this.questionRepository.save(
        this.questionRepository.create({
          examTemplate: template,
          type: QuestionTypeEnum.SENTENCE_COMPLETION,
          prompt: 'Write the correct past tense of the verb in parentheses:',
          contextText: 'Last night, they (buy) ______ a brand new car.',
          blockNumber: 1,
          orderIndex: 4,
          points: 1.0,
        }),
      );
      await this.optionRepository.save([
        this.optionRepository.create({
          content: 'bought',
          isCorrect: true,
          question: q4,
        }),
      ]);

      // Pregunta 5: ICFES
      const q5 = await this.questionRepository.save(
        this.questionRepository.create({
          examTemplate: template,
          type: QuestionTypeEnum.ICFES_MULTIPLE_CHOICE,
          prompt:
            'Which question is grammatically correct in a formal interview?',
          contextText: 'Context: Asking about previous work experience.',
          blockNumber: 1,
          orderIndex: 5,
          points: 1.0,
        }),
      );
      await this.optionRepository.save([
        this.optionRepository.create({
          content: 'How long have you worked here?',
          isCorrect: true,
          question: q5,
        }),
        this.optionRepository.create({
          content: 'How long you work here?',
          isCorrect: false,
          question: q5,
        }),
        this.optionRepository.create({
          content: 'How long are you working here since?',
          isCorrect: false,
          question: q5,
        }),
        this.optionRepository.create({
          content: 'How long did you worked here?',
          isCorrect: false,
          question: q5,
        }),
      ]);
    }
  }
}
