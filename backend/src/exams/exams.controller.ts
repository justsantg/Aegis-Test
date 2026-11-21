import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamTemplateDto } from './dto/create-exam-template.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ExamTypeEnum } from './exams.enum';

@ApiTags('Exams')
@Controller({
  path: 'exams',
  version: '1',
})
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('parse-pptx')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async parsePptx(
    @UploadedFile()
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    if (!file || !file.buffer) {
      return {
        suggestedTitle: 'Examen Importado',
        totalQuestions: 0,
        questions: [],
      };
    }
    return this.examsService.parsePptx(file.buffer);
  }

  @Post('parse-text')
  async parseText(@Body() body: { text: string }) {
    return this.examsService.parseText(body.text || '');
  }

  @Post('templates')
  async createTemplate(
    @Body() dto: CreateExamTemplateDto,
    @Query('creatorId') creatorId?: number,
  ) {
    return this.examsService.createTemplate(
      dto,
      creatorId ? Number(creatorId) : undefined,
    );
  }

  @Get('templates')
  @ApiQuery({ name: 'levelId', required: false, type: Number })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiQuery({ name: 'examType', required: false, enum: ExamTypeEnum })
  async findAllTemplates(
    @Query('levelId') levelId?: number,
    @Query('courseId') courseId?: string,
    @Query('examType') examType?: ExamTypeEnum,
  ) {
    return this.examsService.findAllTemplates({
      levelId: levelId ? Number(levelId) : undefined,
      courseId,
      examType,
    });
  }

  @Get('templates/:id')
  async findOneTemplate(@Param('id') id: string) {
    return this.examsService.findOneTemplate(id);
  }

  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: CreateExamTemplateDto,
  ) {
    return this.examsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.examsService.deleteTemplate(id);
  }

  @Post('templates/:id/questions')
  async addQuestion(@Param('id') id: string, @Body() dto: CreateQuestionDto) {
    return this.examsService.addQuestion(id, dto);
  }

  @Get('templates/:id/student-view')
  async getStudentView(@Param('id') id: string) {
    return this.examsService.getExamQuestions(id, true);
  }
}
