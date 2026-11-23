'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  api,
  Course,
  ExamTemplate,
  AuthUser,
  TeacherData,
  RegisteredStudentData,
} from '../../lib/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Play,
  Loader2,
  BookOpen,
  X,
  GraduationCap,
  LogOut,
  ShieldCheck,
  Building2,
  Filter,
  FileSpreadsheet,
  Search,
  MessageCircle,
  ExternalLink,
  Mail,
  Phone,
  UserPlus,
  Layers,
} from 'lucide-react';
import RoleGuard from '../../components/auth/RoleGuard';
import CourseExamManagerModal from '../../components/teacher/CourseExamManagerModal';
import CourseRosterModal from '../../components/teacher/CourseRosterModal';

const DAYS_FILTER = [
  { label: 'Todos los días', value: '' },
  { label: 'Lunes', value: 'MONDAY' },
  { label: 'Martes', value: 'TUESDAY' },
  { label: 'Miércoles', value: 'WEDNESDAY' },
  { label: 'Jueves', value: 'THURSDAY' },
  { label: 'Viernes', value: 'FRIDAY' },
  { label: 'Sábado', value: 'SATURDAY' },
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

function formatScheduleDays(days?: string[]): string {
  if (!days || days.length === 0) return 'Días por programar';
  return days.map((d) => DAY_LABELS[d] || d).join(', ');
}

function formatTime(t?: string): string {
  if (!t) return '';
  const parts = t.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }
  return t;
}

function formatTimeRange(start?: string, end?: string): string {
  if (!start && !end) return 'Horario por definir';
  if (start && end) return `${formatTime(start)} - ${formatTime(end)}`;
  return formatTime(start || end);
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [adminTeacherId, setAdminTeacherId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Course Roster & Student Directory state
  const [rosterCourse, setRosterCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'COURSES' | 'STUDENTS'>('COURSES');
  const [students, setStudents] = useState<RegisteredStudentData[]>([]);
  const [allTeacherCourses, setAllTeacherCourses] = useState<Course[]>([]);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Modal Launch Session state
  const [examManagerCourse, setExamManagerCourse] = useState<Course | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedMode, setSelectedMode] = useState<'FREE_PACE' | 'SYNC_BLOCKS'>('FREE_PACE');
  const [launching, setLaunching] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const loadStudents = async () => {
    try {
      setStudentsLoading(true);
      const data = await api.getStudents();
      setStudents(data);
    } catch (err: any) {
      console.error('Error al cargar lista de estudiantes:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadAllTeacherCourses = async (
    user?: AuthUser | null,
    teacherFilter?: string,
  ) => {
    try {
      const params: { teacherId?: number } = {};
      if (user?.role?.id === 2) {
        params.teacherId = user.id;
      } else if (user?.role?.id === 1 && teacherFilter) {
        params.teacherId = Number(teacherFilter);
      }
      const data = await api.getCourses(params);
      setAllTeacherCourses(data);
    } catch (err: any) {
      console.error('Error al cargar cursos para fases:', err);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cambridge_user');
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        setCurrentUser(parsed);
        if (parsed.role?.id === 1) {
          api.getTeachers().then(setTeachers).catch(() => {});
        }
      }
    } catch {}
    setUserLoaded(true);
    loadStudents();
  }, []);

  useEffect(() => {
    if (!userLoaded) return;
    loadCourses(selectedDay, currentUser, adminTeacherId);
    loadAllTeacherCourses(currentUser, adminTeacherId);
  }, [selectedDay, userLoaded, currentUser?.id, adminTeacherId]);

  const loadCourses = async (
    day?: string,
    user?: AuthUser | null,
    teacherFilter?: string,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params: { day?: string; teacherId?: number } = {};
      if (day) params.day = day;

      if (user?.role?.id === 2) {
        // Teacher: STRICT ISOLATION - ONLY their own assigned courses
        params.teacherId = user.id;
      } else if (user?.role?.id === 1 && teacherFilter) {
        // Admin: optional filter by selected teacher
        params.teacherId = Number(teacherFilter);
      }

      const data = await api.getCourses(params);
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cambridge_token');
    localStorage.removeItem('cambridge_user');
    router.push('/');
  };

  const handleOpenLaunchModal = async (course: Course) => {
    setActiveCourse(course);
    setSelectedTemplateId('');
    setSelectedMode('FREE_PACE');
    setModalLoading(true);

    try {
      const availableTemplates = await api.getTemplates(course.level.id, course.id);
      setTemplates(availableTemplates);
      if (availableTemplates.length > 0) {
        setSelectedTemplateId(availableTemplates[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar plantillas para este nivel');
    } finally {
      setModalLoading(false);
    }
  };

  const handleLaunchSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !selectedTemplateId) return;

    try {
      setLaunching(true);
      const session = await api.createSession({
        courseId: activeCourse.id,
        examTemplateId: selectedTemplateId,
        mode: selectedMode,
      });

      // Redirect to the teacher monitor for this session
      router.push(`/teacher/sessions/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar la sesión');
      setLaunching(false);
    }
  };

  // Unique phases/levels assigned to this teacher
  const assignedPhases = useMemo(() => {
    const map = new Map<
      number,
      {
        levelId: number;
        levelName: string;
        levelCode: string;
        courses: Course[];
      }
    >();

    allTeacherCourses.forEach((c) => {
      if (c.level) {
        if (!map.has(c.level.id)) {
          map.set(c.level.id, {
            levelId: c.level.id,
            levelName: c.level.name,
            levelCode: c.level.code || c.level.name,
            courses: [c],
          });
        } else {
          map.get(c.level.id)!.courses.push(c);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.levelName.localeCompare(b.levelName),
    );
  }, [allTeacherCourses]);

  const searchedStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const term = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(term)) ||
        (s.phoneNumber && s.phoneNumber.includes(term)),
    );
  }, [students, studentSearch]);

  const phaseSections = useMemo(() => {
    return assignedPhases.map((phase) => {
      const phaseStudents = searchedStudents.filter((student) =>
        student.enrolledCourses?.some(
          (c) =>
            c.levelId === phase.levelId ||
            c.levelName === phase.levelName ||
            phase.courses.some((pc) => pc.id === c.id),
        ),
      );

      return {
        ...phase,
        students: phaseStudents,
      };
    });
  }, [assignedPhases, searchedStudents]);

  const unassignedStudents = useMemo(() => {
    return searchedStudents.filter(
      (s) => !s.enrolledCourses || s.enrolledCourses.length === 0,
    );
  }, [searchedStudents]);

  const totalAssignedStudentsCount = useMemo(() => {
    const studentIds = new Set<number>();
    phaseSections.forEach((sec) => {
      sec.students.forEach((s) => studentIds.add(s.id));
    });
    return studentIds.size;
  }, [phaseSections]);

  const filteredStudents = searchedStudents;

  const isAdmin = currentUser?.role?.id === 1;

  return (
    <RoleGuard allowedRoleIds={[1, 2]} sectionName="el Panel Docente">
      <div className="flex-1 max-w-container mx-auto w-full px-4 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-rule gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center text-xs text-accent hover:underline font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Volver al Panel Administrativo
                </Link>
              ) : (
                <span className="inline-flex items-center text-xs text-accent font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Portal Docente
                </span>
              )}

              {currentUser && (
                <span className="text-xs text-ink-muted">
                  · Conectado como{' '}
                  <strong className="text-ink">
                    {currentUser.firstName
                      ? `${currentUser.firstName} (${currentUser.role.name})`
                      : currentUser.email}
                  </strong>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-danger hover:underline inline-flex items-center space-x-0.5 ml-2 cursor-pointer"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-3 h-3 inline mr-0.5" />
                    <span>Salir</span>
                  </button>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-ink">
              {isAdmin
                ? 'Panel Docente — Vista Administrativa'
                : 'Panel Docente — Mis Cursos Asignados'}
            </h1>
            <p className="text-xs text-ink-muted">
              {isAdmin
                ? 'Monitorea todas las clases y abre sesiones de examen en representación de los docentes'
                : 'Gestiona tus grupos asignados, inicia exámenes oficiales y controla la asistencia en vivo'}
            </p>
          </div>

          {/* Right Header Controls */}
          <div className="flex flex-col items-end gap-2.5">
            {/* Admin Teacher Filter */}
            {isAdmin && (
              <div className="flex items-center space-x-2 text-xs">
                <label
                  htmlFor="admin-teacher-select"
                  className="font-semibold text-ink-muted flex items-center"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  Docente:
                </label>
                <select
                  id="admin-teacher-select"
                  value={adminTeacherId}
                  onChange={(e) => setAdminTeacherId(e.target.value)}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-btn border border-rule bg-paper-card text-ink focus:border-accent"
                >
                  <option value="">Todos los docentes ({teachers.length})</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName || `${t.firstName} ${t.lastName}`} ({t.assignedCoursesCount} clases)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isAdmin && (
              <span className="text-xs bg-paper-muted border border-rule px-3 py-1 rounded-btn font-medium text-ink">
                Mis Cursos ({courses.length})
              </span>
            )}

            {/* Day Filter Pills */}
            {activeTab === 'COURSES' && (
              <div className="flex flex-wrap gap-1.5">
                {DAYS_FILTER.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setSelectedDay(d.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-btn border cursor-pointer ${
                      selectedDay === d.value
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper-card text-ink border-rule hover:border-rule-strong'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-rule pt-4 pb-2 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('COURSES')}
            className={`px-4 py-2 text-xs font-bold rounded-btn transition-[background-color,color] cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COURSES'
                ? 'bg-ink text-paper shadow-xs'
                : 'bg-paper-card text-ink-muted hover:text-ink hover:bg-paper-muted border border-rule'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mis Cursos Asignados ({courses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-4 py-2 text-xs font-bold rounded-btn transition-[background-color,color] cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'STUDENTS'
                ? 'bg-ink text-paper shadow-xs'
                : 'bg-paper-card text-ink-muted hover:text-ink hover:bg-paper-muted border border-rule'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Directorio de Estudiantes ({totalAssignedStudentsCount})</span>
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mt-4 p-3 bg-danger-soft border border-danger/20 rounded-btn text-xs text-danger font-medium">
            {error}
          </div>
        )}

        {/* Courses Grid */}
        {activeTab === 'COURSES' && (
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center p-12 text-ink-muted">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Cargando cursos asignados...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="p-12 text-center bg-paper-card border border-rule rounded-card text-ink-muted text-sm space-y-2">
                <p className="font-semibold text-ink">
                  {!isAdmin
                    ? selectedDay
                      ? `No tienes clases asignadas los ${
                          DAYS_FILTER.find((d) => d.value === selectedDay)?.label || 'días seleccionados'
                        }.`
                      : 'No tienes clases asignadas actualmente en este período.'
                    : 'No se encontraron cursos programados para el filtro seleccionado.'}
                </p>
                <p className="text-xs text-ink-muted">
                  {selectedDay && (
                    <button
                      type="button"
                      onClick={() => setSelectedDay('')}
                      className="text-accent hover:underline font-semibold cursor-pointer"
                    >
                      Ver todos los días
                    </button>
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course) => {
                  const startTime = course.startTime || course.scheduleStartTime;
                  const endTime = course.endTime || course.scheduleEndTime;
                  const capacity = course.capacity || course.maxCapacity || 8;
                  const teacherName = course.teacher
                    ? course.teacher.fullName || `${course.teacher.firstName} ${course.teacher.lastName}`
                    : null;

                  return (
                    <div
                      key={course.id}
                      className="bg-paper-card border border-rule hover:border-rule-strong rounded-card p-5 flex flex-col justify-between space-y-4 shadow-xs"
                    >
                      <div className="space-y-3">
                        {/* Badges */}
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 bg-accent-soft text-accent text-xs font-bold rounded">
                            {course.level?.name || 'Nivel'}
                          </span>
                          <span className="text-[11px] font-medium text-ink-muted bg-paper-muted px-2 py-0.5 rounded">
                            {course.courseModality === 'REGULAR_GROUP'
                              ? 'Grupo Regular'
                              : course.courseModality === 'PERSONALIZED_1ON1'
                              ? 'Particular 1-a-1'
                              : 'Semipersonalizado'}
                          </span>
                        </div>

                        <h2 className="text-base font-bold text-ink leading-snug">
                          {course.courseName}
                        </h2>

                        {/* Teacher label (visible to Admin) */}
                        {isAdmin && teacherName && (
                          <div className="text-xs text-accent font-medium">
                            Docente: <strong className="text-ink">{teacherName}</strong>
                          </div>
                        )}

                        {/* Schedule Details */}
                        <div className="space-y-1.5 text-xs text-ink-muted">
                          <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-ink-muted" />
                            <span className="font-medium text-ink">
                              {formatScheduleDays(course.scheduleDays)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-ink-muted" />
                            <span>
                              {formatTimeRange(startTime, endTime)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-ink-muted" />
                            <span className={course.enrollments?.length ? 'font-medium text-ink' : ''}>
                              {course.enrollments?.length || 0} / {capacity} alumnos matriculados
                            </span>
                          </div>
                          {course.classroom && (
                            <div className="flex items-center">
                              <Building2 className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-ink-muted" />
                              <span>{course.classroom}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-rule flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setRosterCourse(course)}
                          className="py-2.5 px-3 bg-paper border border-rule hover:border-rule-strong text-ink text-xs font-semibold rounded-btn inline-flex items-center justify-center space-x-1.5 cursor-pointer flex-shrink-0"
                          title="Ver y gestionar lista oficial de alumnos matriculados"
                        >
                          <Users className="w-3.5 h-3.5 text-accent" />
                          <span>Alumnos ({course.enrollments?.length || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExamManagerCourse(course)}
                          className="py-2.5 px-3 bg-paper border border-rule hover:border-rule-strong text-ink text-xs font-semibold rounded-btn inline-flex items-center justify-center space-x-1.5 cursor-pointer flex-shrink-0"
                          title="Gestionar, crear o importar exámenes de este curso"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
                          <span>Exámenes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenLaunchModal(course)}
                          className="flex-1 py-2.5 px-3 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-semibold rounded-btn inline-flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Iniciar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Student Directory View - Separated by Assigned Phases */}
        {activeTab === 'STUDENTS' && (
          <div className="mt-6 space-y-6">
            {/* Search and Stats Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-paper-card border border-rule rounded-card p-4 shadow-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-ink-muted absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar por nombre, código institucional, correo o teléfono..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-btn border border-rule bg-paper text-ink focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-ink-muted">
                <span>
                  Fases Asignadas: <strong className="text-ink font-bold">{assignedPhases.length}</strong>
                </span>
                <span>·</span>
                <span>
                  Estudiantes en mis Fases:{' '}
                  <strong className="text-ink font-bold">
                    {totalAssignedStudentsCount}
                  </strong>
                </span>
              </div>
            </div>

            {/* Filter Pills for Assigned Phases */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-ink-muted mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span>Fases Asignadas:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedPhaseFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-btn transition-[background-color,color] cursor-pointer ${
                  selectedPhaseFilter === 'ALL'
                    ? 'bg-ink text-paper shadow-xs'
                    : 'bg-paper-card border border-rule text-ink-muted hover:text-ink hover:bg-paper-muted'
                }`}
              >
                Todas mis Fases ({totalAssignedStudentsCount})
              </button>

              {phaseSections.map((sec) => (
                <button
                  key={sec.levelId}
                  type="button"
                  onClick={() => setSelectedPhaseFilter(String(sec.levelId))}
                  className={`px-3 py-1.5 text-xs font-bold rounded-btn transition-[background-color,color] cursor-pointer flex items-center gap-1.5 ${
                    selectedPhaseFilter === String(sec.levelId)
                      ? 'bg-ink text-paper shadow-xs'
                      : 'bg-paper-card border border-rule text-ink-muted hover:text-ink hover:bg-paper-muted'
                  }`}
                >
                  <span>{sec.levelName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      selectedPhaseFilter === String(sec.levelId)
                        ? 'bg-paper/20 text-paper font-bold'
                        : 'bg-accent-soft text-accent font-bold'
                    }`}
                  >
                    {sec.students.length}
                  </span>
                </button>
              ))}

              {unassignedStudents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPhaseFilter('UNASSIGNED')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-btn transition-[background-color,color] cursor-pointer flex items-center gap-1.5 ${
                    selectedPhaseFilter === 'UNASSIGNED'
                      ? 'bg-ink text-paper shadow-xs'
                      : 'bg-paper-card border border-rule text-ink-muted hover:text-ink hover:bg-paper-muted'
                  }`}
                >
                  <span>Sin Fase Asignada</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-warning-soft text-warning font-bold">
                    {unassignedStudents.length}
                  </span>
                </button>
              )}
            </div>

            {/* Students Content */}
            {studentsLoading ? (
              <div className="py-16 text-center text-ink-muted text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Cargando estudiantes por fase...</span>
              </div>
            ) : assignedPhases.length === 0 ? (
              <div className="p-12 text-center bg-paper-card border border-rule rounded-card text-ink-muted text-xs space-y-1">
                <p className="font-semibold text-ink">
                  No tienes fases o cursos asignados actualmente.
                </p>
                <p className="text-[11px] text-ink-muted">
                  Cuando la coordinación académica te asigne cursos o niveles, aquí verás los estudiantes matriculados organizados por fase.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Render Phase Sections */}
                {phaseSections
                  .filter(
                    (sec) =>
                      selectedPhaseFilter === 'ALL' ||
                      selectedPhaseFilter === String(sec.levelId),
                  )
                  .map((sec) => (
                    <div
                      key={sec.levelId}
                      className="bg-paper-card border border-rule rounded-card overflow-hidden shadow-xs space-y-0"
                    >
                      {/* Phase Header */}
                      <div className="p-4 bg-paper-muted/60 border-b border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-accent text-accent-ink text-xs font-bold rounded shadow-xs">
                              {sec.levelName}
                            </span>
                            <span className="text-xs text-ink-muted">
                              {sec.courses.length}{' '}
                              {sec.courses.length === 1
                                ? 'curso asignado'
                                : 'cursos asignados'}
                              :{' '}
                              <strong className="text-ink">
                                {sec.courses.map((c) => c.courseName).join(', ')}
                              </strong>
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-muted">
                            {sec.students.length}{' '}
                            {sec.students.length === 1
                              ? 'estudiante registrado en esta fase'
                              : 'estudiantes registrados en esta fase'}
                          </p>
                        </div>

                        {sec.courses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setRosterCourse(sec.courses[0])}
                            className="px-3 py-1.5 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-semibold rounded-btn inline-flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto transition-[background-color]"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Matricular en {sec.levelCode}</span>
                          </button>
                        )}
                      </div>

                      {/* Phase Table */}
                      {sec.students.length === 0 ? (
                        <div className="p-8 text-center text-ink-muted text-xs space-y-2">
                          <Users className="w-8 h-8 text-ink-muted mx-auto opacity-40" />
                          <p className="font-semibold text-ink">
                            No hay estudiantes matriculados en {sec.levelName} todavía.
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            Puedes matricular estudiantes registrados usando el botón superior.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-rule bg-paper-muted/30 text-ink-muted font-semibold">
                                <th className="py-2.5 px-4">Estudiante Registrado</th>
                                <th className="py-2.5 px-4">Código Institucional</th>
                                <th className="py-2.5 px-4">Correo</th>
                                <th className="py-2.5 px-4">Teléfono / WhatsApp</th>
                                <th className="py-2.5 px-4">Curso en esta Fase</th>
                                <th className="py-2.5 px-4 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-rule">
                              {sec.students.map((student) => {
                                const cleanPhone = student.phoneNumber
                                  ? student.phoneNumber.replace(/[^0-9]/g, '')
                                  : null;
                                const whatsappUrl = cleanPhone
                                  ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                      `Hola ${student.firstName}, te contacto desde Cambridge Academy respecto a tu curso de ${sec.levelName}.`,
                                    )}`
                                  : null;

                                const phaseCourse = student.enrolledCourses?.find(
                                  (c) =>
                                    c.levelId === sec.levelId ||
                                    c.levelName === sec.levelName ||
                                    sec.courses.some((pc) => pc.id === c.id),
                                );
                                const targetCourseObj =
                                  sec.courses.find(
                                    (c) => c.id === phaseCourse?.id,
                                  ) || sec.courses[0];

                                return (
                                  <tr
                                    key={student.id}
                                    className="hover:bg-paper-muted/40 transition-[background-color]"
                                  >
                                    <td className="py-2.5 px-4">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-accent-soft text-accent font-bold flex items-center justify-center text-xs shrink-0">
                                          {student.firstName?.[0] || 'E'}
                                          {student.lastName?.[0] || 'S'}
                                        </div>
                                        <div>
                                          <div className="font-bold text-ink">
                                            {student.fullName}
                                          </div>
                                          <div className="text-[10px] text-ink-muted">
                                            Registrado:{' '}
                                            {new Date(
                                              student.createdAt,
                                            ).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="py-2.5 px-4 font-mono font-bold text-accent">
                                      {student.studentCode || (
                                        <span className="text-ink-muted/50 font-normal italic">
                                          Sin código
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-2.5 px-4 text-ink-muted">
                                      <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3 opacity-60" />
                                        <span>{student.email}</span>
                                      </div>
                                    </td>

                                    <td className="py-2.5 px-4">
                                      {whatsappUrl ? (
                                        <a
                                          href={whatsappUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-2 py-0.5 bg-success-soft text-success hover:bg-success hover:text-paper font-semibold rounded text-[11px] transition-[background-color,color] gap-1 cursor-pointer"
                                          title="Contactar por WhatsApp"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                          <span>{student.phoneNumber}</span>
                                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                        </a>
                                      ) : (
                                        <span className="text-ink-muted/50 italic text-[11px]">
                                          Sin teléfono
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-2.5 px-4">
                                      {phaseCourse ? (
                                        <span className="px-2 py-0.5 bg-paper-muted text-ink border border-rule rounded text-[10px] font-medium">
                                          {phaseCourse.courseName}
                                        </span>
                                      ) : (
                                        <span className="text-ink-muted/50 italic text-[10px]">
                                          Matriculado en la fase
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-2.5 px-4 text-right">
                                      {targetCourseObj && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setRosterCourse(targetCourseObj)
                                          }
                                          className="px-2.5 py-1 bg-paper border border-rule hover:border-rule-strong text-ink hover:text-accent font-semibold rounded text-[11px] inline-flex items-center gap-1 cursor-pointer transition-[border-color,color]"
                                          title="Abrir lista y matrícula de este curso"
                                        >
                                          <UserPlus className="w-3 h-3 text-accent" />
                                          <span>Gestionar Matrícula</span>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}

                {/* Section for Unassigned Registered Students (if active or ALL) */}
                {(selectedPhaseFilter === 'UNASSIGNED' ||
                  (selectedPhaseFilter === 'ALL' &&
                    unassignedStudents.length > 0)) && (
                  <div className="bg-paper-card border border-rule rounded-card overflow-hidden shadow-xs space-y-0">
                    <div className="p-4 bg-paper-muted/60 border-b border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-warning-soft text-warning text-xs font-bold rounded">
                            Disponibles para Matricular
                          </span>
                          <span className="text-xs font-bold text-ink">
                            Estudiantes Registrados Sin Fase Asignada
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          Alumnos registrados en Cambridge Academy que aún no tienen ningún curso o fase asignada
                        </p>
                      </div>

                      {allTeacherCourses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setRosterCourse(allTeacherCourses[0])}
                          className="px-3 py-1.5 bg-paper border border-rule hover:border-rule-strong text-ink font-semibold rounded-btn text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-accent" />
                          <span>Matricular en un Curso</span>
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-rule bg-paper-muted/30 text-ink-muted font-semibold">
                            <th className="py-2.5 px-4">Estudiante</th>
                            <th className="py-2.5 px-4">Código Institucional</th>
                            <th className="py-2.5 px-4">Correo</th>
                            <th className="py-2.5 px-4">Teléfono</th>
                            <th className="py-2.5 px-4 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rule">
                          {unassignedStudents.map((student) => (
                            <tr
                              key={student.id}
                              className="hover:bg-paper-muted/40 transition-[background-color]"
                            >
                              <td className="py-2.5 px-4 font-bold text-ink">
                                {student.fullName}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold text-accent">
                                {student.studentCode || (
                                  <span className="text-ink-muted/50 font-normal italic">
                                    Sin código
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-ink-muted">
                                {student.email}
                              </td>
                              <td className="py-2.5 px-4 text-ink-muted">
                                {student.phoneNumber || '---'}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                {allTeacherCourses.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRosterCourse(allTeacherCourses[0])
                                    }
                                    className="px-2.5 py-1 bg-accent text-accent-ink hover:bg-accent-hover font-semibold rounded text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    <span>Asignar a Fase</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal: Launch Exam Session */}
        {activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4">
            <div className="bg-paper-card border border-rule rounded-card max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-rule">
                <div>
                  <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                    {activeCourse.level.name}
                  </span>
                  <h3 className="text-base font-bold text-ink">
                    Configurar Sesión de Examen
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCourse(null)}
                  className="p-1 text-ink-muted hover:text-ink rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {modalLoading ? (
                <div className="py-8 text-center text-ink-muted text-xs flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Cargando exámenes oficiales...</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="p-4 bg-paper-muted rounded-card text-xs text-ink-muted text-center space-y-1">
                  <p className="font-medium text-ink">No hay exámenes oficiales para este nivel</p>
                  <p className="text-[11px]">La Coordinación Académica debe registrar una plantilla para {activeCourse.level?.name || 'este nivel'}.</p>
                </div>
              ) : (
                <form onSubmit={handleLaunchSession} className="space-y-4">
                  {/* Template Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                      Seleccionar Examen para la Sesión:
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full text-xs font-medium p-2.5 rounded-card border border-rule bg-paper-card text-ink focus:border-accent"
                    >
                      {templates.some((t) => Boolean(t.course?.id)) && (
                        <optgroup label="🌟 Exámenes Personalizados de este Curso">
                          {templates
                            .filter((t) => Boolean(t.course?.id))
                            .map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.title} ({tpl.examType}) — {tpl.durationMinutes} min
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {templates.some((t) => !t.course?.id) && (
                        <optgroup label="🏛️ Exámenes Oficiales de Coordinación">
                          {templates
                            .filter((t) => !t.course?.id)
                            .map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.title} ({tpl.examType}) — {tpl.durationMinutes} min
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Mode Selector (3-in-1) */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                      Modalidad de Evaluación:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMode('FREE_PACE')}
                        className={`p-3 text-left rounded-card border text-xs cursor-pointer ${
                          selectedMode === 'FREE_PACE'
                            ? 'border-accent bg-accent-soft text-accent ring-1 ring-accent font-semibold'
                            : 'border-rule hover:border-rule-strong bg-paper-card text-ink'
                        }`}
                      >
                        <div className="font-bold mb-0.5">Ritmo Libre</div>
                        <div className="text-[10px] text-ink-muted">
                          Cada alumno avanza a su velocidad con PIN
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMode('SYNC_BLOCKS')}
                        className={`p-3 text-left rounded-card border text-xs cursor-pointer ${
                          selectedMode === 'SYNC_BLOCKS'
                            ? 'border-accent bg-accent-soft text-accent ring-1 ring-accent font-semibold'
                            : 'border-rule hover:border-rule-strong bg-paper-card text-ink'
                        }`}
                      >
                        <div className="font-bold mb-0.5">Bloques Sincronizados</div>
                        <div className="text-[10px] text-ink-muted">
                          Pantalla grupal (bloques de 5 preguntas)
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center space-x-2 pt-3 border-t border-rule">
                    <button
                      type="button"
                      onClick={() => setActiveCourse(null)}
                      className="flex-1 py-2 px-3 border border-rule hover:border-rule-strong text-ink text-xs font-medium rounded-btn cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={launching || !selectedTemplateId}
                      className="flex-1 py-2 px-3 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-semibold rounded-btn flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {launching ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Abriendo sesión...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Abrir y Proyectar PIN</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {/* Modal: Course Exam Manager */}
        {examManagerCourse && (
          <CourseExamManagerModal
            course={examManagerCourse}
            onClose={() => setExamManagerCourse(null)}
            onExamCreated={() =>
              loadCourses(selectedDay, currentUser, adminTeacherId)
            }
          />
        )}

        {/* Modal: Course Roster & Student Enrollment */}
        {rosterCourse && (
          <CourseRosterModal
            course={rosterCourse}
            onClose={() => setRosterCourse(null)}
            onRosterChanged={() => {
              loadCourses(selectedDay, currentUser, adminTeacherId);
              loadAllTeacherCourses(currentUser, adminTeacherId);
              loadStudents();
            }}
          />
        )}
      </div>
    </RoleGuard>
  );
}
