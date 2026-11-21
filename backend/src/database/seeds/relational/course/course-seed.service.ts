import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { CourseEnrollmentEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course-enrollment.entity';
import { LevelEntity } from '../../../../levels/infrastructure/persistence/relational/entities/level.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import {
  CourseModalityEnum,
  EnrollmentStatusEnum,
} from '../../../../courses/courses.enum';

@Injectable()
export class CourseSeedService {
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

  async run() {
    // Buscar profesor
    const teacher = await this.userRepository.findOne({
      where: { email: 'teacher@example.com' },
    });

    if (!teacher) return;

    // Buscar estudiante
    const student = await this.userRepository.findOne({
      where: { email: 'student@example.com' },
    });

    // 1. Curso Regular (Nivel 4A)
    const level4A = await this.levelRepository.findOne({
      where: { code: '4A' },
    });

    if (level4A) {
      let courseRegular = await this.courseRepository.findOne({
        where: { courseName: 'Inglés 4A - Mar/Mié/Jue Mañana' },
      });

      if (!courseRegular) {
        courseRegular = await this.courseRepository.save(
          this.courseRepository.create({
            courseName: 'Inglés 4A - Mar/Mié/Jue Mañana',
            level: level4A,
            teacher,
            courseModality: CourseModalityEnum.REGULAR_GROUP,
            capacity: 8,
            scheduleDays: ['TUESDAY', 'WEDNESDAY', 'THURSDAY'],
            startTime: '10:00:00',
            endTime: '12:00:00',
            classroom: 'Aula 2',
            term: '2026-I',
            isActive: true,
          }),
        );

        if (student) {
          await this.enrollmentRepository.save(
            this.enrollmentRepository.create({
              course: courseRegular,
              student,
              enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
            }),
          );
        }
      }
    }

    // 2. Curso Personalizado 1-a-1 (Nivel 7B)
    const level7B = await this.levelRepository.findOne({
      where: { code: '7B' },
    });

    if (level7B) {
      const coursePersonalized = await this.courseRepository.findOne({
        where: { courseName: 'Inglés 7B - Particular' },
      });

      if (!coursePersonalized) {
        await this.courseRepository.save(
          this.courseRepository.create({
            courseName: 'Inglés 7B - Particular',
            level: level7B,
            teacher,
            courseModality: CourseModalityEnum.PERSONALIZED_1ON1,
            capacity: 1,
            scheduleDays: ['MONDAY', 'WEDNESDAY'],
            startTime: '16:00:00',
            endTime: '17:30:00',
            classroom: 'Virtual / Meet',
            term: '2026-I',
            isActive: true,
          }),
        );
      }
    }

    // 3. Curso Training (APTIS Prep)
    const levelTraining = await this.levelRepository.findOne({
      where: { code: 'TRAINING' },
    });

    if (levelTraining) {
      const courseTraining = await this.courseRepository.findOne({
        where: { courseName: 'Inglés Training - APTIS Prep' },
      });

      if (!courseTraining) {
        await this.courseRepository.save(
          this.courseRepository.create({
            courseName: 'Inglés Training - APTIS Prep',
            level: levelTraining,
            teacher,
            courseModality: CourseModalityEnum.REGULAR_GROUP,
            capacity: 8,
            scheduleDays: ['SATURDAY'],
            startTime: '08:00:00',
            endTime: '12:00:00',
            classroom: 'Aula Magna',
            term: '2026-I',
            isActive: true,
          }),
        );
      }
    }
  }
}
