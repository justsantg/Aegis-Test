'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  api,
  StudentAcademicRecordResponse,
  PhaseRecord,
  AuthUser,
} from '@/lib/api';
import {
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  LogOut,
  Search,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();

  // Authentication & student record state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [record, setRecord] = useState<StudentAcademicRecordResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fast PIN join state
  const [pin, setPin] = useState<string>('');
  const [joiningPin, setJoiningPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Phase list filters & search
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'regular' | 'training'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPhaseId, setExpandedPhaseId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cambridge_user');
      if (!stored) {
        router.push('/');
        return;
      }
      const u: AuthUser = JSON.parse(stored);
      // Ensure user is student
      if (u.role?.id !== 3 && u.role?.name?.toLowerCase() !== 'student') {
        if (u.role?.id === 2) router.push('/teacher');
        else router.push('/admin');
        return;
      }
      setCurrentUser(u);
      loadAcademicRecord(u.id);
    } catch {
      router.push('/');
    }
  }, [router]);

  const loadAcademicRecord = async (studentId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStudentAcademicRecord(studentId);
      setRecord(data);

      // Auto-expand current active phase if present
      const current = data.phases.find((p) => p.isCurrentLevel || p.phaseStatus === 'IN_PROGRESS');
      if (current) {
        setExpandedPhaseId(current.levelId);
      } else if (data.phases.length > 0) {
        setExpandedPhaseId(data.phases[0].levelId);
      }
    } catch (err: any) {
      setError(
        err.message ||
          'No fue posible cargar el registro académico del estudiante. Por favor intenta nuevamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cambridge_token');
    localStorage.removeItem('cambridge_user');
    sessionStorage.removeItem('active_exam_session');
    router.push('/');
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    if (val.length > 3) {
      val = `${val.slice(0, 3)}-${val.slice(3)}`;
    }
    setPin(val);
    setPinError(null);
  };

  const handleJoinWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 6) {
      setPinError('Ingresa un PIN de sesión válido de 6 dígitos (ej. 123-456).');
      return;
    }

    try {
      setJoiningPin(true);
      setPinError(null);

      const sessionData = await api.joinSession({
        sessionPin: cleanPin,
        studentId: currentUser.id,
      });

      const studentFullName =
        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
        currentUser.email;

      sessionStorage.setItem(
        'active_exam_session',
        JSON.stringify({
          ...sessionData,
          studentId: currentUser.id,
          studentName: studentFullName,
          studentCode: currentUser.studentCode,
        }),
      );

      router.push(`/exam/${sessionData.sessionId}`);
    } catch (err: any) {
      setPinError(err.message || 'PIN inválido o sesión de examen no encontrada.');
    } finally {
      setJoiningPin(false);
    }
  };

  const formatDays = (days?: string[]) => {
    if (!days || days.length === 0) return 'Horario asignado';
    const map: Record<string, string> = {
      MONDAY: 'Lun',
      TUESDAY: 'Mar',
      WEDNESDAY: 'Mié',
      THURSDAY: 'Jue',
      FRIDAY: 'Vie',
      SATURDAY: 'Sáb',
      SUNDAY: 'Dom',
    };
    return days.map((d) => map[d] || d).join(', ');
  };

  const formatModality = (modality?: string) => {
    if (modality === 'REGULAR_GROUP') return 'Grupo Regular (6-8 est.)';
    if (modality === 'PERSONALIZED_1ON1') return 'Personalizado 1 a 1';
    if (modality === 'SEMI_PERSONALIZED') return 'Semipersonalizado (2-3 est.)';
    return modality || 'Modalidad General';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No registrado';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered phases list
  const filteredPhases = useMemo(() => {
    if (!record) return [];
    let list = record.phases;

    if (filterTab === 'active') {
      list = list.filter(
        (p) =>
          p.isCurrentLevel ||
          p.phaseStatus === 'IN_PROGRESS' ||
          p.phaseStatus === 'COMPLETED',
      );
    } else if (filterTab === 'regular') {
      list = list.filter((p) => p.levelType === 'REGULAR');
    } else if (filterTab === 'training') {
      list = list.filter(
        (p) => p.levelType === 'TRAINING_APTIS' || p.code === 'TRAINING',
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q),
      );
    }

    return list;
  }, [record, filterTab, searchQuery]);

  const togglePhase = (levelId: number) => {
    setExpandedPhaseId((prev) => (prev === levelId ? null : levelId));
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-accent selection:text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 bg-paper-card/95 backdrop-blur-md border-b border-rule">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-muted font-bold flex items-center gap-1.5">
                <span>Cambridge Academy</span>
                <span className="w-1 h-1 rounded-full bg-rule-dark" />
                <span className="text-accent">Portal del Estudiante</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-ink leading-tight">
                Plan de Estudios & Historial de Evaluaciones
              </h1>
            </div>
          </div>

          {/* Right Header: Student Avatar & Logout */}
          <div className="flex items-center space-x-3">
            {record?.student && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-ink">
                  {record.student.fullName}
                </span>
                <span className="text-[11px] font-mono text-accent">
                  {record.student.studentCode || 'EST-OFICIAL'}
                </span>
              </div>
            )}
            <div className="w-9 h-9 rounded-full bg-paper-muted border border-rule flex items-center justify-center text-xs font-bold text-ink">
              {record?.student ? getInitials(record.student.fullName) : 'ES'}
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-2 text-ink-muted hover:text-ink hover:bg-paper-muted rounded-btn border border-transparent hover:border-rule transition-[color,background-color,border-color] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Loading Spinner */}
        {loading && !record && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-ink-muted">Cargando expediente académico...</p>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-card flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-rose-800">
              <p className="font-semibold">{error}</p>
              <button
                onClick={() => currentUser && loadAcademicRecord(currentUser.id)}
                className="mt-2 inline-flex items-center text-rose-700 underline font-semibold hover:text-rose-900 cursor-pointer"
              >
                Reintentar carga de datos
              </button>
            </div>
          </div>
        )}

        {record && (
          <>
            {/* Top Grid: Hero Action & Academic Identity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              {/* Left Hero Card: Fast PIN Exam Join */}
              <div className="lg:col-span-5 bg-paper-card border border-rule rounded-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-bold">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Rendir Examen Oficial</span>
                  </div>
                  <h2 className="text-lg font-bold text-ink">
                    ¿Tienes un PIN de clase?
                  </h2>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Ingresa el PIN de 6 dígitos suministrado por tu docente para iniciar inmediatamente tu evaluación en curso.
                  </p>
                </div>

                <form onSubmit={handleJoinWithPin} className="mt-5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                      PIN de la Sesión
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pin}
                        onChange={handlePinChange}
                        placeholder="000-000"
                        className="w-full text-center tracking-[0.25em] font-mono text-xl font-bold py-2.5 px-4 bg-paper rounded-btn border border-rule focus:outline-none focus:border-accent text-ink"
                        maxLength={7}
                      />
                    </div>
                    {pinError && (
                      <p className="mt-1 text-[11px] text-rose-600 font-medium">
                        {pinError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={joiningPin || pin.length < 6}
                    className="w-full py-2.5 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold text-xs rounded-btn flex items-center justify-center space-x-2 transition-[background-color,transform] cursor-pointer"
                  >
                    {joiningPin ? (
                      <span>Verificando PIN...</span>
                    ) : (
                      <>
                        <span>Ingresar a la Evaluación</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>

                  <div className="pt-1 text-center">
                    <Link
                      href="/exam/join"
                      className="text-[11px] text-ink-muted hover:text-ink underline"
                    >
                      Abrir pantalla completa de ingreso por PIN
                    </Link>
                  </div>
                </form>
              </div>

              {/* Right Hero Card: Current Course & Student Summary Metrics */}
              <div className="lg:col-span-7 bg-paper-card border border-rule rounded-card p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
                {/* Current Enrolled Course Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Fase & Curso Oficial Asignado
                    </span>
                    {record.currentCourse ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Matrícula Activa
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                        Sin curso activo
                      </span>
                    )}
                  </div>

                  {record.currentCourse ? (
                    <div className="bg-paper p-4 rounded-card border border-rule space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="inline-block px-2 py-0.5 rounded-btn bg-accent text-white font-mono text-xs font-bold mb-1">
                            {record.currentCourse.level?.code || 'FASE'}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-ink">
                            {record.currentCourse.courseName}
                          </h3>
                        </div>
                        <span className="text-xs text-ink-muted font-medium">
                          {formatModality(record.currentCourse.courseModality)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-ink-muted border-t border-rule/60">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          <span>
                            {formatDays(record.currentCourse.scheduleDays)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          <span>
                            {record.currentCourse.startTime?.slice(0, 5)} - {record.currentCourse.endTime?.slice(0, 5)}
                          </span>
                        </div>
                        {record.currentCourse.teacher && (
                          <div className="flex items-center space-x-1.5 sm:col-span-2">
                            <User className="w-3.5 h-3.5 text-accent" />
                            <span>
                              Docente:{' '}
                              <strong className="text-ink">
                                {record.currentCourse.teacher.fullName}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-paper-muted p-4 rounded-card border border-rule text-xs text-ink-muted text-center">
                      Actualmente no tienes un grupo académico activo asignado. Comunícate con la Coordinación para registrar tu curso.
                    </div>
                  )}
                </div>

                {/* 4 Academic KPI Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-rule">
                  {/* KPI 1: Current Level */}
                  <div className="p-2.5 bg-paper rounded-btn border border-rule">
                    <span className="block text-[10px] text-ink-muted font-semibold uppercase">
                      Fase Actual
                    </span>
                    <span className="text-base font-bold text-accent">
                      {record.summary.currentLevelCode || '---'}
                    </span>
                    <span className="block text-[10px] text-ink-muted truncate">
                      {record.summary.currentLevelName}
                    </span>
                  </div>

                  {/* KPI 2: General Average */}
                  <div className="p-2.5 bg-paper rounded-btn border border-rule">
                    <span className="block text-[10px] text-ink-muted font-semibold uppercase">
                      Promedio Gral.
                    </span>
                    <span className="text-base font-bold text-ink">
                      {record.summary.generalAverage !== null
                        ? `${record.summary.generalAverage.toFixed(1)}`
                        : '---'}
                    </span>
                    <span className="block text-[10px] text-ink-muted">
                      Escala 0.0 - 5.0
                    </span>
                  </div>

                  {/* KPI 3: Exams Taken */}
                  <div className="p-2.5 bg-paper rounded-btn border border-rule">
                    <span className="block text-[10px] text-ink-muted font-semibold uppercase">
                      Exámenes
                    </span>
                    <span className="text-base font-bold text-ink">
                      {record.summary.totalExamsTaken}
                    </span>
                    <span className="block text-[10px] text-ink-muted">
                      Rendidos con éxito
                    </span>
                  </div>

                  {/* KPI 4: Phases Passed */}
                  <div className="p-2.5 bg-paper rounded-btn border border-rule">
                    <span className="block text-[10px] text-ink-muted font-semibold uppercase">
                      Fases
                    </span>
                    <span className="text-base font-bold text-ink">
                      {record.summary.completedPhasesCount}{' '}
                      <span className="text-xs text-ink-muted font-normal">
                        / {record.summary.totalPhases}
                      </span>
                    </span>
                    <span className="block text-[10px] text-ink-muted">
                      Completadas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Section: Historial de Evaluaciones por Fase */}
            <div className="bg-paper-card border border-rule rounded-card shadow-xs overflow-hidden">
              {/* Header with Title and Filtering Controls */}
              <div className="p-5 sm:p-6 border-b border-rule flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-accent mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Malla Curricular & Calificaciones</span>
                  </div>
                  <h2 className="text-lg font-bold text-ink">
                    Historial de Evaluaciones por Fase
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Consulta tus exámenes intermedios (Midterm) y finales organizados fase por fase (1A a 10B y Training APTIS).
                  </p>
                </div>

                {/* Filter Controls: Tabs & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-muted" />
                    <input
                      type="text"
                      placeholder="Buscar fase (ej. 4A, Training)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs py-1.5 pl-8 pr-3 bg-paper rounded-btn border border-rule focus:outline-none focus:border-accent text-ink w-full sm:w-48"
                    />
                  </div>

                  {/* Segmented Filter Pills */}
                  <div className="inline-flex p-1 bg-paper rounded-btn border border-rule text-xs">
                    <button
                      onClick={() => setFilterTab('all')}
                      className={`px-2.5 py-1 rounded-btn font-medium transition-[background-color,color] cursor-pointer ${
                        filterTab === 'all'
                          ? 'bg-ink text-paper font-bold'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      Todas ({record.phases.length})
                    </button>
                    <button
                      onClick={() => setFilterTab('active')}
                      className={`px-2.5 py-1 rounded-btn font-medium transition-[background-color,color] cursor-pointer ${
                        filterTab === 'active'
                          ? 'bg-ink text-paper font-bold'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      Activa / Realizadas
                    </button>
                    <button
                      onClick={() => setFilterTab('regular')}
                      className={`px-2.5 py-1 rounded-btn font-medium transition-[background-color,color] cursor-pointer ${
                        filterTab === 'regular'
                          ? 'bg-ink text-paper font-bold'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      1A - 10B
                    </button>
                    <button
                      onClick={() => setFilterTab('training')}
                      className={`px-2.5 py-1 rounded-btn font-medium transition-[background-color,color] cursor-pointer ${
                        filterTab === 'training'
                          ? 'bg-ink text-paper font-bold'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      Training
                    </button>
                  </div>
                </div>
              </div>

              {/* Phase List */}
              <div className="divide-y divide-rule">
                {filteredPhases.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-muted">
                    No se encontraron fases con los criterios de búsqueda actuales.
                  </div>
                ) : (
                  filteredPhases.map((phase) => {
                    const isExpanded = expandedPhaseId === phase.levelId;
                    const isTraining =
                      phase.levelType === 'TRAINING_APTIS' ||
                      phase.code === 'TRAINING';

                    return (
                      <div
                        key={phase.levelId}
                        className={`transition-[background-color] ${
                          phase.isCurrentLevel
                            ? 'bg-accent/5'
                            : 'hover:bg-paper-muted/50'
                        }`}
                      >
                        {/* Phase Row Header / Summary */}
                        <div
                          onClick={() => togglePhase(phase.levelId)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="flex items-center space-x-3.5">
                            {/* Level Code Badge */}
                            <div
                              className={`w-11 h-11 rounded-btn flex items-center justify-center font-mono font-bold text-sm border ${
                                phase.isCurrentLevel
                                  ? 'bg-accent text-white border-accent'
                                  : phase.phaseStatus === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-paper text-ink border-rule'
                              }`}
                            >
                              {phase.code}
                            </div>

                            {/* Level Name & Subtitle */}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-ink">
                                  {phase.name}
                                </h3>
                                {phase.isCurrentLevel && (
                                  <span className="px-2 py-0.2 rounded-full bg-accent text-white text-[10px] font-bold">
                                    Fase Actual
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-ink-muted">
                                {isTraining
                                  ? 'Fase Preparatoria APTIS · Examen Intermedio + Examen Oficial Internacional'
                                  : 'Fase Regular · Examen Intermedio (Midterm) & Examen Final'}
                              </p>
                            </div>
                          </div>

                          {/* Right Phase Meta: Status Badge & Average Score */}
                          <div className="flex items-center space-x-3 sm:space-x-5">
                            {/* Phase Average */}
                            <div className="text-right">
                              <span className="block text-[10px] uppercase font-semibold text-ink-muted">
                                Promedio Fase
                              </span>
                              <span className="text-sm sm:text-base font-bold font-mono text-ink">
                                {phase.phaseAverage !== null
                                  ? `${phase.phaseAverage.toFixed(1)} / 5.0`
                                  : '---'}
                              </span>
                            </div>

                            {/* Status Pill */}
                            <div className="hidden sm:block">
                              {phase.phaseStatus === 'COMPLETED' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Aprobada</span>
                                </span>
                              ) : phase.phaseStatus === 'IN_PROGRESS' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>En Curso</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-paper-muted text-ink-muted border border-rule text-xs font-medium">
                                  <span>Pendiente</span>
                                </span>
                              )}
                            </div>

                            {/* Accordion Chevron */}
                            <div className="text-ink-muted">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Phase Details: Exam Cards */}
                        {isExpanded && (
                          <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-rule/70">
                              {/* 1. MIDTERM EXAM CARD */}
                              <div className="bg-paper p-4 rounded-card border border-rule space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                                      Evaluación Parcial
                                    </span>
                                    <h4 className="text-xs sm:text-sm font-bold text-ink">
                                      {phase.midterm.examTitle}
                                    </h4>
                                  </div>

                                  {phase.midterm.status === 'COMPLETED' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Completado
                                    </span>
                                  ) : phase.midterm.status === 'IN_PROGRESS' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                      En Presentación
                                    </span>
                                  ) : phase.midterm.status === 'ABSENT' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                      No Presentó (N/P)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-paper-muted text-ink-muted border border-rule text-[10px] font-medium">
                                      Pendiente
                                    </span>
                                  )}
                                </div>

                                {/* Score Display */}
                                <div className="flex items-baseline justify-between pt-2 border-t border-rule/60">
                                  <span className="text-xs text-ink-muted">
                                    Calificación Obtenida:
                                  </span>
                                  <span className="text-lg font-bold font-mono text-ink">
                                    {phase.midterm.score !== null ? (
                                      <span
                                        className={
                                          phase.midterm.score >= 3.0
                                            ? 'text-emerald-700'
                                            : 'text-rose-700'
                                        }
                                      >
                                        {phase.midterm.score.toFixed(1)}{' '}
                                        <span className="text-xs font-normal text-ink-muted">
                                          / 5.0
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-ink-muted font-normal text-sm">
                                        Sin calificar
                                      </span>
                                    )}
                                  </span>
                                </div>

                                <div className="text-[11px] text-ink-muted flex items-center justify-between">
                                  <span>
                                    Fecha: {formatDate(phase.midterm.submittedAt)}
                                  </span>
                                  {phase.midterm.focusLossCount > 0 && (
                                    <span className="text-amber-700 font-medium">
                                      {phase.midterm.focusLossCount} alerta(s) de foco
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 2. FINAL EXAM CARD (OR TRAINING APTIS NOTICE) */}
                              {isTraining ? (
                                <div className="bg-paper p-4 rounded-card border border-accent/30 space-y-3 relative overflow-hidden">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center space-x-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                                        Certificación Oficial Internacional
                                      </span>
                                    </div>
                                    <h4 className="text-xs sm:text-sm font-bold text-ink">
                                      Examen APTIS (British Council)
                                    </h4>
                                  </div>

                                  <p className="text-xs text-ink-muted leading-relaxed">
                                    En la fase final de Training no se aplica examen final institucional interno. La evaluación final es el examen oficial internacional <strong>APTIS</strong> administrado por el British Council.
                                  </p>

                                  <div className="pt-2 border-t border-rule/60 flex items-center justify-between text-xs">
                                    <span className="text-ink-muted">
                                      Entidad Evaluadora:
                                    </span>
                                    <span className="font-bold text-accent">
                                      British Council / Coordinación
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-paper p-4 rounded-card border border-rule space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                                        Evaluación Final
                                      </span>
                                      <h4 className="text-xs sm:text-sm font-bold text-ink">
                                        {phase.final.examTitle}
                                      </h4>
                                    </div>

                                    {phase.final.status === 'COMPLETED' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Completado
                                      </span>
                                    ) : phase.final.status === 'IN_PROGRESS' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                        En Presentación
                                      </span>
                                    ) : phase.final.status === 'ABSENT' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                        No Presentó (N/P)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-paper-muted text-ink-muted border border-rule text-[10px] font-medium">
                                        Pendiente
                                      </span>
                                    )}
                                  </div>

                                  {/* Score Display */}
                                  <div className="flex items-baseline justify-between pt-2 border-t border-rule/60">
                                    <span className="text-xs text-ink-muted">
                                      Calificación Obtenida:
                                    </span>
                                    <span className="text-lg font-bold font-mono text-ink">
                                      {phase.final.score !== null ? (
                                        <span
                                          className={
                                            phase.final.score >= 3.0
                                              ? 'text-emerald-700'
                                              : 'text-rose-700'
                                          }
                                        >
                                          {phase.final.score.toFixed(1)}{' '}
                                          <span className="text-xs font-normal text-ink-muted">
                                            / 5.0
                                          </span>
                                        </span>
                                      ) : (
                                        <span className="text-ink-muted font-normal text-sm">
                                          Sin calificar
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-ink-muted flex items-center justify-between">
                                    <span>
                                      Fecha: {formatDate(phase.final.submittedAt)}
                                    </span>
                                    {phase.final.focusLossCount > 0 && (
                                      <span className="text-amber-700 font-medium">
                                        {phase.final.focusLossCount} alerta(s) de foco
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-rule text-center text-xs text-ink-muted bg-paper-card">
        Cambridge Academy © 2026 · Sistema Integral de Evaluaciones y Seguimiento Académico
      </footer>
    </div>
  );
}
