'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  api,
  StudentAcademicRecordResponse,
  PhaseRecord,
  AuthUser,
} from '../../lib/api';
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
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

type StudentTab = 'courses' | 'history' | 'pin';

function StudentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<StudentTab>('courses');

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

  // Listen to URL query parameter e.g. /student?tab=history
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'courses' || tabParam === 'history' || tabParam === 'pin') {
      setActiveTab(tabParam as StudentTab);
    }
  }, [searchParams]);

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

  const jumpToPhaseDetail = (levelId: number) => {
    setFilterTab('all');
    setSearchQuery('');
    setExpandedPhaseId(levelId);
    setActiveTab('history');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-muted font-bold flex items-center gap-1.5">
                <span>Aegis Test</span>
                <span className="w-1 h-1 rounded-full bg-rule-dark" />
                <span className="text-accent">Portal del Estudiante</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-ink leading-tight">
                {activeTab === 'courses' && 'Fases & Cursos Asignados'}
                {activeTab === 'history' && 'Historial de Evaluaciones por Fase'}
                {activeTab === 'pin' && 'Ingreso a Evaluación con PIN'}
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

      {/* Mobile Top Tabs (Visible on screens < md) */}
      <div className="md:hidden bg-paper-card border-b border-rule px-4 py-2 sticky top-16 z-20">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-paper rounded-btn border border-rule text-xs">
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-2 px-1 text-center font-semibold rounded-btn transition-[background-color,color] cursor-pointer flex flex-col items-center gap-1 ${
              activeTab === 'courses'
                ? 'bg-ink text-paper shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[11px] truncate">Cursos</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 text-center font-semibold rounded-btn transition-[background-color,color] cursor-pointer flex flex-col items-center gap-1 ${
              activeTab === 'history'
                ? 'bg-ink text-paper shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="text-[11px] truncate">Historial</span>
          </button>
          <button
            onClick={() => setActiveTab('pin')}
            className={`py-2 px-1 text-center font-semibold rounded-btn transition-[background-color,color] cursor-pointer flex flex-col items-center gap-1 ${
              activeTab === 'pin'
                ? 'bg-accent text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="text-[11px] truncate">PIN Examen</span>
          </button>
        </div>
      </div>

      {/* Main Body Layout: Sidebar + Active Sub-screen Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col md:flex-row items-start gap-6 lg:gap-8">
        {/* Left Sidebar (Desktop / Tablet md+) */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 space-y-5 sticky top-24">
          {/* Student Profile Card */}
          <div className="bg-paper-card border border-rule rounded-card p-4 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-accent text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                {record?.student ? getInitials(record.student.fullName) : 'ES'}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-ink truncate">
                  {record?.student?.fullName || 'Estudiante'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-xs font-bold text-accent">
                    {record?.student?.studentCode || 'EST-2026-OFICIAL'}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted truncate">
                  {record?.student?.email}
                </p>
              </div>
            </div>

            {/* Current Phase Badge */}
            <div className="mt-3 pt-3 border-t border-rule/70 flex items-center justify-between text-xs">
              <span className="text-ink-muted text-[11px]">Fase Actual:</span>
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold font-mono text-[11px]">
                {record?.summary.currentLevelCode
                  ? `Nivel ${record.summary.currentLevelCode}`
                  : 'Sin Asignar'}
              </span>
            </div>
          </div>

          {/* Navigation Sidebar Menu */}
          <nav className="bg-paper-card border border-rule rounded-card p-2 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Menú del Estudiante
            </div>

            {/* Item 1: Fases y Cursos */}
            <button
              onClick={() => setActiveTab('courses')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-btn text-xs font-semibold transition-[background-color,color] cursor-pointer text-left ${
                activeTab === 'courses'
                  ? 'bg-ink text-paper shadow-xs font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-paper-muted'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4 shrink-0" />
                <div>
                  <span className="block leading-tight">Fases y Cursos</span>
                  <span
                    className={`block text-[10px] font-normal ${
                      activeTab === 'courses' ? 'text-paper/80' : 'text-ink-muted'
                    }`}
                  >
                    Mi curso y ruta de aprendizaje
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 ${
                  activeTab === 'courses' ? 'opacity-100' : 'opacity-40'
                }`}
              />
            </button>

            {/* Item 2: Historial de Evaluaciones */}
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-btn text-xs font-semibold transition-[background-color,color] cursor-pointer text-left ${
                activeTab === 'history'
                  ? 'bg-ink text-paper shadow-xs font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-paper-muted'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Award className="w-4 h-4 shrink-0" />
                <div>
                  <span className="block leading-tight">Historial de Evaluaciones</span>
                  <span
                    className={`block text-[10px] font-normal ${
                      activeTab === 'history' ? 'text-paper/80' : 'text-ink-muted'
                    }`}
                  >
                    Notas por fase (1A a Training)
                  </span>
                </div>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'history'
                    ? 'bg-paper/20 text-paper'
                    : 'bg-paper-muted text-ink'
                }`}
              >
                21
              </span>
            </button>

            {/* Item 3: Ingresar con PIN de Clase */}
            <button
              onClick={() => setActiveTab('pin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-btn text-xs font-semibold transition-[background-color,color] cursor-pointer text-left ${
                activeTab === 'pin'
                  ? 'bg-accent text-white shadow-xs font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-paper-muted'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <KeyRound className="w-4 h-4 shrink-0" />
                <div>
                  <span className="block leading-tight">Rendir con PIN</span>
                  <span
                    className={`block text-[10px] font-normal ${
                      activeTab === 'pin' ? 'text-white/80' : 'text-ink-muted'
                    }`}
                  >
                    Ingreso a sesión en vivo
                  </span>
                </div>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                  activeTab === 'pin'
                    ? 'bg-white text-accent'
                    : 'bg-accent/10 text-accent'
                }`}
              >
                PIN
              </span>
            </button>
          </nav>

          {/* Sidebar Mini Academic Summary */}
          {record && (
            <div className="bg-paper-card border border-rule rounded-card p-4 shadow-xs space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-ink">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                <span>Desempeño Global</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-paper rounded-btn border border-rule">
                  <span className="block text-[10px] text-ink-muted font-semibold uppercase">
                    Promedio
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {record.summary.generalAverage !== null
                      ? `${record.summary.generalAverage.toFixed(1)}`
                      : '---'}
                  </span>
                  <span className="block text-[9px] text-ink-muted">/ 5.0</span>
                </div>
                <div className="p-2 bg-paper rounded-btn border border-rule">
                  <span className="block text-[10px] text-ink-muted font-semibold uppercase">
                    Exámenes
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {record.summary.totalExamsTaken}
                  </span>
                  <span className="block text-[9px] text-ink-muted">Rendidos</span>
                </div>
              </div>
            </div>
          )}

          {/* Institutional Help / Support Link */}
          <div className="p-3 bg-paper-muted/80 rounded-card border border-rule text-[11px] text-ink-muted space-y-1">
            <span className="font-semibold text-ink block">¿Dudas con tu examen?</span>
            <p>
              Consulta directamente a tu docente de aula o acude a la Coordinación Académica.
            </p>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 w-full space-y-6">
          {/* Loading Spinner */}
          {loading && !record && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-paper-card border border-rule rounded-card">
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
              {/* ======================================================== */}
              {/* SUB-PANTALLA 1: FASES Y CURSOS (PANTALLA INICIAL)        */}
              {/* ======================================================== */}
              {activeTab === 'courses' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Section Title Header */}
                  <div className="bg-paper-card border border-rule rounded-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-accent mb-1">
                        <BookOpen className="w-4 h-4" />
                        <span>Fases y Cursos Oficiales</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-ink">
                        Mi Programa Académico & Asignación
                      </h2>
                      <p className="text-xs text-ink-muted">
                        Consulta los detalles de tu curso matriculado, horarios, docente y tu progreso en la ruta oficial de Aegis Test.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('pin')}
                      className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-accent hover:bg-accent/90 text-white font-semibold text-xs rounded-btn transition-[background-color,transform] cursor-pointer shrink-0 shadow-xs"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Rendir Examen con PIN</span>
                    </button>
                  </div>

                  {/* 4 Academic KPI Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* KPI 1: Current Level */}
                    <div className="p-4 bg-paper-card rounded-card border border-rule shadow-xs">
                      <span className="block text-[11px] text-ink-muted font-semibold uppercase">
                        Fase Actual
                      </span>
                      <span className="text-xl font-bold text-accent font-mono mt-1 block">
                        {record.summary.currentLevelCode || '---'}
                      </span>
                      <span className="block text-xs text-ink font-medium truncate mt-0.5">
                        {record.summary.currentLevelName}
                      </span>
                    </div>

                    {/* KPI 2: General Average */}
                    <div className="p-4 bg-paper-card rounded-card border border-rule shadow-xs">
                      <span className="block text-[11px] text-ink-muted font-semibold uppercase">
                        Promedio General
                      </span>
                      <span className="text-xl font-bold text-ink font-mono mt-1 block">
                        {record.summary.generalAverage !== null
                          ? `${record.summary.generalAverage.toFixed(1)} / 5.0`
                          : '---'}
                      </span>
                      <span className="block text-xs text-ink-muted mt-0.5">
                        {record.summary.generalAverage !== null && record.summary.generalAverage >= 3.0
                          ? 'Desempeño Aprobatorio'
                          : 'Sin evaluaciones calificadas'}
                      </span>
                    </div>

                    {/* KPI 3: Exams Completed */}
                    <div className="p-4 bg-paper-card rounded-card border border-rule shadow-xs">
                      <span className="block text-[11px] text-ink-muted font-semibold uppercase">
                        Exámenes Rendidos
                      </span>
                      <span className="text-xl font-bold text-ink font-mono mt-1 block">
                        {record.summary.totalExamsTaken}
                      </span>
                      <span className="block text-xs text-ink-muted mt-0.5">
                        Evaluaciones oficiales completadas
                      </span>
                    </div>

                    {/* KPI 4: Phases Completed */}
                    <div className="p-4 bg-paper-card rounded-card border border-rule shadow-xs">
                      <span className="block text-[11px] text-ink-muted font-semibold uppercase">
                        Fases del Programa
                      </span>
                      <span className="text-xl font-bold text-ink font-mono mt-1 block">
                        {record.summary.completedPhasesCount}{' '}
                        <span className="text-sm text-ink-muted font-normal">
                          / {record.summary.totalPhases}
                        </span>
                      </span>
                      <span className="block text-xs text-ink-muted mt-0.5">
                        Fases aprobadas en total
                      </span>
                    </div>
                  </div>

                  {/* Active Enrolled Course Details Card */}
                  <div className="bg-paper-card border border-rule rounded-card p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                          Curso Activo Asignado
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Matrícula Activa
                        </span>
                      </div>

                      {record.currentCourse && (
                        <span className="text-xs font-mono font-bold text-accent">
                          {record.currentCourse.level?.code || 'N/A'}
                        </span>
                      )}
                    </div>

                    {record.currentCourse ? (
                      <div className="bg-paper p-5 rounded-card border border-rule space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="inline-block px-2.5 py-0.5 rounded-btn bg-accent text-white font-mono text-xs font-bold mb-1.5">
                              Fase {record.currentCourse.level?.code || 'Oficial'}
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-ink">
                              {record.currentCourse.courseName}
                            </h3>
                            <p className="text-xs text-ink-muted mt-0.5">
                              {record.currentCourse.level?.name || 'Nivel regular'} · {formatModality(record.currentCourse.courseModality)}
                            </p>
                          </div>

                          <button
                            onClick={() => setActiveTab('history')}
                            className="inline-flex items-center text-xs text-accent hover:underline font-semibold cursor-pointer shrink-0"
                          >
                            <span>Ver exámenes de esta fase</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs text-ink-muted border-t border-rule/70">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-accent shrink-0" />
                            <div>
                              <span className="block text-[10px] uppercase font-semibold text-ink-muted">Días de Clase</span>
                              <strong className="text-ink font-medium">
                                {formatDays(record.currentCourse.scheduleDays)}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-accent shrink-0" />
                            <div>
                              <span className="block text-[10px] uppercase font-semibold text-ink-muted">Horario</span>
                              <strong className="text-ink font-medium">
                                {record.currentCourse.startTime?.slice(0, 5)} - {record.currentCourse.endTime?.slice(0, 5)}
                              </strong>
                            </div>
                          </div>

                          {record.currentCourse.teacher && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-accent shrink-0" />
                              <div>
                                <span className="block text-[10px] uppercase font-semibold text-ink-muted">Docente Titular</span>
                                <strong className="text-ink font-medium">
                                  {record.currentCourse.teacher.fullName}
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-paper-muted p-6 rounded-card border border-rule text-center space-y-2">
                        <AlertCircle className="w-6 h-6 text-ink-muted mx-auto" />
                        <h4 className="text-xs font-bold text-ink">Sin curso asignado actualmente</h4>
                        <p className="text-xs text-ink-muted max-w-md mx-auto">
                          Actualmente no te encuentras inscrito en ningún grupo activo. Comunícate con la Coordinación Académica para realizar tu matrícula de fase.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Aegis Test Academic Pathway / Roadmap de las 21 Fases */}
                  <div className="bg-paper-card border border-rule rounded-card p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-ink">
                          Mapa Curricular de Fases (1A a Training APTIS)
                        </h3>
                        <p className="text-xs text-ink-muted">
                          Haz clic sobre cualquier fase para saltar directamente a su detalle de calificaciones.
                        </p>
                      </div>
                      <span className="text-xs text-ink-muted font-medium">
                        21 Fases en Total
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
                      {record.phases.map((lvl) => {
                        const isCurrent = lvl.isCurrentLevel;
                        const isCompleted = lvl.phaseStatus === 'COMPLETED';
                        const isTraining = lvl.levelType === 'TRAINING_APTIS' || lvl.code === 'TRAINING';

                        return (
                          <button
                            key={lvl.levelId}
                            onClick={() => jumpToPhaseDetail(lvl.levelId)}
                            className={`p-2.5 rounded-btn border text-center transition-[background-color,border-color,transform] cursor-pointer flex flex-col items-center justify-between min-h-[72px] ${
                              isCurrent
                                ? 'bg-accent/10 border-accent text-accent font-bold shadow-xs'
                                : isCompleted
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-paper border-rule text-ink hover:border-ink/40'
                            }`}
                          >
                            <span className="font-mono text-xs font-bold">
                              {lvl.code}
                            </span>
                            <span className="text-[10px] leading-tight truncate w-full mt-1">
                              {isTraining ? 'Training' : lvl.name.replace('Nivel ', '')}
                            </span>
                            <span className="text-[9px] font-mono mt-0.5">
                              {lvl.phaseAverage !== null ? `${lvl.phaseAverage.toFixed(1)}` : '---'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SUB-PANTALLA 2: HISTORIAL DE EVALUACIONES POR FASE       */}
              {/* ======================================================== */}
              {activeTab === 'history' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Header with Title and Search/Filters */}
                  <div className="bg-paper-card border border-rule rounded-card p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-accent mb-1">
                          <Award className="w-4 h-4" />
                          <span>Malla Curricular & Calificaciones</span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-ink">
                          Historial de Evaluaciones por Fase
                        </h2>
                        <p className="text-xs text-ink-muted">
                          Consulta tus reactivos intermedios (Midterm) y finales organizados fase por fase con calificaciones sobre 5.0.
                        </p>
                      </div>

                      {/* Search box */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-muted" />
                        <input
                          type="text"
                          placeholder="Buscar fase (ej. 4A, Training)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="text-xs py-2 pl-8 pr-3 bg-paper rounded-btn border border-rule focus:outline-none focus:border-accent text-ink w-full"
                        />
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="pt-2 border-t border-rule flex flex-wrap items-center gap-2">
                      <span className="text-xs text-ink-muted font-medium mr-1">Filtrar:</span>
                      <button
                        onClick={() => setFilterTab('all')}
                        className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-[background-color,color] cursor-pointer ${
                          filterTab === 'all'
                            ? 'bg-ink text-paper font-bold'
                            : 'bg-paper text-ink-muted border border-rule hover:text-ink'
                        }`}
                      >
                        Todas las Fases ({record.phases.length})
                      </button>
                      <button
                        onClick={() => setFilterTab('active')}
                        className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-[background-color,color] cursor-pointer ${
                          filterTab === 'active'
                            ? 'bg-ink text-paper font-bold'
                            : 'bg-paper text-ink-muted border border-rule hover:text-ink'
                        }`}
                      >
                        Fase Actual & Realizadas
                      </button>
                      <button
                        onClick={() => setFilterTab('regular')}
                        className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-[background-color,color] cursor-pointer ${
                          filterTab === 'regular'
                            ? 'bg-ink text-paper font-bold'
                            : 'bg-paper text-ink-muted border border-rule hover:text-ink'
                        }`}
                      >
                        Fases Regulares (1A - 10B)
                      </button>
                      <button
                        onClick={() => setFilterTab('training')}
                        className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-[background-color,color] cursor-pointer ${
                          filterTab === 'training'
                            ? 'bg-ink text-paper font-bold'
                            : 'bg-paper text-ink-muted border border-rule hover:text-ink'
                        }`}
                      >
                        Fase Training (APTIS)
                      </button>
                    </div>
                  </div>

                  {/* Phase List Accordion */}
                  <div className="bg-paper-card border border-rule rounded-card shadow-xs overflow-hidden divide-y divide-rule">
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
                            {/* Phase Row Header */}
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

                                {/* Level Name & Description */}
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

                              {/* Right Meta: Average & Status */}
                              <div className="flex items-center space-x-3 sm:space-x-5">
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

                                <div className="text-ink-muted">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details: Midterm & Final Cards */}
                            {isExpanded && (
                              <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-rule/70">
                                  {/* Midterm Card */}
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

                                    {/* Score */}
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

                                  {/* Final Exam Card or Training Notice */}
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

                                      {/* Score */}
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
              )}

              {/* ======================================================== */}
              {/* SUB-PANTALLA 3: INGRESAR CON PIN DE CLASE                */}
              {/* ======================================================== */}
              {activeTab === 'pin' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="max-w-xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-paper-card border border-rule rounded-card p-6 shadow-xs text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-accent/10 text-accent mx-auto flex items-center justify-center font-bold">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-bold text-ink">
                        Ingreso a Evaluación Oficial
                      </h2>
                      <p className="text-xs text-ink-muted max-w-md mx-auto">
                        Digita el PIN de 6 dígitos que el docente proyecta en el aula o tablero para iniciar tu examen en curso.
                      </p>
                    </div>

                    {/* PIN Card */}
                    <div className="bg-paper-card border border-rule rounded-card p-6 sm:p-8 shadow-xs space-y-6">
                      {/* Identified Student Header */}
                      <div className="p-3 bg-paper rounded-btn border border-rule flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent text-white font-bold flex items-center justify-center text-xs">
                            {record?.student ? getInitials(record.student.fullName) : 'ES'}
                          </div>
                          <div>
                            <span className="font-bold text-ink block">
                              {record?.student?.fullName}
                            </span>
                            <span className="font-mono text-accent text-[11px]">
                              {record?.student?.studentCode || 'EST-2026-OFICIAL'}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Sesión Verificada
                        </span>
                      </div>

                      {/* PIN Input Form */}
                      <form onSubmit={handleJoinWithPin} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-ink-muted mb-2 text-center">
                            Código PIN de la Sesión
                          </label>
                          <input
                            type="text"
                            value={pin}
                            onChange={handlePinChange}
                            placeholder="000-000"
                            autoFocus
                            className="w-full text-center tracking-[0.3em] font-mono text-3xl font-extrabold py-3.5 px-4 bg-paper rounded-btn border border-rule focus:outline-none focus:border-accent text-ink"
                            maxLength={7}
                          />
                          <p className="text-[11px] text-ink-muted text-center mt-1.5">
                            Formato de 6 números separado por guión (ej. 123-456)
                          </p>
                          {pinError && (
                            <p className="mt-2 text-xs text-rose-600 font-semibold text-center">
                              {pinError}
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={joiningPin || pin.length < 6}
                          className="w-full py-3 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-bold text-sm rounded-btn flex items-center justify-center space-x-2 transition-[background-color,transform] cursor-pointer shadow-xs"
                        >
                          {joiningPin ? (
                            <span>Verificando PIN de clase...</span>
                          ) : (
                            <>
                              <span>Comenzar Evaluación Oficial</span>
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </>
                          )}
                        </button>
                      </form>

                      {/* Screen link */}
                      <div className="pt-2 text-center border-t border-rule/70">
                        <Link
                          href="/exam/join"
                          className="inline-flex items-center text-xs text-ink-muted hover:text-ink underline"
                        >
                          <span>Abrir modo pantalla completa / proyector</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    </div>

                    {/* Classroom Guidelines */}
                    <div className="bg-paper-card border border-rule rounded-card p-5 text-xs text-ink-muted space-y-3">
                      <div className="flex items-center space-x-2 font-bold text-ink">
                        <ShieldCheck className="w-4 h-4 text-accent" />
                        <span>Instrucciones de Seguridad en el Aula</span>
                      </div>
                      <ul className="space-y-1.5 list-disc pl-4 text-[11px]">
                        <li>
                          <strong>Monitoreo de Pestaña:</strong> No cambies de ventana ni aplicación durante la evaluación; el sistema registra alertas automáticas ante pérdidas de foco.
                        </li>
                        <li>
                          <strong>Tiempo de Prueba:</strong> El temporizador corre de forma ininterrumpida una vez validado el PIN.
                        </li>
                        <li>
                          <strong>Registro Automático:</strong> Tus respuestas se califican al presionar enviar y tu nota se vinculará de inmediato a tu expediente académico.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-rule text-center text-xs text-ink-muted bg-paper-card">
        Aegis Test © 2026 · Sistema Integral de Evaluaciones y Seguimiento Académico
      </footer>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-paper flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-ink-muted">Cargando Portal del Estudiante...</p>
        </div>
      }
    >
      <StudentDashboardContent />
    </React.Suspense>
  );
}
