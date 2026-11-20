'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Course, ExamTemplate, AuthUser, TeacherData } from '../../lib/api';
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
} from 'lucide-react';
import RoleGuard from '../../components/auth/RoleGuard';
import CourseExamManagerModal from '../../components/teacher/CourseExamManagerModal';

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

  // Modal Launch Session state
  const [examManagerCourse, setExamManagerCourse] = useState<Course | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedMode, setSelectedMode] = useState<'FREE_PACE' | 'SYNC_BLOCKS'>('FREE_PACE');
  const [launching, setLaunching] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

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
  }, []);

  useEffect(() => {
    if (!userLoaded) return;
    loadCourses(selectedDay, currentUser, adminTeacherId);
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
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mt-4 p-3 bg-danger-soft border border-danger/20 rounded-btn text-xs text-danger font-medium">
            {error}
          </div>
        )}

        {/* Courses Grid */}
        <div className="mt-8">
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
                          <span>Capacidad: {capacity} estudiantes</span>
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
                        <span>Iniciar Sesión</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
      </div>
    </RoleGuard>
  );
}
