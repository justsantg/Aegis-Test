import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamSessionEntity } from './infrastructure/persistence/relational/entities/exam-session.entity';
import { SessionAttendeeEntity } from './infrastructure/persistence/relational/entities/session-attendee.entity';
import { StudentAnswerEntity } from './infrastructure/persistence/relational/entities/student-answer.entity';
import { SessionSecurityIncidentEntity } from './infrastructure/persistence/relational/entities/session-security-incident.entity';
import { CourseEntity } from '../courses/infrastructure/persistence/relational/entities/course.entity';
import { CourseEnrollmentEntity } from '../courses/infrastructure/persistence/relational/entities/course-enrollment.entity';
import { ExamTemplateEntity } from '../exams/infrastructure/persistence/relational/entities/exam-template.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { LevelEntity } from '../levels/infrastructure/persistence/relational/entities/level.entity';
import { LevelTypeEnum } from '../levels/levels.enum';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import {
  AttendanceStatusEnum,
  SessionModeEnum,
  SessionStatusEnum,
} from './exam-sessions.enum';
import { EnrollmentStatusEnum } from '../courses/courses.enum';
import { ExamsService } from '../exams/exams.service';
import { QuestionTypeEnum } from '../exams/exams.enum';

@Injectable()
export class ExamSessionsService {
  constructor(
    @InjectRepository(ExamSessionEntity)
    private readonly sessionRepository: Repository<ExamSessionEntity>,
    @InjectRepository(SessionAttendeeEntity)
    private readonly attendeeRepository: Repository<SessionAttendeeEntity>,
    @InjectRepository(StudentAnswerEntity)
    private readonly answerRepository: Repository<StudentAnswerEntity>,
    @InjectRepository(SessionSecurityIncidentEntity)
    private readonly incidentRepository: Repository<SessionSecurityIncidentEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
    @InjectRepository(CourseEnrollmentEntity)
    private readonly enrollmentRepository: Repository<CourseEnrollmentEntity>,
    @InjectRepository(ExamTemplateEntity)
    private readonly templateRepository: Repository<ExamTemplateEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
    private readonly examsService: ExamsService,
  ) {}

  private generatePin(): string {
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(100 + Math.random() * 900);
    return `${part1}-${part2}`;
  }

  async createSession(
    dto: CreateSessionDto,
    teacherId?: number,
  ): Promise<ExamSessionEntity> {
    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId },
      relations: ['level', 'teacher'],
    });

    if (!course) {
      throw new NotFoundException(`Course with id ${dto.courseId} not found`);
    }

    const examTemplate = await this.templateRepository.findOne({
      where: { id: dto.examTemplateId },
      relations: ['level'],
    });

    if (!examTemplate) {
      throw new NotFoundException(
        `Exam template with id ${dto.examTemplateId} not found`,
      );
    }

    // Validar que el nivel del curso coincida con el nivel del examen
    if (course.level.id !== examTemplate.level.id) {
      throw new BadRequestException(
        `El examen seleccionado (${examTemplate.level.name}) no corresponde al nivel del curso (${course.level.name})`,
      );
    }

    let teacher = course.teacher;
    if (teacherId) {
      const foundTeacher = await this.userRepository.findOne({
        where: { id: teacherId },
      });
      if (foundTeacher) teacher = foundTeacher;
    }

    if (!teacher) {
      throw new BadRequestException('El curso no tiene un docente asignado');
    }

    const sessionPin = this.generatePin();

    const session = this.sessionRepository.create({
      course,
      examTemplate,
      teacher,
      sessionPin,
      mode: dto.mode,
      status: SessionStatusEnum.IN_PROGRESS,
      currentBlock: 1,
      startedAt: new Date(),
    });

    const savedSession = await this.sessionRepository.save(session);

    // Precargar lista oficial de alumnos del curso (Roster en estado PENDING)
    const activeEnrollments = await this.enrollmentRepository.find({
      where: {
        course: { id: course.id },
        enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
      },
      relations: ['student'],
    });

    if (activeEnrollments.length > 0) {
      const attendees = activeEnrollments.map((enrollment) =>
        this.attendeeRepository.create({
          session: savedSession,
          student: enrollment.student,
          attendanceStatus: AttendanceStatusEnum.PENDING,
          whatsappNotified: false,
        }),
      );

      await this.attendeeRepository.save(attendees);
    }

    return this.findOne(savedSession.id);
  }

  async findOne(id: string): Promise<ExamSessionEntity> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: [
        'course',
        'course.level',
        'examTemplate',
        'teacher',
        'attendees',
        'attendees.student',
      ],
    });

    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }

    return session;
  }

  async joinSession(dto: JoinSessionDto) {
    const session = await this.sessionRepository.findOne({
      where: { sessionPin: dto.sessionPin },
      relations: ['course', 'examTemplate', 'attendees', 'attendees.student'],
    });

    if (!session) {
      throw new NotFoundException(`PIN de sesión inválido o expirado`);
    }

    if (session.status !== SessionStatusEnum.IN_PROGRESS) {
      throw new BadRequestException(`La sesión de examen no está activa`);
    }

    let attendee = session.attendees.find(
      (a) => a.student.id === dto.studentId,
    );

    if (!attendee) {
      // Estudiante no estaba en lista previa (invitado / extemporáneo)
      const student = await this.userRepository.findOne({
        where: { id: dto.studentId },
      });

      if (!student) {
        throw new NotFoundException(`Estudiante no encontrado`);
      }

      attendee = this.attendeeRepository.create({
        session,
        student,
        attendanceStatus: AttendanceStatusEnum.IN_PROGRESS,
        startedAt: new Date(),
      });
      await this.attendeeRepository.save(attendee);
    } else {
      // Actualizar a estado en examen
      attendee.attendanceStatus = AttendanceStatusEnum.IN_PROGRESS;
      if (!attendee.startedAt) {
        attendee.startedAt = new Date();
      }
      await this.attendeeRepository.save(attendee);
    }

    // Obtener preguntas seguras para el estudiante
    const questions = await this.examsService.getExamQuestions(
      session.examTemplate.id,
      true,
    );

    const studentUser = attendee.student;

    return {
      sessionId: session.id,
      sessionPin: session.sessionPin,
      courseName: session.course.courseName,
      examTitle: session.examTemplate.title,
      mode: session.mode,
      currentBlock: session.currentBlock,
      durationMinutes: session.examTemplate.durationMinutes,
      student: {
        id: studentUser.id,
        fullName:
          `${studentUser.firstName || ''} ${studentUser.lastName || ''}`.trim() ||
          studentUser.email,
        studentCode: studentUser.studentCode,
        email: studentUser.email,
        phoneNumber: studentUser.phoneNumber,
      },
      questions,
    };
  }

  async getMonitorDashboard(sessionId: string) {
    const session = await this.findOne(sessionId);

    const attendeesData = session.attendees.map((attendee) => {
      const student = attendee.student;
      let whatsappLink: string | null = null;

      // Generar link de WhatsApp directo para ausentes
      if (
        student.phoneNumber &&
        (attendee.attendanceStatus === AttendanceStatusEnum.PENDING ||
          attendee.attendanceStatus === AttendanceStatusEnum.ABSENT)
      ) {
        const cleanPhone = student.phoneNumber.replace(/[^0-9]/g, '');
        const examName = session.examTemplate?.title || 'la evaluación';
        const isSessionFinished =
          session.status === SessionStatusEnum.FINISHED;

        let messageText = `Hola ${student.firstName}, no te presentaste al examen "${examName}". Comunícate con el coordinador para una reprogramación en caso de asuntos externos, por el contrario tu nota quedará en 0.`;
        if (
          !isSessionFinished &&
          attendee.attendanceStatus === AttendanceStatusEnum.PENDING
        ) {
          messageText = `Hola ${student.firstName}, no te has presentado al examen "${examName}" (PIN: ${session.sessionPin}). Si aún estás a tiempo, ingresa de inmediato; de lo contrario, comunícate con el coordinador para una reprogramación en caso de asuntos externos, por el contrario tu nota quedará en 0.`;
        }

        const message = encodeURIComponent(messageText);
        whatsappLink = `https://wa.me/${cleanPhone}?text=${message}`;
      }

      return {
        attendeeId: attendee.id,
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        studentCode: student.studentCode,
        phoneNumber: student.phoneNumber,
        email: student.email,
        attendanceStatus: attendee.attendanceStatus,
        whatsappNotified: attendee.whatsappNotified,
        whatsappLink,
        totalScore: attendee.totalScore,
        focusLossCount: attendee.focusLossCount || 0,
        startedAt: attendee.startedAt,
        submittedAt: attendee.submittedAt,
      };
    });

    const summary = {
      total: attendeesData.length,
      present: attendeesData.filter(
        (a) =>
          a.attendanceStatus === AttendanceStatusEnum.IN_PROGRESS ||
          a.attendanceStatus === AttendanceStatusEnum.COMPLETED,
      ).length,
      pendingOrAbsent: attendeesData.filter(
        (a) =>
          a.attendanceStatus === AttendanceStatusEnum.PENDING ||
          a.attendanceStatus === AttendanceStatusEnum.ABSENT,
      ).length,
      totalInfractions: attendeesData.reduce(
        (acc, a) => acc + (a.focusLossCount || 0),
        0,
      ),
      studentsWithInfractions: attendeesData.filter(
        (a) => (a.focusLossCount || 0) > 0,
      ).length,
    };

    const incidents = await this.incidentRepository.find({
      where: { session: { id: sessionId } },
      relations: ['student'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const securityIncidents = incidents.map((inc) => ({
      id: inc.id,
      studentId: inc.student?.id,
      studentName: `${inc.student?.firstName || ''} ${inc.student?.lastName || ''}`.trim(),
      studentCode: inc.student?.studentCode || '---',
      incidentType: inc.incidentType,
      details: inc.details,
      incidentNumber: inc.incidentNumber,
      createdAt: inc.createdAt,
    }));

    return {
      sessionId: session.id,
      sessionPin: session.sessionPin,
      mode: session.mode,
      status: session.status,
      currentBlock: session.currentBlock,
      startedAt: session.startedAt,
      summary,
      attendees: attendeesData,
      securityIncidents,
    };
  }

  async advanceBlock(sessionId: string): Promise<ExamSessionEntity> {
    const session = await this.findOne(sessionId);

    if (session.mode !== SessionModeEnum.SYNC_BLOCKS) {
      throw new BadRequestException(
        'Solo se puede avanzar de bloque en el modo Bloques Sincronizados (SYNC_BLOCKS)',
      );
    }

    if (session.currentBlock >= 6) {
      throw new BadRequestException(
        'Ya se ha alcanzado el último bloque (Bloque 6)',
      );
    }

    session.currentBlock += 1;
    return this.sessionRepository.save(session);
  }

  async recordInfraction(
    sessionId: string,
    studentId: number,
    incidentType: string = 'FOCUS_LOSS',
    details?: string,
  ) {
    const session = await this.findOne(sessionId);
    const attendee = session.attendees.find((a) => a.student.id === studentId);
    if (!attendee) {
      return { success: false, message: 'Attendee not found' };
    }
    attendee.focusLossCount = (attendee.focusLossCount || 0) + 1;
    await this.attendeeRepository.save(attendee);

    const incident = this.incidentRepository.create({
      session,
      student: attendee.student,
      incidentType: incidentType || 'FOCUS_LOSS',
      details:
        details ||
        'Pérdida de foco de ventana / posible cambio de aplicación o IA',
      incidentNumber: attendee.focusLossCount,
    });
    await this.incidentRepository.save(incident);

    return {
      success: true,
      focusLossCount: attendee.focusLossCount,
      incident: {
        id: incident.id,
        incidentType: incident.incidentType,
        details: incident.details,
        incidentNumber: incident.incidentNumber,
        createdAt: incident.createdAt,
      },
      message: `Infracción #${attendee.focusLossCount} registrada para el estudiante ${attendee.student.firstName}`,
    };
  }

  async submitExam(sessionId: string, dto: SubmitExamDto) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['examTemplate'],
    });

    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    const attendee = await this.attendeeRepository.findOne({
      where: { session: { id: sessionId }, student: { id: dto.studentId } },
    });

    if (!attendee) {
      throw new NotFoundException(
        `Attendee record not found for student in this session`,
      );
    }

    if (attendee.attendanceStatus === AttendanceStatusEnum.COMPLETED) {
      throw new BadRequestException(
        'El estudiante ya ha enviado su examen previamente',
      );
    }

    // Cargar preguntas oficiales con respuestas correctas
    const template = await this.examsService.findOneTemplate(
      session.examTemplate.id,
    );
    const questionsMap = new Map(template.questions.map((q) => [q.id, q]));

    let totalScore = 0;
    const answerEntities: StudentAnswerEntity[] = [];

    for (const submitted of dto.answers) {
      const question = questionsMap.get(submitted.questionId);
      if (!question) continue;

      let isCorrect = false;
      const resp = submitted.response;

      switch (question.type) {
        case QuestionTypeEnum.ICFES_MULTIPLE_CHOICE: {
          // resp es el optionId elegido
          const chosenOpt = question.options.find((o) => o.id === resp);
          isCorrect = chosenOpt ? chosenOpt.isCorrect === true : false;
          break;
        }

        case QuestionTypeEnum.SENTENCE_SCRAMBLE: {
          // resp es un array ordenado de optionIds: [id1, id2, ...] o palabras
          if (Array.isArray(resp)) {
            // Verificar si cada elemento coincide con correctPosition
            const sortedOptions = [...question.options].sort(
              (a, b) => (a.correctPosition ?? 0) - (b.correctPosition ?? 0),
            );
            const correctIds = sortedOptions.map((o) => o.id);
            const correctContents = sortedOptions.map((o) =>
              o.content.trim().toLowerCase(),
            );

            const studentMatchesIds =
              JSON.stringify(resp) === JSON.stringify(correctIds);
            const studentMatchesContents =
              JSON.stringify(
                resp.map((r: string) => String(r).trim().toLowerCase()),
              ) === JSON.stringify(correctContents);

            isCorrect = studentMatchesIds || studentMatchesContents;
          }
          break;
        }

        case QuestionTypeEnum.FILL_IN_BLANK: {
          // resp es un objeto mapa { "1": "optionId1", "2": "optionId2" }
          if (typeof resp === 'object' && resp !== null) {
            const blankOptions = question.options.filter((o) => o.blankId);
            const blanks = Array.from(
              new Set(blankOptions.map((o) => o.blankId)),
            );

            let allBlanksCorrect = true;
            for (const bId of blanks) {
              const studentChoice = resp[String(bId)];
              const correctForBlank = question.options.find(
                (o) => o.blankId === bId && o.isCorrect,
              );

              if (
                !correctForBlank ||
                (studentChoice !== correctForBlank.id &&
                  studentChoice !== correctForBlank.content)
              ) {
                allBlanksCorrect = false;
                break;
              }
            }
            isCorrect = allBlanksCorrect;
          }
          break;
        }

        case QuestionTypeEnum.SENTENCE_COMPLETION: {
          // resp es texto escrito por el alumno o palabra seleccionada del recuadro
          if (typeof resp === 'string') {
            const cleanResp = resp.trim().toLowerCase();
            const correctOptions = question.options.filter((o) => o.isCorrect);
            isCorrect = correctOptions.some(
              (o) =>
                o.content.trim().toLowerCase() === cleanResp ||
                o.id === resp.trim(),
            );
          }
          break;
        }
      }

      const pointsEarned = isCorrect ? Number(question.points) : 0.0;
      totalScore += pointsEarned;

      answerEntities.push(
        this.answerRepository.create({
          sessionAttendee: attendee,
          question,
          studentResponse:
            typeof resp === 'object' ? JSON.stringify(resp) : String(resp),
          isCorrect,
          scoreEarned: pointsEarned,
        }),
      );
    }

    await this.answerRepository.save(answerEntities);

    attendee.totalScore = totalScore;
    attendee.attendanceStatus = AttendanceStatusEnum.COMPLETED;
    attendee.submittedAt = new Date();
    await this.attendeeRepository.save(attendee);

    return {
      message: 'Examen calificado y enviado exitosamente',
      studentId: dto.studentId,
      totalScore,
      totalQuestionsEvaluated: answerEntities.length,
    };
  }

  async finishSession(sessionId: string): Promise<ExamSessionEntity> {
    const session = await this.findOne(sessionId);

    session.status = SessionStatusEnum.FINISHED;
    session.endedAt = new Date();

    // Auto-NP para alumnos que nunca se presentaron
    for (const attendee of session.attendees) {
      if (attendee.attendanceStatus === AttendanceStatusEnum.PENDING) {
        attendee.attendanceStatus = AttendanceStatusEnum.ABSENT;
        attendee.totalScore = 0.0;
        await this.attendeeRepository.save(attendee);
      }
    }

    return this.sessionRepository.save(session);
  }

  async getTeacherAuditMetrics(filters?: {
    teacherId?: number;
    examType?: string;
    courseId?: string;
  }): Promise<any> {
    const query = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.course', 'course')
      .leftJoinAndSelect('course.level', 'level')
      .leftJoinAndSelect('session.examTemplate', 'template')
      .leftJoinAndSelect('session.teacher', 'teacher')
      .leftJoinAndSelect('session.attendees', 'attendees')
      .leftJoinAndSelect('attendees.student', 'student')
      .orderBy('session.createdAt', 'DESC');

    if (filters?.teacherId) {
      query.andWhere('session.teacherId = :teacherId', {
        teacherId: filters.teacherId,
      });
    }

    if (filters?.examType) {
      query.andWhere('template.examType = :examType', {
        examType: filters.examType.toUpperCase(),
      });
    }

    if (filters?.courseId) {
      query.andWhere('session.courseId = :courseId', {
        courseId: filters.courseId,
      });
    }

    const sessions = await query.getMany();

    let totalEnrolledOverall = 0;
    let totalPresentOverall = 0;
    let totalAbsentOverall = 0;
    let totalCompletedOverall = 0;
    let sumScoreOverall = 0;
    let countScoredOverall = 0;

    const list = sessions.map((session) => {
      const attendees = session.attendees || [];
      const totalEnrolled = attendees.length;
      const presentCount = attendees.filter(
        (a) =>
          a.attendanceStatus === AttendanceStatusEnum.IN_PROGRESS ||
          a.attendanceStatus === AttendanceStatusEnum.COMPLETED,
      ).length;
      const absentCount = attendees.filter(
        (a) =>
          a.attendanceStatus === AttendanceStatusEnum.ABSENT ||
          a.attendanceStatus === AttendanceStatusEnum.PENDING,
      ).length;
      const completedCount = attendees.filter(
        (a) => a.attendanceStatus === AttendanceStatusEnum.COMPLETED,
      ).length;

      const scoredAttendees = attendees.filter(
        (a) => a.totalScore !== null && a.totalScore !== undefined,
      );
      const avgScore =
        scoredAttendees.length > 0
          ? Number(
              (
                scoredAttendees.reduce(
                  (acc, a) => acc + Number(a.totalScore || 0),
                  0,
                ) / scoredAttendees.length
              ).toFixed(2),
            )
          : null;

      totalEnrolledOverall += totalEnrolled;
      totalPresentOverall += presentCount;
      totalAbsentOverall += absentCount;
      totalCompletedOverall += completedCount;
      if (avgScore !== null) {
        sumScoreOverall += avgScore;
        countScoredOverall += 1;
      }

      return {
        sessionId: session.id,
        sessionPin: session.sessionPin,
        status: session.status,
        mode: session.mode,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
        teacher: {
          id: session.teacher?.id,
          fullName:
            `${session.teacher?.firstName || ''} ${session.teacher?.lastName || ''}`.trim() ||
            'Sin Asignar',
          email: session.teacher?.email,
          phoneNumber: session.teacher?.phoneNumber,
        },
        course: {
          id: session.course?.id,
          courseName: session.course?.courseName,
          courseModality: session.course?.courseModality,
          levelName: session.course?.level?.name,
          scheduleDays: session.course?.scheduleDays,
          startTime: session.course?.startTime,
          endTime: session.course?.endTime,
        },
        examTemplate: {
          id: session.examTemplate?.id,
          title: session.examTemplate?.title,
          examType: session.examTemplate?.examType,
          totalQuestions: session.examTemplate?.totalQuestions,
          durationMinutes: session.examTemplate?.durationMinutes,
        },
        metrics: {
          totalEnrolled,
          presentCount,
          absentCount,
          completedCount,
          attendanceRate:
            totalEnrolled > 0
              ? Number(((presentCount / totalEnrolled) * 100).toFixed(1))
              : 0,
          averageScore: avgScore,
        },
        students: attendees.map((a) => ({
          studentId: a.student?.id,
          fullName:
            `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim() ||
            a.student?.email,
          studentCode: a.student?.studentCode,
          phoneNumber: a.student?.phoneNumber,
          attendanceStatus: a.attendanceStatus,
          whatsappNotified: a.whatsappNotified,
          totalScore: a.totalScore,
          submittedAt: a.submittedAt,
        })),
      };
    });

    return {
      summary: {
        totalSessions: sessions.length,
        totalEnrolled: totalEnrolledOverall,
        totalPresent: totalPresentOverall,
        totalAbsent: totalAbsentOverall,
        overallAttendanceRate:
          totalEnrolledOverall > 0
            ? Number(
                ((totalPresentOverall / totalEnrolledOverall) * 100).toFixed(1),
              )
            : 0,
        averageScoreOverall:
          countScoredOverall > 0
            ? Number((sumScoreOverall / countScoredOverall).toFixed(2))
            : null,
      },
      sessions: list,
    };
  }

  async getStudentAcademicRecord(studentId: number) {
    const student = await this.userRepository.findOne({
      where: { id: studentId },
      relations: ['role'],
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    // 1. Obtener cursos en los que está inscrito el estudiante
    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['course', 'course.level', 'course.teacher'],
      order: { createdAt: 'DESC' },
    });

    const activeEnrollments = enrollments.map((e) => ({
      enrollmentId: e.id,
      courseId: e.course?.id,
      courseName: e.course?.courseName,
      courseModality: e.course?.courseModality,
      scheduleDays: e.course?.scheduleDays || [],
      startTime: e.course?.startTime,
      endTime: e.course?.endTime,
      classroom: e.course?.classroom,
      level: e.course?.level
        ? {
            id: e.course.level.id,
            code: e.course.level.code,
            name: e.course.level.name,
            levelType: e.course.level.levelType,
            hasFinalExam: e.course.level.hasFinalExam,
            orderIndex: e.course.level.orderIndex,
          }
        : null,
      teacher: e.course?.teacher
        ? {
            id: e.course.teacher.id,
            fullName:
              `${e.course.teacher.firstName || ''} ${e.course.teacher.lastName || ''}`.trim() ||
              e.course.teacher.email,
            email: e.course.teacher.email,
          }
        : null,
    }));

    const primaryCourse = activeEnrollments[0] || null;
    const currentLevel = primaryCourse?.level || null;

    // 2. Obtener todas las 21 fases del programa oficial ordenadas por orden académico
    const allLevels = await this.levelRepository.find({
      order: { orderIndex: 'ASC' },
    });

    // 3. Obtener registros de asistencia / exámenes presentados por el estudiante
    const attendees = await this.attendeeRepository.find({
      where: { student: { id: studentId } },
      relations: [
        'session',
        'session.course',
        'session.course.level',
        'session.examTemplate',
        'session.examTemplate.level',
        'session.teacher',
      ],
      order: { createdAt: 'DESC' },
    });

    // 4. Mapear cada una de las 21 fases con sus reactivos Midterm y Final
    const phases = allLevels.map((lvl) => {
      // Coincidencia por id o por código de nivel
      const matchingAttendees = attendees.filter((a) => {
        const tLevelId = a.session?.examTemplate?.level?.id;
        const cLevelId = a.session?.course?.level?.id;
        const tLevelCode = a.session?.examTemplate?.level?.code;
        const cLevelCode = a.session?.course?.level?.code;

        return (
          tLevelId === lvl.id ||
          cLevelId === lvl.id ||
          (tLevelCode && tLevelCode === lvl.code) ||
          (cLevelCode && cLevelCode === lvl.code)
        );
      });

      const midtermRecord = matchingAttendees.find(
        (a) => a.session?.examTemplate?.examType === 'MIDTERM',
      );

      const finalRecord = matchingAttendees.find(
        (a) => a.session?.examTemplate?.examType === 'FINAL',
      );

      const isTraining =
        lvl.levelType === LevelTypeEnum.TRAINING_APTIS ||
        lvl.code === 'TRAINING' ||
        !lvl.hasFinalExam;

      const midterm = {
        hasExam: true,
        attended: !!midtermRecord,
        status: midtermRecord
          ? midtermRecord.attendanceStatus
          : AttendanceStatusEnum.PENDING,
        score:
          midtermRecord?.totalScore != null
            ? Number(midtermRecord.totalScore)
            : null,
        submittedAt: midtermRecord?.submittedAt || null,
        sessionId: midtermRecord?.session?.id || null,
        sessionPin: midtermRecord?.session?.sessionPin || null,
        examTitle:
          midtermRecord?.session?.examTemplate?.title ||
          `Examen Intermedio - ${lvl.name}`,
        focusLossCount: midtermRecord?.focusLossCount || 0,
        isMakeup: midtermRecord?.isMakeup || false,
      };

      const finalExam = isTraining
        ? {
            hasExam: false,
            isAptis: true,
            attended: false,
            status: 'APTIS_OFFICIAL',
            score: null,
            submittedAt: null,
            sessionId: null,
            sessionPin: null,
            examTitle: 'Examen Oficial Internacional APTIS (British Council)',
            focusLossCount: 0,
            isMakeup: false,
            note: 'Esta fase culmina con la presentación del examen oficial APTIS para certificación internacional.',
          }
        : {
            hasExam: true,
            isAptis: false,
            attended: !!finalRecord,
            status: finalRecord
              ? finalRecord.attendanceStatus
              : AttendanceStatusEnum.PENDING,
            score:
              finalRecord?.totalScore != null
                ? Number(finalRecord.totalScore)
                : null,
            submittedAt: finalRecord?.submittedAt || null,
            sessionId: finalRecord?.session?.id || null,
            sessionPin: finalRecord?.session?.sessionPin || null,
            examTitle:
              finalRecord?.session?.examTemplate?.title ||
              `Examen Final - ${lvl.name}`,
            focusLossCount: finalRecord?.focusLossCount || 0,
            isMakeup: finalRecord?.isMakeup || false,
            note: null,
          };

      // Cálculo de promedio de fase
      const validScores: number[] = [];
      if (midterm.score !== null) validScores.push(midterm.score);
      if (finalExam.hasExam && finalExam.score !== null)
        validScores.push(finalExam.score);

      const phaseAverage =
        validScores.length > 0
          ? Number(
              (
                validScores.reduce((acc, curr) => acc + curr, 0) /
                validScores.length
              ).toFixed(2),
            )
          : null;

      const isCurrentLevel =
        activeEnrollments.some(
          (e) => e.level?.id === lvl.id || e.level?.code === lvl.code,
        ) || false;

      // Determinación de estado de fase
      let phaseStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' = 'PENDING';
      if (isTraining) {
        if (
          midterm.status === AttendanceStatusEnum.COMPLETED &&
          (midterm.score ?? 0) >= 3.0
        ) {
          phaseStatus = 'COMPLETED';
        } else if (isCurrentLevel || midterm.attended) {
          phaseStatus = 'IN_PROGRESS';
        }
      } else {
        if (
          midterm.status === AttendanceStatusEnum.COMPLETED &&
          finalExam.status === AttendanceStatusEnum.COMPLETED &&
          (phaseAverage ?? 0) >= 3.0
        ) {
          phaseStatus = 'COMPLETED';
        } else if (
          isCurrentLevel ||
          midterm.attended ||
          finalExam.attended
        ) {
          phaseStatus = 'IN_PROGRESS';
        }
      }

      return {
        levelId: lvl.id,
        code: lvl.code,
        name: lvl.name,
        levelType: lvl.levelType,
        hasFinalExam: lvl.hasFinalExam,
        orderIndex: lvl.orderIndex,
        isCurrentLevel,
        phaseStatus,
        phaseAverage,
        midterm,
        final: finalExam,
      };
    });

    // 5. Resumen general
    const completedExams = attendees.filter(
      (a) =>
        a.attendanceStatus === AttendanceStatusEnum.COMPLETED &&
        a.totalScore != null,
    );
    const allExamScores = completedExams.map((a) => Number(a.totalScore));
    const generalAverage =
      allExamScores.length > 0
        ? Number(
            (
              allExamScores.reduce((acc, curr) => acc + curr, 0) /
              allExamScores.length
            ).toFixed(2),
          )
        : null;

    const completedPhasesCount = phases.filter(
      (p) => p.phaseStatus === 'COMPLETED',
    ).length;

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName:
          `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
          student.email,
        email: student.email,
        phoneNumber: student.phoneNumber,
        studentCode: student.studentCode,
      },
      currentCourse: primaryCourse,
      enrolledCourses: activeEnrollments,
      summary: {
        currentLevelCode: currentLevel?.code || null,
        currentLevelName: currentLevel?.name || 'Sin fase activa asignada',
        totalExamsTaken: completedExams.length,
        generalAverage,
        completedPhasesCount,
        totalPhases: allLevels.length,
      },
      phases,
    };
  }
}
