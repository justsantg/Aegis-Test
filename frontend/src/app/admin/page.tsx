'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  api,
  AuthUser,
  Course,
  Level,
  TeacherData,
  TeacherAuditMetricsResponse,
  TeacherAuditSession,
} from '../../lib/api';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2,
  LogOut,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Eye,
  Filter,
  X,
  Phone,
  Mail,
  School,
} from 'lucide-react';
import RoleGuard from '../../components/auth/RoleGuard';

const WEEKDAYS = [
  { id: 'MONDAY', label: 'Lun' },
  { id: 'TUESDAY', label: 'Mar' },
  { id: 'WEDNESDAY', label: 'Mié' },
  { id: 'THURSDAY', label: 'Jue' },
  { id: 'FRIDAY', label: 'Vie' },
  { id: 'SATURDAY', label: 'Sáb' },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication & View State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'teachers' | 'courses'>('metrics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data Stores
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [auditMetrics, setAuditMetrics] = useState<TeacherAuditMetricsResponse | null>(null);

  // Filters for Audit Tab
  const [filterTeacherId, setFilterTeacherId] = useState<string>('');
  const [filterExamType, setFilterExamType] = useState<string>('');

  // Expandable row in audit table
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Modals
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Form states - Create Teacher
  const [newTeacherFirstName, setNewTeacherFirstName] = useState('');
  const [newTeacherLastName, setNewTeacherLastName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('secret');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [submittingTeacher, setSubmittingTeacher] = useState(false);

  // Form states - Create Course
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseLevelId, setNewCourseLevelId] = useState<number>(1);
  const [newCourseTeacherId, setNewCourseTeacherId] = useState<number | ''>('');
  const [newCourseModality, setNewCourseModality] = useState<'REGULAR_GROUP' | 'PERSONALIZED_1ON1' | 'SEMI_PERSONALIZED'>('REGULAR_GROUP');
  const [newCourseCapacity, setNewCourseCapacity] = useState<number>(8);
  const [newCourseDays, setNewCourseDays] = useState<string[]>(['TUESDAY', 'THURSDAY']);
  const [newCourseStartTime, setNewCourseStartTime] = useState('10:00:00');
  const [newCourseEndTime, setNewCourseEndTime] = useState('12:00:00');
  const [newCourseClassroom, setNewCourseClassroom] = useState('Aula 1');
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // Auto-clear messages
  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cambridge_user');
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
      }
    } catch {}
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teachersRes, coursesRes, levelsRes, metricsRes] = await Promise.all([
        api.getTeachers(),
        api.getCourses(),
        api.getLevels(),
        api.getTeacherAuditMetrics(),
      ]);

      setTeachers(teachersRes);
      setCourses(coursesRes);
      setLevels(levelsRes);
      setAuditMetrics(metricsRes);

      if (teachersRes.length > 0) {
        setNewCourseTeacherId(teachersRes[0].id);
      }
      if (levelsRes.length > 0) {
        setNewCourseLevelId(levelsRes[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del panel administrativo.');
    } finally {
      setLoading(false);
    }
  };

  const reloadMetrics = async (teacherId?: string, examType?: string) => {
    try {
      const metrics = await api.getTeacherAuditMetrics({
        teacherId: teacherId ? Number(teacherId) : undefined,
        examType: examType || undefined,
      });
      setAuditMetrics(metrics);
    } catch (err: any) {
      setError(err.message || 'Error al filtrar métricas de auditoría');
    }
  };

  const handleTeacherFilterChange = (val: string) => {
    setFilterTeacherId(val);
    reloadMetrics(val, filterExamType);
  };

  const handleExamTypeFilterChange = (val: string) => {
    setFilterExamType(val);
    reloadMetrics(filterTeacherId, val);
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherFirstName.trim() || !newTeacherLastName.trim() || !newTeacherEmail.trim()) {
      setError('Por favor completa los nombres, apellidos y correo electrónico.');
      return;
    }
    try {
      setSubmittingTeacher(true);
      setError(null);
      await api.createTeacher({
        firstName: newTeacherFirstName.trim(),
        lastName: newTeacherLastName.trim(),
        email: newTeacherEmail.trim(),
        password: newTeacherPassword,
        phoneNumber: newTeacherPhone.trim() || undefined,
      });
      setShowTeacherModal(false);
      setNewTeacherFirstName('');
      setNewTeacherLastName('');
      setNewTeacherEmail('');
      setNewTeacherPhone('');
      notifySuccess('Docente registrado correctamente.');
      const updatedTeachers = await api.getTeachers();
      setTeachers(updatedTeachers);
    } catch (err: any) {
      setError(err.message || 'Error al registrar docente.');
    } finally {
      setSubmittingTeacher(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim() || newCourseDays.length === 0) {
      setError('Por favor indica el nombre del curso y selecciona al menos un día.');
      return;
    }
    try {
      setSubmittingCourse(true);
      setError(null);
      await api.createCourse({
        courseName: newCourseName.trim(),
        levelId: Number(newCourseLevelId),
        teacherId: newCourseTeacherId ? Number(newCourseTeacherId) : undefined,
        courseModality: newCourseModality,
        capacity: Number(newCourseCapacity),
        scheduleDays: newCourseDays,
        startTime: newCourseStartTime,
        endTime: newCourseEndTime,
        classroom: newCourseClassroom.trim() || undefined,
        term: '2026-I',
      });
      setShowCourseModal(false);
      setNewCourseName('');
      notifySuccess('Clase / Curso creado exitosamente.');
      const [updatedCourses, updatedTeachers] = await Promise.all([
        api.getCourses(),
        api.getTeachers(),
      ]);
      setCourses(updatedCourses);
      setTeachers(updatedTeachers);
    } catch (err: any) {
      setError(err.message || 'Error al crear la clase.');
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleConfirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      setIsDeletingCourse(true);
      setError(null);
      await api.deleteCourse(courseToDelete.id);
      notifySuccess(`Clase "${courseToDelete.name}" eliminada correctamente.`);
      const [updatedCourses, updatedTeachers] = await Promise.all([
        api.getCourses(),
        api.getTeachers(),
      ]);
      setCourses(updatedCourses);
      setTeachers(updatedTeachers);
      setCourseToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el curso.');
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const toggleDaySelection = (dayId: string) => {
    if (newCourseDays.includes(dayId)) {
      setNewCourseDays(newCourseDays.filter((d) => d !== dayId));
    } else {
      setNewCourseDays([...newCourseDays, dayId]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cambridge_token');
    localStorage.removeItem('cambridge_user');
    router.push('/');
  };

  return (
    <RoleGuard allowedRoleIds={[1]} sectionName="el Portal Administrativo">
      <div className="flex-1 max-w-container mx-auto w-full px-4 py-8">
      {/* Top Masthead */}
      <header className="pb-6 border-b border-rule space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-accent mb-1">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>Aegis Test · Portal de Administración Oficial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Gestión Académica & Auditoría de Exámenes
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted">
              Control de profesores, asignación de cursos y horarios, y métricas de asistencia a exámenes intermedios y finales
            </p>
          </div>

          {/* User badge & Actions */}
          <div className="flex items-center space-x-3">
            <Link
              href="/teacher"
              className="px-3 py-1.5 text-xs font-medium bg-paper border border-rule hover:border-accent hover:text-accent rounded-btn transition-colors text-ink inline-flex items-center space-x-1.5"
            >
              <School className="w-3.5 h-3.5" />
              <span>Ver Panel Docente</span>
            </Link>

            <div className="px-3 py-1.5 bg-paper-card border border-rule rounded-btn text-xs text-ink flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span className="font-medium truncate max-w-[150px]">
                {currentUser?.firstName ? `${currentUser.firstName} (${currentUser.role.name})` : 'Administrador'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-danger hover:underline ml-1 cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5 inline" />
              </button>
            </div>
          </div>
        </div>

        {/* Success or Error Banners */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-btn flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-btn flex items-center justify-between">
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-600" />
              {successMsg}
            </span>
            <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation (Job-Driven Hallmark) */}
        <nav className="flex space-x-2 pt-2 border-t border-rule/50">
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 text-xs font-semibold rounded-btn transition-colors inline-flex items-center space-x-2 cursor-pointer ${
              activeTab === 'metrics'
                ? 'bg-ink text-paper shadow-xs'
                : 'bg-paper text-ink-muted hover:text-ink hover:bg-paper-muted'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Auditoría de Exámenes por Profesor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 text-xs font-semibold rounded-btn transition-colors inline-flex items-center space-x-2 cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-ink text-paper shadow-xs'
                : 'bg-paper text-ink-muted hover:text-ink hover:bg-paper-muted'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Profesores ({teachers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 text-xs font-semibold rounded-btn transition-colors inline-flex items-center space-x-2 cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-ink text-paper shadow-xs'
                : 'bg-paper text-ink-muted hover:text-ink hover:bg-paper-muted'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Clases & Horarios ({courses.length})</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="py-6">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
            <p className="text-xs text-ink-muted">Cargando datos del sistema...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: AUDITORÍA Y MÉTRICAS DE EXÁMENES POR PROFESOR */}
            {activeTab === 'metrics' && (
              <div className="space-y-6">
                {/* Summary KPI Cards */}
                {auditMetrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-4 bg-paper-card border border-rule rounded-card">
                      <p className="text-[11px] font-semibold text-ink-muted uppercase">Exámenes Realizados</p>
                      <p className="text-2xl font-bold text-ink mt-1">{auditMetrics.summary.totalSessions}</p>
                    </div>
                    <div className="p-4 bg-paper-card border border-rule rounded-card">
                      <p className="text-[11px] font-semibold text-ink-muted uppercase">Alumnos Asistieron</p>
                      <p className="text-2xl font-bold text-success mt-1">{auditMetrics.summary.totalPresent}</p>
                    </div>
                    <div className="p-4 bg-paper-card border border-rule rounded-card">
                      <p className="text-[11px] font-semibold text-ink-muted uppercase">Alumnos Ausentes (N/P)</p>
                      <p className="text-2xl font-bold text-danger mt-1">{auditMetrics.summary.totalAbsent}</p>
                    </div>
                    <div className="p-4 bg-paper-card border border-rule rounded-card">
                      <p className="text-[11px] font-semibold text-ink-muted uppercase">Tasa de Asistencia</p>
                      <p className="text-2xl font-bold text-accent mt-1">
                        {auditMetrics.summary.overallAttendanceRate}%
                      </p>
                    </div>
                    <div className="p-4 bg-paper-card border border-rule rounded-card">
                      <p className="text-[11px] font-semibold text-ink-muted uppercase">Promedio General</p>
                      <p className="text-2xl font-bold text-ink mt-1">
                        {auditMetrics.summary.averageScoreOverall !== null
                          ? `${auditMetrics.summary.averageScoreOverall} / 5.0`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Filter Toolbar */}
                <div className="p-4 bg-paper-card border border-rule rounded-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink">
                    <Filter className="w-4 h-4 text-accent" />
                    <span>Filtrar Evaluaciones:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-1.5">
                      <label htmlFor="filterTeacher" className="text-xs text-ink-muted">Docente:</label>
                      <select
                        id="filterTeacher"
                        value={filterTeacherId}
                        onChange={(e) => handleTeacherFilterChange(e.target.value)}
                        className="py-1 px-2.5 text-xs bg-paper border border-rule rounded-btn text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="">Todos los docentes</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <label htmlFor="filterExamType" className="text-xs text-ink-muted">Tipo Examen:</label>
                      <select
                        id="filterExamType"
                        value={filterExamType}
                        onChange={(e) => handleExamTypeFilterChange(e.target.value)}
                        className="py-1 px-2.5 text-xs bg-paper border border-rule rounded-btn text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="">Todos (Intermedios y Finales)</option>
                        <option value="MIDTERM">Examen Intermedio (Midterm)</option>
                        <option value="FINAL">Examen Final</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Audit Sessions Table */}
                <div className="bg-paper-card border border-rule rounded-card overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-rule flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-ink">
                        Historial de Exámenes por Profesor y Asistencia
                      </h2>
                      <p className="text-xs text-ink-muted">
                        Muestra cuántos estudiantes estuvieron con un profesor en cada sesión de examen intermedio o final
                      </p>
                    </div>
                    <span className="text-xs font-medium text-ink-muted">
                      {auditMetrics?.sessions.length || 0} sesiones registradas
                    </span>
                  </div>

                  {auditMetrics?.sessions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-ink-muted">
                      No se encontraron sesiones de examen con los filtros seleccionados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-paper-muted/60 text-ink-muted uppercase text-[10px] tracking-wider border-b border-rule">
                          <tr>
                            <th className="py-2.5 px-4">Docente</th>
                            <th className="py-2.5 px-4">Curso / Nivel</th>
                            <th className="py-2.5 px-4">Tipo de Examen</th>
                            <th className="py-2.5 px-4">Fecha & Hora</th>
                            <th className="py-2.5 px-4 text-center">Asistieron vs Total</th>
                            <th className="py-2.5 px-4 text-center">Ausentes (N/P)</th>
                            <th className="py-2.5 px-4 text-center">Promedio Nota</th>
                            <th className="py-2.5 px-4 text-right">Detalle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rule/60 text-ink">
                          {auditMetrics?.sessions.map((s) => {
                            const isExpanded = expandedSessionId === s.sessionId;
                            const isMidterm = s.examTemplate.examType === 'MIDTERM';

                            return (
                              <React.Fragment key={s.sessionId}>
                                <tr className="hover:bg-paper-muted/30 transition-colors">
                                  <td className="py-3 px-4 font-medium">
                                    <div className="font-semibold text-ink">{s.teacher.fullName}</div>
                                    <div className="text-[11px] text-ink-muted">{s.teacher.email}</div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-medium text-ink">{s.course.courseName}</div>
                                    <div className="text-[11px] text-ink-muted">
                                      {s.course.levelName} · {s.mode}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        isMidterm
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                                      }`}
                                    >
                                      {isMidterm ? 'Intermedio (Midterm)' : 'Examen Final'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-ink-muted">
                                    <div>{new Date(s.createdAt).toLocaleDateString('es-CO')}</div>
                                    <div className="text-[11px]">
                                      {new Date(s.createdAt).toLocaleTimeString('es-CO', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="inline-flex items-center space-x-1 font-bold text-ink">
                                      <span className="text-success">{s.metrics.presentCount}</span>
                                      <span className="text-ink-muted font-normal">/</span>
                                      <span>{s.metrics.totalEnrolled}</span>
                                    </div>
                                    <div className="text-[10px] text-ink-muted">
                                      {s.metrics.attendanceRate}% asistencia
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {s.metrics.absentCount > 0 ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                        {s.metrics.absentCount} ausente(s)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                                        0 ausentes
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold">
                                    {s.metrics.averageScore !== null ? (
                                      <span
                                        className={
                                          s.metrics.averageScore >= 3.0 ? 'text-success' : 'text-danger'
                                        }
                                      >
                                        {s.metrics.averageScore} / 5.0
                                      </span>
                                    ) : (
                                      <span className="text-ink-muted font-normal">Sin notas</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedSessionId(isExpanded ? null : s.sessionId)
                                      }
                                      className="py-1 px-2.5 text-[11px] font-medium bg-paper border border-rule hover:border-accent hover:text-accent rounded-btn inline-flex items-center space-x-1 cursor-pointer"
                                    >
                                      <span>{isExpanded ? 'Ocultar' : 'Ver Alumnos'}</span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3 h-3" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3" />
                                      )}
                                    </button>
                                  </td>
                                </tr>

                                {/* Expandable Student Details Row */}
                                {isExpanded && (
                                  <tr className="bg-paper-muted/40 border-b border-rule">
                                    <td colSpan={8} className="p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-semibold text-ink">
                                          <span>
                                            Estudiantes asignados a esta sesión (PIN: {s.sessionPin}):
                                          </span>
                                          <span className="text-ink-muted font-normal text-[11px]">
                                            Examen: {s.examTemplate.title} ({s.examTemplate.totalQuestions} preguntas)
                                          </span>
                                        </div>

                                        <div className="bg-paper-card border border-rule rounded-btn overflow-hidden">
                                          <table className="w-full text-left text-xs">
                                            <thead className="bg-paper-muted/60 text-[10px] uppercase text-ink-muted border-b border-rule">
                                              <tr>
                                                <th className="py-2 px-3">Estudiante</th>
                                                <th className="py-2 px-3">Código</th>
                                                <th className="py-2 px-3">Teléfono</th>
                                                <th className="py-2 px-3 text-center">Estado Asistencia</th>
                                                <th className="py-2 px-3 text-right">Calificación</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-rule/60">
                                              {s.students.map((st) => (
                                                <tr key={st.studentId} className="hover:bg-paper-muted/20">
                                                  <td className="py-2 px-3 font-medium text-ink">
                                                    {st.fullName}
                                                  </td>
                                                  <td className="py-2 px-3 text-ink-muted font-mono text-[11px]">
                                                    {st.studentCode || 'N/A'}
                                                  </td>
                                                  <td className="py-2 px-3 text-ink-muted">
                                                    {st.phoneNumber || 'Sin registrar'}
                                                  </td>
                                                  <td className="py-2 px-3 text-center">
                                                    <span
                                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        st.attendanceStatus === 'COMPLETED'
                                                          ? 'bg-green-50 text-green-700'
                                                          : st.attendanceStatus === 'IN_PROGRESS'
                                                          ? 'bg-blue-50 text-blue-700'
                                                          : st.attendanceStatus === 'ABSENT'
                                                          ? 'bg-red-50 text-red-700'
                                                          : 'bg-yellow-50 text-yellow-700'
                                                      }`}
                                                    >
                                                      {st.attendanceStatus === 'COMPLETED'
                                                        ? 'Completado'
                                                        : st.attendanceStatus === 'IN_PROGRESS'
                                                        ? 'En Examen'
                                                        : st.attendanceStatus === 'ABSENT'
                                                        ? 'No Presentó (N/P)'
                                                        : 'Pendiente'}
                                                    </span>
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-bold">
                                                    {st.totalScore !== null && st.totalScore !== undefined ? (
                                                      <span
                                                        className={
                                                          Number(st.totalScore) >= 3.0
                                                            ? 'text-success'
                                                            : 'text-danger'
                                                        }
                                                      >
                                                        {Number(st.totalScore).toFixed(2)} / 5.0
                                                      </span>
                                                    ) : (
                                                      <span className="text-ink-muted font-normal text-[11px]">
                                                        —
                                                      </span>
                                                    )}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GESTIÓN DE PROFESORES */}
            {activeTab === 'teachers' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-ink">Planta Docente Registrada</h2>
                    <p className="text-xs text-ink-muted">
                      Gestiona a los profesores de la academia y sus cursos asignados
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTeacherModal(true)}
                    className="py-2 px-3.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-btn inline-flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Nuevo Docente</span>
                  </button>
                </div>

                {/* Teachers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teachers.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 bg-paper-card border border-rule rounded-card shadow-xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-sm">
                            {t.firstName.charAt(0)}
                            {t.lastName.charAt(0)}
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                            {t.status.name}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-ink">{t.fullName}</h3>
                          <div className="flex items-center text-xs text-ink-muted mt-0.5 space-x-1.5">
                            <Mail className="w-3 h-3 text-ink-muted" />
                            <span>{t.email}</span>
                          </div>
                          {t.phoneNumber && (
                            <div className="flex items-center text-xs text-ink-muted mt-0.5 space-x-1.5">
                              <Phone className="w-3 h-3 text-ink-muted" />
                              <span>{t.phoneNumber}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-rule/60">
                          <div className="flex items-center justify-between text-xs font-semibold text-ink-muted mb-2">
                            <span>Cursos a Cargo:</span>
                            <span className="text-ink font-bold">{t.assignedCoursesCount} clases</span>
                          </div>

                          {t.courses.length === 0 ? (
                            <p className="text-[11px] text-ink-muted/80 italic">
                              Sin clases asignadas actualmente.
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {t.courses.map((c) => (
                                <div
                                  key={c.id}
                                  className="p-2 bg-paper-muted/50 border border-rule/60 rounded-btn text-[11px] space-y-0.5"
                                >
                                  <div className="font-semibold text-ink flex items-center justify-between">
                                    <span className="truncate">{c.courseName}</span>
                                    <span className="text-[10px] text-accent font-bold">{c.levelName}</span>
                                  </div>
                                  <div className="text-ink-muted flex items-center space-x-2 text-[10px]">
                                    <span>{c.scheduleDays.join(', ')}</span>
                                    <span>·</span>
                                    <span>{c.startTime.slice(0, 5)} - {c.endTime.slice(0, 5)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-rule/60 flex items-center justify-between text-[11px] text-ink-muted">
                        <span>ID Docente: #{t.id}</span>
                        <span className="text-accent font-medium">Docente Oficial</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: GESTIÓN DE CLASES & HORARIOS */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-ink">Catálogo de Cursos & Horarios</h2>
                    <p className="text-xs text-ink-muted">
                      Configura grupos regulares, clases particulares y horarios semanales
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(true)}
                    className="py-2 px-3.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-btn inline-flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Nueva Clase</span>
                  </button>
                </div>

                {/* Courses Table */}
                <div className="bg-paper-card border border-rule rounded-card overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-rule flex items-center justify-between">
                    <h3 className="text-sm font-bold text-ink">
                      Clases Activas ({courses.length})
                    </h3>
                    <span className="text-xs text-ink-muted">Periodo Vigente: 2026-I</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-paper-muted/60 text-ink-muted uppercase text-[10px] tracking-wider border-b border-rule">
                        <tr>
                          <th className="py-2.5 px-4">Clase / Curso</th>
                          <th className="py-2.5 px-4">Nivel Académico</th>
                          <th className="py-2.5 px-4">Modalidad</th>
                          <th className="py-2.5 px-4">Docente Titular</th>
                          <th className="py-2.5 px-4">Días y Horarios</th>
                          <th className="py-2.5 px-4 text-center">Cupo / Alumnos</th>
                          <th className="py-2.5 px-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule/60 text-ink">
                        {courses.map((c) => (
                          <tr key={c.id} className="hover:bg-paper-muted/30 transition-colors">
                            <td className="py-3 px-4 font-semibold text-ink">
                              <div>{c.courseName}</div>
                              {c.classroom && (
                                <div className="text-[11px] text-ink-muted font-normal">
                                  Salón: {c.classroom}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-accent border border-blue-200">
                                {c.level?.name || 'Nivel'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-ink-muted">
                              {c.courseModality === 'REGULAR_GROUP'
                                ? 'Grupo Regular (6-8)'
                                : c.courseModality === 'PERSONALIZED_1ON1'
                                ? 'Particular 1-a-1'
                                : 'Semipersonalizado (2-3)'}
                            </td>
                            <td className="py-3 px-4">
                              {c.teacher ? (
                                <div>
                                  <div className="font-medium text-ink">
                                    {c.teacher.firstName} {c.teacher.lastName}
                                  </div>
                                  <div className="text-[10px] text-ink-muted">{c.teacher.email}</div>
                                </div>
                              ) : (
                                <span className="text-ink-muted italic">Sin docente</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-ink">
                                {c.scheduleDays ? c.scheduleDays.join(', ') : 'Días no definidos'}
                              </div>
                              <div className="text-[11px] text-ink-muted">
                                {c.scheduleStartTime?.slice(0, 5)} - {c.scheduleEndTime?.slice(0, 5)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-medium">
                              <span>Capacidad: {c.maxCapacity}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setCourseToDelete({ id: c.id, name: c.courseName })}
                                className="p-1.5 text-danger hover:bg-danger-soft rounded-btn transition-colors cursor-pointer"
                                title="Eliminar clase"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL 1: REGISTRAR DOCENTE */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-card border border-rule rounded-card shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-ink">Registrar Nuevo Docente</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTeacherModal(false)}
                className="text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Nombres *</label>
                  <input
                    type="text"
                    value={newTeacherFirstName}
                    onChange={(e) => setNewTeacherFirstName(e.target.value)}
                    placeholder="ej. Laura"
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Apellidos *</label>
                  <input
                    type="text"
                    value={newTeacherLastName}
                    onChange={(e) => setNewTeacherLastName(e.target.value)}
                    placeholder="ej. Gómez"
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink">Correo Electrónico Institucional *</label>
                <input
                  type="email"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  placeholder="ej. laura.gomez@aegis.edu.co"
                  className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Contraseña Inicial *</label>
                  <input
                    type="text"
                    value={newTeacherPassword}
                    onChange={(e) => setNewTeacherPassword(e.target.value)}
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={newTeacherPhone}
                    onChange={(e) => setNewTeacherPhone(e.target.value)}
                    placeholder="+573001234567"
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-rule flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="py-1.5 px-3 border border-rule text-ink rounded-btn hover:bg-paper-muted cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingTeacher}
                  className="py-1.5 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-btn cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                >
                  {submittingTeacher && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar Docente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR CLASE / CURSO */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-card border border-rule rounded-card shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-ink">Registrar Nueva Clase / Curso</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink">Nombre de la Clase *</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="ej. Inglés 4A - Mar/Mié/Jue Mañana"
                  className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Nivel Académico *</label>
                  <select
                    value={newCourseLevelId}
                    onChange={(e) => setNewCourseLevelId(Number(e.target.value))}
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name} ({lvl.levelType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Docente Asignado *</label>
                  <select
                    value={newCourseTeacherId}
                    onChange={(e) => setNewCourseTeacherId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Seleccionar docente...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Modalidad *</label>
                  <select
                    value={newCourseModality}
                    onChange={(e) => {
                      const mod = e.target.value as any;
                      setNewCourseModality(mod);
                      if (mod === 'REGULAR_GROUP') setNewCourseCapacity(8);
                      else if (mod === 'PERSONALIZED_1ON1') setNewCourseCapacity(1);
                      else setNewCourseCapacity(3);
                    }}
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                  >
                    <option value="REGULAR_GROUP">Grupo Regular (6-8)</option>
                    <option value="PERSONALIZED_1ON1">Personalizado (1 Alumno)</option>
                    <option value="SEMI_PERSONALIZED">Semipersonalizado (2-3)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Capacidad Máxima *</label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={newCourseCapacity}
                    onChange={(e) => setNewCourseCapacity(Number(e.target.value))}
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
              </div>

              {/* Days checkboxes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-ink block">Días de Clase *</label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((w) => {
                    const isSelected = newCourseDays.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleDaySelection(w.id)}
                        className={`py-1.5 px-3 rounded-btn text-xs font-semibold border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-accent text-white border-accent'
                            : 'bg-paper text-ink border-rule hover:bg-paper-muted'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Hora Inicio *</label>
                  <input
                    type="time"
                    value={newCourseStartTime.slice(0, 5)}
                    onChange={(e) => setNewCourseStartTime(`${e.target.value}:00`)}
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Hora Fin *</label>
                  <input
                    type="time"
                    value={newCourseEndTime.slice(0, 5)}
                    onChange={(e) => setNewCourseEndTime(`${e.target.value}:00`)}
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Salón / Aula</label>
                  <input
                    type="text"
                    value={newCourseClassroom}
                    onChange={(e) => setNewCourseClassroom(e.target.value)}
                    placeholder="Aula 1"
                    className="w-full p-2 bg-paper border border-rule rounded-btn text-ink focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-rule flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="py-1.5 px-3 border border-rule text-ink rounded-btn hover:bg-paper-muted cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCourse}
                  className="py-1.5 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-btn cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                >
                  {submittingCourse && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Crear Clase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmación para Eliminar Curso (Reemplazo de dialog confirm nativo) */}
      {courseToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !isDeletingCourse && setCourseToDelete(null)}
        >
          <div
            className="bg-paper-card border border-rule rounded-card max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-danger-soft text-danger rounded-full shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-ink">¿Eliminar clase?</h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  ¿Estás seguro de que deseas eliminar la clase{' '}
                  <strong className="text-ink font-semibold">&quot;{courseToDelete.name}&quot;</strong>? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={isDeletingCourse}
                className="px-3.5 py-1.5 bg-paper-card border border-rule text-ink hover:bg-paper-muted rounded-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCourse}
                disabled={isDeletingCourse}
                className="px-3.5 py-1.5 bg-danger text-white hover:bg-danger/90 rounded-btn text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isDeletingCourse ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </RoleGuard>
  );
}
