import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExamSessionsService } from './exam-sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';

@ApiTags('Exam Sessions')
@Controller({
  path: 'sessions',
  version: '1',
})
export class ExamSessionsController {
  constructor(private readonly sessionsService: ExamSessionsService) {}

  @Get('teacher-metrics')
  @ApiQuery({ name: 'teacherId', required: false, type: Number })
  @ApiQuery({ name: 'examType', required: false, enum: ['MIDTERM', 'FINAL'] })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  async getTeacherMetrics(
    @Query('teacherId') teacherId?: number,
    @Query('examType') examType?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.sessionsService.getTeacherAuditMetrics({
      teacherId: teacherId ? Number(teacherId) : undefined,
      examType,
      courseId,
    });
  }

  @Post()
  async createSession(@Body() dto: CreateSessionDto, @Request() req?: any) {
    const teacherId = req?.user?.id;
    return this.sessionsService.createSession(dto, teacherId);
  }

  @Post('join')
  async joinSession(@Body() dto: JoinSessionDto) {
    return this.sessionsService.joinSession(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Get(':id/monitor')
  async getMonitorDashboard(@Param('id') id: string) {
    return this.sessionsService.getMonitorDashboard(id);
  }

  @Post(':id/advance-block')
  async advanceBlock(@Param('id') id: string) {
    return this.sessionsService.advanceBlock(id);
  }

  @Post(':id/infraction')
  async recordInfraction(
    @Param('id') id: string,
    @Body() dto: { studentId: number; incidentType?: string; details?: string },
  ) {
    return this.sessionsService.recordInfraction(
      id,
      Number(dto.studentId),
      dto.incidentType,
      dto.details,
    );
  }

  @Post(':id/submit')
  async submitExam(@Param('id') id: string, @Body() dto: SubmitExamDto) {
    return this.sessionsService.submitExam(sessionIdClean(id), dto);
  }

  @Post(':id/finish')
  async finishSession(@Param('id') id: string) {
    return this.sessionsService.finishSession(id);
  }
}

function sessionIdClean(id: string): string {
  return id;
}
