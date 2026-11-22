import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';

@ApiTags('Courses')
@Controller({
  path: 'courses',
  version: '1',
})
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('teachers')
  async getTeachers() {
    return this.coursesService.getTeachers();
  }

  @Get('students')
  async getStudents() {
    return this.coursesService.getStudents();
  }

  @Post('teachers')
  async createTeacher(
    @Body()
    dto: {
      firstName: string;
      lastName: string;
      email: string;
      password?: string;
      phoneNumber?: string;
    },
  ) {
    return this.coursesService.createTeacher(dto);
  }

  @Post()
  async create(@Body() createDto: CreateCourseDto) {
    return this.coursesService.create(createDto);
  }

  @Get()
  @ApiQuery({ name: 'teacherId', required: false, type: Number })
  @ApiQuery({ name: 'day', required: false, type: String, example: 'TUESDAY' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query('teacherId') teacherId?: number,
    @Query('day') day?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.coursesService.findAll({
      teacherId: teacherId ? Number(teacherId) : undefined,
      day,
      isActive:
        isActive !== undefined ? String(isActive) === 'true' : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }

  @Post(':id/enroll')
  async enrollStudent(@Param('id') id: string, @Body() dto: EnrollStudentDto) {
    return this.coursesService.enrollStudent(id, dto.studentId);
  }

  @Delete(':id/enroll/:studentId')
  async unenrollStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.coursesService.unenrollStudent(id, Number(studentId));
  }

  @Get(':id/roster')
  async getRoster(@Param('id') id: string) {
    return this.coursesService.getCourseRoster(id);
  }
}
