import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { CourseEntity } from './infrastructure/persistence/relational/entities/course.entity';
import { CourseEnrollmentEntity } from './infrastructure/persistence/relational/entities/course-enrollment.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { LevelEntity } from '../levels/infrastructure/persistence/relational/entities/level.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { EnrollmentStatusEnum } from './courses.enum';
import { RoleEnum } from '../roles/roles.enum';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
    @InjectRepository(CourseEnrollmentEntity)
    private readonly enrollmentRepository: Repository<CourseEnrollmentEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateCourseDto): Promise<CourseEntity> {
    const level = await this.levelRepository.findOne({
      where: { id: dto.levelId },
    });

    if (!level) {
      throw new NotFoundException(`Level with id ${dto.levelId} not found`);
    }

    let teacher: UserEntity | null = null;
    if (dto.teacherId) {
      teacher = await this.userRepository.findOne({
        where: { id: dto.teacherId, role: { id: RoleEnum.teacher } },
      });

      if (!teacher) {
        throw new NotFoundException(
          `Teacher with id ${dto.teacherId} not found or is not a teacher`,
        );
      }
    }

    const course = this.courseRepository.create({
      ...dto,
      level,
      teacher,
    });

    return this.courseRepository.save(course);
  }

  async findAll(params?: {
    teacherId?: number;
    day?: string;
    isActive?: boolean;
  }): Promise<CourseEntity[]> {
    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.level', 'level')
      .leftJoinAndSelect('course.teacher', 'teacher')
      .leftJoinAndSelect('course.enrollments', 'enrollments')
      .leftJoinAndSelect('enrollments.student', 'student');

    if (params?.teacherId) {
      query.andWhere('course.teacherId = :teacherId', {
        teacherId: params.teacherId,
      });
    }

    if (params?.day) {
      query.andWhere('course.scheduleDays LIKE :day', {
        day: `%${params.day.toUpperCase()}%`,
      });
    }

    if (params?.isActive !== undefined) {
      query.andWhere('course.isActive = :isActive', {
        isActive: params.isActive,
      });
    }

    query.orderBy('course.startTime', 'ASC');

    return query.getMany();
  }

  async findOne(id: string): Promise<CourseEntity> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['level', 'teacher', 'enrollments', 'enrollments.student'],
    });

    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    return course;
  }

  async enrollStudent(
    courseId: string,
    studentId: number,
  ): Promise<CourseEnrollmentEntity> {
    const course = await this.findOne(courseId);

    const student = await this.userRepository.findOne({
      where: { id: studentId, role: { id: RoleEnum.student } },
    });

    if (!student) {
      throw new NotFoundException(
        `Student with id ${studentId} not found or is not a student`,
      );
    }

    // Check capacity
    const currentActiveCount = await this.enrollmentRepository.count({
      where: {
        course: { id: courseId },
        enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
      },
    });

    if (currentActiveCount >= course.capacity) {
      throw new BadRequestException(
        `Course has reached its maximum capacity of ${course.capacity} students`,
      );
    }

    // Check existing enrollment
    const existing = await this.enrollmentRepository.findOne({
      where: {
        course: { id: courseId },
        student: { id: studentId },
      },
    });

    if (existing) {
      if (existing.enrollmentStatus === EnrollmentStatusEnum.ACTIVE) {
        throw new BadRequestException(
          'Student is already enrolled in this course',
        );
      }
      existing.enrollmentStatus = EnrollmentStatusEnum.ACTIVE;
      return this.enrollmentRepository.save(existing);
    }

    const enrollment = this.enrollmentRepository.create({
      course,
      student,
      enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async getCourseRoster(courseId: string): Promise<CourseEnrollmentEntity[]> {
    await this.findOne(courseId);

    return this.enrollmentRepository.find({
      where: {
        course: { id: courseId },
        enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
      },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
  }

  async getTeachers(): Promise<any[]> {
    const teachers = await this.userRepository.find({
      where: { role: { id: RoleEnum.teacher } },
      order: { firstName: 'ASC' },
    });

    const courses = await this.courseRepository.find({
      relations: ['level', 'enrollments'],
    });

    return teachers.map((teacher) => {
      const teacherCourses = courses.filter(
        (c) => c.teacher && c.teacher.id === teacher.id,
      );
      return {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        fullName: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
        email: teacher.email,
        phoneNumber: teacher.phoneNumber,
        studentCode: teacher.studentCode,
        status: teacher.status,
        assignedCoursesCount: teacherCourses.length,
        courses: teacherCourses.map((tc) => ({
          id: tc.id,
          courseName: tc.courseName,
          levelName: tc.level?.name,
          scheduleDays: tc.scheduleDays,
          startTime: tc.startTime,
          endTime: tc.endTime,
          enrolledCount: tc.enrollments?.length || 0,
        })),
      };
    });
  }

  async createTeacher(dto: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber?: string;
  }): Promise<any> {
    const cleanEmail = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({
      where: { email: cleanEmail },
    });
    if (existing) {
      throw new BadRequestException(
        `El correo electrónico ${cleanEmail} ya se encuentra registrado.`,
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password || 'secret', salt);

    const teacher = this.userRepository.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phoneNumber: dto.phoneNumber?.trim() || null,
      provider: 'email',
      role: { id: RoleEnum.teacher },
      status: { id: 1 },
    });

    const saved = await this.userRepository.save(teacher);
    return {
      id: saved.id,
      firstName: saved.firstName,
      lastName: saved.lastName,
      fullName: `${saved.firstName || ''} ${saved.lastName || ''}`.trim(),
      email: saved.email,
      phoneNumber: saved.phoneNumber,
      role: saved.role,
      status: saved.status,
    };
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);
    return { success: true, message: `Curso ${id} eliminado correctamente` };
  }
}
