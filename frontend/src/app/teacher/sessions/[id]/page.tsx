'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  api,
  MonitorDashboardResponse,
  Question,
} from '../../../../lib/api';
import { RoleGuard } from '../../../../components/auth/RoleGuard';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  MessageCircle,
  ExternalLink,
  Loader2,
  StopCircle,
  RefreshCw,
  BookOpen,
  FastForward,
  Rewind,
  Maximize2,
  Minimize2,
  Monitor,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldAlert,
  X,
  Tv,
} from 'lucide-react';

export default function TeacherSessionMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [dashboard, setDashboard] = useState<MonitorDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fullscreen classroom projector
  const [isProjectorFullscreen, setIsProjectorFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when in fullscreen to prevent double scrollbars and background shifts
  useEffect(() => {
    if (isProjectorFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isProjectorFullscreen]);

  // Modals
  const [showConfirmFinishModal, setShowConfirmFinishModal] = useState(false);
  const [showIncidentsModal, setShowIncidentsModal] = useState(false);
  const [isAttendanceExpanded, setIsAttendanceExpanded] = useState(false);

  const fetchDashboard = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const data = await api.getMonitorDashboard(sessionId);
      setDashboard(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del monitor');
    } finally {
      if (isInitial) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    fetchDashboard(true);

    intervalId = setInterval(() => {
      fetchDashboard(false);
    }, 3500);

    return () => clearInterval(intervalId);
  }, [sessionId]);

  const BLOCK_SIZE = 5;
  const totalQuestions =
    dashboard?.questions?.length ||
    dashboard?.examTemplate?.totalQuestions ||
    30;
  const totalBlocks =
    dashboard?.totalBlocks ||
    Math.max(1, Math.ceil(totalQuestions / BLOCK_SIZE));
  const currentBlock = Math.min(
    Math.max(1, dashboard?.currentBlock || 1),
    totalBlocks,
  );
  const blockStart = (currentBlock - 1) * BLOCK_SIZE;
  const blockEnd = Math.min(blockStart + BLOCK_SIZE, totalQuestions);
  const currentBlockQuestions =
    dashboard?.questions?.slice(blockStart, blockEnd) || [];

  // Keyboard navigation for Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProjectorFullscreen(false);
      } else if (isProjectorFullscreen) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          if (currentBlock < totalBlocks) {
            handleAdvanceBlock();
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          if (currentBlock > 1) {
            handlePreviousBlock();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProjectorFullscreen, currentBlock, totalBlocks]);

  const handleAdvanceBlock = async () => {
    try {
      setAdvancing(true);
      await api.advanceBlock(sessionId);
      const updated = await api.getMonitorDashboard(sessionId);
      setDashboard(updated);
    } catch (err: any) {
      setError(err.message || 'Error al avanzar de bloque');
    } finally {
      setAdvancing(false);
    }
  };

  const handlePreviousBlock = async () => {
    try {
      setAdvancing(true);
      await api.previousBlock(sessionId);
      const updated = await api.getMonitorDashboard(sessionId);
      setDashboard(updated);
    } catch (err: any) {
      setError(err.message || 'Error al retroceder de bloque');
    } finally {
      setAdvancing(false);
    }
  };

  const handleSetBlock = async (targetBlock: number) => {
    try {
      setAdvancing(true);
      await api.setBlock(sessionId, targetBlock);
      const updated = await api.getMonitorDashboard(sessionId);
      setDashboard(updated);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar de bloque');
    } finally {
      setAdvancing(false);
    }
  };

  const handleExecuteFinishSession = async () => {
    try {
      setFinishing(true);
      await api.finishSession(sessionId);
      const updated = await api.getMonitorDashboard(sessionId);
      setDashboard(updated);
      setShowConfirmFinishModal(false);
    } catch (err: any) {
      setError(err.message || 'Error al cerrar la sesión');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-ink-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando monitor de examen...</span>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex-1 max-w-container mx-auto p-8 text-center text-ink-muted">
        No se encontró la sesión solicitada.
      </div>
    );
  }

  const isFinished = dashboard.status === 'FINISHED';
  const isSyncMode = dashboard.mode === 'SYNC_BLOCKS';
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/exam/join`
    : 'https://aegis-test.vercel.app/exam/join';

  return (
    <RoleGuard allowedRoleIds={[1, 2]} sectionName="el Monitor de Sesión">
      <div className="flex-1 max-w-container mx-auto w-full px-4 py-8 space-y-6">
        {/* Top Navigation & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rule gap-3">
          <div>
            <Link
              href="/teacher"
              className="inline-flex items-center text-xs text-ink-muted hover:text-ink font-medium mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Volver a Cursos
            </Link>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-ink">
                {isSyncMode ? 'Proyector de Examen por Bloques' : 'Monitor de Asistencia y Sesión en Vivo'}
              </h1>
              {refreshing && (
                <RefreshCw className="w-3.5 h-3.5 text-ink-muted animate-spin" />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-btn text-xs font-bold uppercase tracking-wider ${
                isFinished
                  ? 'bg-ink text-paper'
                  : 'bg-success text-paper-card animate-pulse'
              }`}
            >
              {isFinished ? 'Sesión Finalizada' : 'En Vivo (Activa)'}
            </span>
            {!isFinished && (
              <button
                type="button"
                onClick={() => setShowConfirmFinishModal(true)}
                disabled={finishing}
                className="px-3 py-1.5 bg-danger text-paper-card hover:bg-danger/90 rounded-btn text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <StopCircle className="w-3.5 h-3.5 mr-1" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-danger-soft border border-danger/20 rounded-btn text-xs text-danger font-medium">
            {error}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 1: SYNC_BLOCKS MODE -> DIRECT PROJECTOR CONTROLLER (NO PIN BANNER!) */}
        {/* ========================================================================= */}
        {isSyncMode ? (
          <div className="space-y-6">
            {/* Top Projector Controller Bar */}
            <div className="p-5 sm:p-6 bg-paper-card border border-rule rounded-card shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule/70 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-accent text-accent-ink text-xs font-bold rounded flex items-center gap-1.5 shadow-xs">
                      <Tv className="w-3.5 h-3.5" />
                      <span>Proyección en Pantalla de Aula</span>
                    </span>
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                      {dashboard.course?.courseName} ({dashboard.course?.levelName || dashboard.course?.levelCode || 'Nivel'})
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-ink">
                    {dashboard.examTemplate?.title || 'Examen en Vivo'}
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    onClick={() => setIsProjectorFullscreen(true)}
                    className="px-3 py-2 bg-ink text-paper hover:bg-ink/90 font-semibold rounded-btn text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Maximizar proyector a pantalla completa en proyector/TV"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Pantalla Completa</span>
                  </button>

                  {/* Previous Block Button */}
                  <button
                    type="button"
                    onClick={handlePreviousBlock}
                    disabled={advancing || currentBlock <= 1}
                    className="px-3 py-2 bg-paper border border-rule hover:border-rule-strong text-ink font-semibold rounded-btn text-xs inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer shadow-xs transition-colors"
                    title="Ver bloque anterior"
                  >
                    <Rewind className="w-3.5 h-3.5" />
                    <span>Bloque Anterior</span>
                  </button>

                  {/* Advance Block Button */}
                  {!isFinished && (
                    <button
                      type="button"
                      onClick={
                        currentBlock < totalBlocks
                          ? handleAdvanceBlock
                          : () => setShowConfirmFinishModal(true)
                      }
                      disabled={advancing}
                      className="px-4 py-2 bg-accent text-accent-ink hover:bg-accent-hover font-bold rounded-btn text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                    >
                      {advancing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FastForward className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {currentBlock < totalBlocks
                          ? `Avanzar al Bloque ${currentBlock + 1}`
                          : 'Finalizar Evaluación'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Block Selection Tabs (Pills) */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-ink-muted mr-1">
                    Bloques:
                  </span>
                  {Array.from({ length: totalBlocks }, (_, i) => i + 1).map((b) => {
                    const isActive = b === currentBlock;
                    const bStart = (b - 1) * BLOCK_SIZE + 1;
                    const bEnd = Math.min(b * BLOCK_SIZE, totalQuestions);

                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleSetBlock(b)}
                        disabled={advancing}
                        className={`px-3 py-1.5 rounded-btn text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-accent text-accent-ink shadow-xs ring-2 ring-accent'
                            : 'bg-paper-muted text-ink hover:bg-paper-muted/80 border border-rule'
                        }`}
                      >
                        Bloque {b} ({bStart}-{bEnd})
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-mono font-semibold text-ink bg-paper-muted px-3 py-1 rounded-btn border border-rule">
                  Mostrando Puntos {blockStart + 1} a {blockEnd} de {totalQuestions}
                </div>
              </div>
            </div>

            {/* Direct 5-Points Main Projection Cards */}
            <div className="space-y-6">
              {currentBlockQuestions.length === 0 ? (
                <div className="p-12 text-center text-ink-muted text-sm space-y-3 bg-paper-card border border-rule rounded-card">
                  <BookOpen className="w-10 h-10 text-ink-muted mx-auto opacity-40" />
                  <p className="font-bold text-ink">
                    No se encontraron preguntas cargadas para este bloque.
                  </p>
                  <p className="text-xs">
                    Verifica que la plantilla del examen contenga reactivos registrados.
                  </p>
                </div>
              ) : (
                currentBlockQuestions.map((q, idx) => {
                  const globalNum = blockStart + idx + 1;

                  return (
                    <div
                      key={q.id}
                      className="p-6 sm:p-7 bg-paper-card border border-rule rounded-card shadow-xs space-y-4"
                    >
                      {/* Question Top Header */}
                      <div className="flex items-center justify-between gap-3 border-b border-rule/70 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-accent text-accent-ink font-mono font-bold text-sm rounded shadow-xs">
                            PUNTO #{globalNum}
                          </span>
                          <span className="text-xs text-ink-muted uppercase tracking-wider font-bold">
                            {q.type === 'ICFES_MULTIPLE_CHOICE'
                              ? 'Opción Múltiple (ICFES)'
                              : q.type === 'SENTENCE_SCRAMBLE'
                              ? 'Ordenar Oración (Sentence Scramble)'
                              : q.type === 'FILL_IN_BLANK'
                              ? 'Completar Espacios (Cloze)'
                              : 'Completar Oración'}
                          </span>
                        </div>
                        <span className="text-xs text-ink-muted font-mono font-semibold bg-paper-muted px-2.5 py-0.5 rounded border border-rule">
                          {q.points} {Number(q.points) === 1 ? 'punto' : 'puntos'}
                        </span>
                      </div>

                      {/* Question Context (if present) */}
                      {(q.contextText || q.context) && (
                        <div className="p-4 bg-paper-muted border-l-4 border-accent rounded-r text-sm text-ink font-serif italic leading-relaxed">
                          {q.contextText || q.context}
                        </div>
                      )}

                      {/* Question Prompt */}
                      <h3 className="text-base sm:text-lg font-bold text-ink leading-relaxed">
                        {q.prompt}
                      </h3>

                      {/* Question Content / Choices */}
                      {q.type === 'ICFES_MULTIPLE_CHOICE' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {q.options?.map((opt, oIdx) => {
                            const letter = String.fromCharCode(65 + oIdx);
                            return (
                              <div
                                key={opt.id}
                                className="p-3.5 bg-paper border border-rule rounded-card text-sm flex items-center gap-3 shadow-xs"
                              >
                                <span className="w-8 h-8 rounded-full bg-accent-soft text-accent font-bold text-sm flex items-center justify-center shrink-0">
                                  {letter}
                                </span>
                                <span className="text-ink font-medium leading-snug">
                                  {opt.content}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'SENTENCE_SCRAMBLE' && (
                        <div className="space-y-2 pt-2">
                          <p className="text-xs text-ink-muted font-semibold">
                            Fichas de palabras para ordenar sintácticamente:
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {q.options?.map((opt) => (
                              <span
                                key={opt.id}
                                className="px-4 py-2 bg-paper border border-rule rounded-card text-sm font-bold text-ink shadow-xs"
                              >
                                {opt.content}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === 'FILL_IN_BLANK' && (
                        <div className="space-y-3 pt-2">
                          <p className="text-xs text-ink-muted font-semibold">
                            Opciones para los espacios en blanco:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {q.options?.map((opt) => (
                              <span
                                key={opt.id}
                                className="px-3 py-1.5 bg-paper border border-rule rounded-btn text-xs font-semibold text-ink"
                              >
                                {opt.blankId ? `[Espacio #${opt.blankId}]: ` : ''}
                                {opt.content}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === 'SENTENCE_COMPLETION' && (
                        <div className="p-3 bg-paper-muted rounded-btn border border-dashed border-rule text-xs text-ink-muted font-mono">
                          Espacio de respuesta escrita: [ __________________________________ ]
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Projector Controls */}
            <div className="p-4 bg-paper-card border border-rule rounded-card flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={handlePreviousBlock}
                disabled={advancing || currentBlock <= 1}
                className="px-4 py-2 bg-paper border border-rule hover:border-rule-strong text-ink font-semibold rounded-btn text-xs inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs transition-colors"
              >
                <Rewind className="w-3.5 h-3.5" />
                <span>Bloque Anterior</span>
              </button>

              <div className="text-xs font-semibold text-ink-muted">
                Bloque <strong className="text-ink">{currentBlock}</strong> de <strong className="text-ink">{totalBlocks}</strong> (Puntos {blockStart + 1} a {blockEnd})
              </div>

              {!isFinished && (
                <button
                  type="button"
                  onClick={
                    currentBlock < totalBlocks
                      ? handleAdvanceBlock
                      : () => setShowConfirmFinishModal(true)
                  }
                  disabled={advancing}
                  className="px-4 py-2 bg-accent text-accent-ink hover:bg-accent-hover font-bold rounded-btn text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  {advancing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FastForward className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {currentBlock < totalBlocks
                      ? `Avanzar al Bloque ${currentBlock + 1}`
                      : 'Finalizar Evaluación'}
                  </span>
                </button>
              )}
            </div>

            {/* Collapsible Section: Enrolled Students / Attendance */}
            <div className="bg-paper-card border border-rule rounded-card overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setIsAttendanceExpanded(!isAttendanceExpanded)}
                className="w-full p-4 border-b border-rule flex items-center justify-between hover:bg-paper-muted/50 cursor-pointer text-left transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-ink-muted" />
                  <h3 className="text-sm font-bold text-ink">
                    Lista Oficial de Alumnos Matriculados ({dashboard.summary.total})
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span>{isAttendanceExpanded ? 'Ocultar lista' : 'Ver lista y asistencia'}</span>
                  {isAttendanceExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isAttendanceExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-rule bg-paper-muted text-ink-muted font-semibold">
                        <th className="py-2.5 px-4">Estudiante</th>
                        <th className="py-2.5 px-4">Código</th>
                        <th className="py-2.5 px-4">Estado</th>
                        <th className="py-2.5 px-4 text-right">Contacto (Ausentes)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {dashboard.attendees.map((attendee) => (
                        <tr key={attendee.attendeeId} className="hover:bg-paper-muted/50">
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-ink">{attendee.fullName}</div>
                            <div className="text-[11px] text-ink-muted">{attendee.email}</div>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-accent">
                            {attendee.studentCode || '---'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 bg-paper-muted rounded text-xs font-semibold text-ink">
                              {attendee.attendanceStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {attendee.whatsappLink ? (
                              <a
                                href={attendee.whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-0.5 bg-success-soft text-success hover:bg-success hover:text-white rounded text-[11px] font-semibold transition-colors"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                <span>WhatsApp</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-ink-muted italic">Sin teléfono</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE 2: FREE_PACE MODE -> PIN BANNER & INDIVIDUAL ONLINE RUNNER MONITOR */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Hero Display: PIN Projection Banner for Free Pace */}
            <div className="p-6 sm:p-8 bg-paper-card border border-rule rounded-card shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left space-y-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-widest">
                  PIN para Proyectar a los Estudiantes (Modo Ritmo Libre)
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-widest text-ink select-all">
                  {dashboard.sessionPin}
                </div>
                <p className="text-xs text-ink-muted">
                  Los estudiantes ingresan en: <strong className="text-ink">{joinUrl}</strong>
                </p>
              </div>

              {/* Summary Metrics */}
              <div className="flex items-center space-x-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-ink">
                    {dashboard.summary.total}
                  </div>
                  <div className="text-xs text-ink-muted">Matriculados</div>
                </div>
                <div className="border-l border-rule pl-6">
                  <div className="text-2xl font-bold text-success">
                    {dashboard.summary.present}
                  </div>
                  <div className="text-xs text-ink-muted">Presentes</div>
                </div>
                <div className="border-l border-rule pl-6">
                  <div className="text-2xl font-bold text-danger">
                    {dashboard.summary.pendingOrAbsent}
                  </div>
                  <div className="text-xs text-ink-muted">Pendientes / N/P</div>
                </div>
                <div className="border-l border-rule pl-6">
                  <div
                    className={`text-2xl font-bold ${
                      (dashboard.summary.totalInfractions || 0) > 0
                        ? 'text-danger animate-pulse'
                        : 'text-ink-muted'
                    }`}
                  >
                    {dashboard.summary.totalInfractions || 0}
                  </div>
                  <div className="text-xs text-ink-muted">Infracciones Seg.</div>
                </div>
              </div>
            </div>

            {/* Real-time Security Alert Banner */}
            {(dashboard.summary.totalInfractions || 0) > 0 && (
              <div className="p-4 bg-danger-soft border border-danger/30 rounded-card flex items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger text-white rounded-full shrink-0">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-danger">
                      Alerta Activa de Seguridad & Anti-Fraude
                    </h3>
                    <p className="text-xs text-danger/90">
                      Se han registrado <strong>{dashboard.summary.totalInfractions}</strong> incidencias de salida de pantalla / intentos de uso de IA en <strong>{dashboard.summary.studentsWithInfractions}</strong> estudiante(s).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIncidentsModal(true)}
                  className="px-3 py-1.5 bg-danger text-white hover:bg-danger/90 rounded-btn text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-transform active:scale-95"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Ver Informe de Incidentes</span>
                </button>
              </div>
            )}

            {/* Attendance Roster Table */}
            <div className="bg-paper-card border border-rule rounded-card overflow-hidden shadow-xs">
              <div className="p-4 border-b border-rule flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-ink-muted" />
                  <h2 className="text-sm font-bold text-ink">
                    Lista Oficial de Asistencia del Curso
                  </h2>
                </div>
                <span className="text-xs text-ink-muted">
                  Actualización automática cada 3.5s
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-rule bg-paper-muted text-ink-muted font-semibold">
                      <th className="py-3 px-4">Estudiante</th>
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Estado de Asistencia</th>
                      <th className="py-3 px-4">Calificación</th>
                      <th className="py-3 px-4 text-right">Acción Rápida (Ausentes)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {dashboard.attendees.map((attendee) => {
                      const status = attendee.attendanceStatus;

                      return (
                        <tr key={attendee.attendeeId} className="hover:bg-paper-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-bold text-ink">
                              {attendee.fullName}
                            </div>
                            <div className="text-[11px] text-ink-muted">
                              {attendee.email || (attendee.phoneNumber ? attendee.phoneNumber : '')}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-accent px-2 py-0.5 bg-paper-muted rounded border border-rule text-xs">
                              {attendee.studentCode || '---'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {status === 'IN_PROGRESS' && (
                              <span className="px-2 py-0.5 bg-accent-soft text-accent font-semibold rounded inline-flex items-center">
                                <Clock className="w-3 h-3 mr-1 animate-spin" />
                                En Examen
                              </span>
                            )}
                            {status === 'COMPLETED' && (
                              <span className="px-2 py-0.5 bg-success-soft text-success font-semibold rounded inline-flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completado
                              </span>
                            )}
                            {status === 'PENDING' && (
                              <span className="px-2 py-0.5 bg-warning-soft text-warning font-semibold rounded">
                                Pendiente (No ha ingresado)
                              </span>
                            )}
                            {status === 'ABSENT' && (
                              <span className="px-2 py-0.5 bg-danger-soft text-danger font-semibold rounded">
                                Ausente (N/P)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {attendee.totalScore !== null && attendee.totalScore !== undefined
                              ? `${Number(attendee.totalScore).toFixed(1)} pts`
                              : '---'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {attendee.whatsappLink ? (
                              <a
                                href={attendee.whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2.5 py-1 bg-success-soft text-success hover:bg-success hover:text-white rounded text-xs font-semibold transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                <span>Avisar WhatsApp</span>
                              </a>
                            ) : (
                              <span className="text-ink-muted italic">Sin teléfono</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación para Finalizar Sesión */}
        {showConfirmFinishModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => !finishing && setShowConfirmFinishModal(false)}
          >
            <div
              className="bg-paper-card border border-rule rounded-card max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-danger-soft text-danger rounded-full shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-ink">
                    ¿Finalizar la Sesión de Examen?
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Esta acción cerrará la sesión de evaluación para todos los alumnos.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setShowConfirmFinishModal(false)}
                  disabled={finishing}
                  className="px-4 py-2 bg-paper-card border border-rule text-ink hover:bg-paper-muted rounded-btn text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteFinishSession}
                  disabled={finishing}
                  className="px-4 py-2 bg-danger text-white hover:bg-danger/90 rounded-btn text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs transition-colors"
                >
                  {finishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Finalizando...</span>
                    </>
                  ) : (
                    <>
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>Sí, Finalizar Sesión</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Informe de Incidentes de Seguridad */}
        {showIncidentsModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowIncidentsModal(false)}
          >
            <div
              className="bg-paper-card border border-rule rounded-card max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-rule flex items-center justify-between bg-paper-muted">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-danger-soft text-danger rounded-full">
                    <ShieldAlert className="w-5 h-5 text-danger" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">
                      Informe de Auditoría de Seguridad & Anti-Fraude
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIncidentsModal(false)}
                  className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-card rounded-btn cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex justify-end border-t border-rule bg-paper-muted">
                <button
                  type="button"
                  onClick={() => setShowIncidentsModal(false)}
                  className="px-4 py-1.5 bg-ink text-paper hover:bg-ink/90 rounded-btn text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Cerrar Informe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FULLSCREEN CLASSROOM PROJECTOR (PORTAL DIRECTLY TO BODY - LIGHT MODE)     */}
        {/* ========================================================================= */}
        {isProjectorFullscreen && mounted && createPortal(
          <div className="fixed inset-0 z-[9999] w-screen h-screen bg-paper text-ink flex flex-col overflow-y-auto overscroll-contain animate-in fade-in duration-150">
            {/* Sticky Top Bar in Light Editorial Mode */}
            <header className="sticky top-0 z-20 bg-paper-card/95 backdrop-blur-xs border-b border-rule px-6 sm:px-10 py-4 flex items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-accent text-accent-ink text-xs font-bold rounded shadow-xs uppercase tracking-wider">
                  Aegis Test · Proyector de Aula
                </span>
                <span className="text-ink font-bold text-sm sm:text-base">
                  {dashboard.course?.courseName} ({dashboard.course?.levelName || dashboard.course?.levelCode || 'Nivel'}) · {dashboard.examTemplate?.title}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Previous Block Button */}
                <button
                  type="button"
                  onClick={handlePreviousBlock}
                  disabled={advancing || currentBlock <= 1}
                  className="px-3.5 py-2 bg-paper border border-rule hover:border-rule-strong text-ink text-xs font-semibold rounded-btn inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs transition-colors"
                >
                  <Rewind className="w-4 h-4" />
                  <span>Bloque Anterior</span>
                </button>

                {/* Advance Block Button */}
                {!isFinished && (
                  <button
                    type="button"
                    onClick={
                      currentBlock < totalBlocks
                        ? handleAdvanceBlock
                        : () => {
                            setIsProjectorFullscreen(false);
                            setShowConfirmFinishModal(true);
                          }
                    }
                    disabled={advancing}
                    className="px-4 py-2 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-bold rounded-btn inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                  >
                    <FastForward className="w-4 h-4" />
                    <span>
                      {currentBlock < totalBlocks
                        ? `Avanzar al Bloque ${currentBlock + 1}`
                        : 'Finalizar Evaluación'}
                    </span>
                  </button>
                )}

                {/* Exit Fullscreen Button */}
                <button
                  type="button"
                  onClick={() => setIsProjectorFullscreen(false)}
                  className="px-3.5 py-2 bg-paper-muted hover:bg-paper-muted/80 text-ink text-xs font-semibold rounded-btn inline-flex items-center gap-1.5 cursor-pointer border border-rule transition-colors"
                  title="Cerrar pantalla completa (Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Salir (Esc)</span>
                </button>
              </div>
            </header>

            {/* Subheader / Block Banner */}
            <div className="max-w-5xl mx-auto w-full px-6 sm:px-10 pt-8 pb-4 border-b border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-accent font-extrabold font-mono text-2xl sm:text-3xl">
                  Bloque {currentBlock} de {totalBlocks}
                </span>
                <span className="text-ink-muted text-sm ml-3 font-medium">
                  (Puntos {blockStart + 1} a {blockEnd} de {totalQuestions})
                </span>
              </div>
              <div className="text-ink-muted text-xs font-mono bg-paper-muted px-3 py-1 rounded-btn border border-rule self-start sm:self-auto">
                Usa las teclas [←] y [→] para avanzar o retroceder de bloque
              </div>
            </div>

            {/* Questions List (Light Mode with High Contrast Typography) */}
            <main className="flex-1 max-w-5xl mx-auto w-full px-6 sm:px-10 py-8 space-y-6">
              {currentBlockQuestions.map((q, idx) => {
                const globalNum = blockStart + idx + 1;
                return (
                  <div
                    key={q.id}
                    className="p-6 sm:p-8 bg-paper-card border border-rule rounded-card shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-rule/70 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1 bg-accent text-accent-ink font-mono font-bold text-base rounded shadow-xs">
                          PUNTO #{globalNum}
                        </span>
                        <span className="text-xs text-ink-muted uppercase tracking-wider font-bold">
                          {q.type === 'ICFES_MULTIPLE_CHOICE'
                            ? 'Opción Múltiple (ICFES)'
                            : q.type === 'SENTENCE_SCRAMBLE'
                            ? 'Ordenar Oración'
                            : q.type === 'FILL_IN_BLANK'
                            ? 'Completar Espacios'
                            : 'Completar Oración'}
                        </span>
                      </div>
                      <span className="text-xs text-ink-muted font-mono font-semibold bg-paper-muted px-2.5 py-1 rounded border border-rule">
                        {q.points} {Number(q.points) === 1 ? 'punto' : 'puntos'}
                      </span>
                    </div>

                    {(q.contextText || q.context) && (
                      <div className="p-4 bg-paper-muted border-l-4 border-accent rounded-r text-ink font-serif italic text-base leading-relaxed">
                        {q.contextText || q.context}
                      </div>
                    )}

                    <h2 className="text-xl sm:text-2xl font-bold text-ink leading-relaxed">
                      {q.prompt}
                    </h2>

                    {q.type === 'ICFES_MULTIPLE_CHOICE' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                        {q.options?.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          return (
                            <div
                              key={opt.id}
                              className="p-4 bg-paper border border-rule rounded-card flex items-center gap-3.5 text-base text-ink shadow-xs"
                            >
                              <span className="w-9 h-9 rounded-full bg-accent-soft text-accent font-bold text-base flex items-center justify-center shrink-0">
                                {letter}
                              </span>
                              <span className="font-medium leading-snug">
                                {opt.content}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'SENTENCE_SCRAMBLE' && (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs text-ink-muted font-semibold">
                          Palabras para ordenar la oración:
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {q.options?.map((opt) => (
                            <span
                              key={opt.id}
                              className="px-5 py-2.5 bg-paper border border-rule rounded-card text-base font-bold text-ink shadow-xs"
                            >
                              {opt.content}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.type === 'FILL_IN_BLANK' && (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs text-ink-muted font-semibold">
                          Opciones para los espacios:
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {q.options?.map((opt) => (
                            <span
                              key={opt.id}
                              className="px-4 py-2 bg-paper border border-rule rounded-btn text-sm font-semibold text-ink"
                            >
                              {opt.blankId ? `[Espacio #${opt.blankId}]: ` : ''}
                              {opt.content}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.type === 'SENTENCE_COMPLETION' && (
                      <div className="p-4 bg-paper-muted rounded-card border border-dashed border-rule text-sm text-ink-muted font-mono">
                        Espacio de respuesta escrita: [ __________________________________ ]
                      </div>
                    )}
                  </div>
                );
              })}
            </main>
          </div>,
          document.body,
        )}
      </div>
    </RoleGuard>
  );
}
