'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, MonitorDashboardResponse } from '../../../../lib/api';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FastForward,
  Loader2,
  MessageCircle,
  RefreshCw,
  StopCircle,
  Users,
  ShieldAlert,
} from 'lucide-react';
import RoleGuard from '../../../../components/auth/RoleGuard';

export default function TeacherSessionMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [dashboard, setDashboard] = useState<MonitorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll dashboard every 3.5 seconds for real-time check-ins and scores
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchDashboard = async (isInitial = false) => {
      try {
        if (!isInitial) setRefreshing(true);
        const data = await api.getMonitorDashboard(sessionId);
        setDashboard(data);
      } catch (err: any) {
        setError(err.message || 'Error al obtener estado de sesión');
      } finally {
        if (isInitial) setLoading(false);
        setRefreshing(false);
      }
    };

    fetchDashboard(true);

    intervalId = setInterval(() => {
      fetchDashboard(false);
    }, 3500);

    return () => clearInterval(intervalId);
  }, [sessionId]);

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

  const handleFinishSession = async () => {
    if (!confirm('¿Estás seguro de finalizar la sesión? Los alumnos que no ingresaron quedarán automáticamente registrados como Ausente (No Presentó - N/P).')) {
      return;
    }

    try {
      setFinishing(true);
      await api.finishSession(sessionId);
      const updated = await api.getMonitorDashboard(sessionId);
      setDashboard(updated);
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
              Monitor de Asistencia y Sesión en Vivo
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
              onClick={handleFinishSession}
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

      {/* Hero Display: PIN Projection Banner (Hallmark Job-Driven) */}
      <div className="p-6 sm:p-8 bg-paper-card border border-rule rounded-card shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Huge PIN for classroom projector */}
        <div className="text-center md:text-left space-y-1">
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">
            PIN para Proyectar a los Estudiantes
          </span>
          <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-widest text-ink select-all">
            {dashboard.sessionPin}
          </div>
          <p className="text-xs text-ink-muted">
            Los estudiantes ingresan en: <strong className="text-ink">http://localhost:3000/exam/join</strong>
          </p>
        </div>

        {/* Center: Sync Block Controller (if in SYNC_BLOCKS mode) */}
        {dashboard.mode === 'SYNC_BLOCKS' && (
          <div className="p-4 bg-paper-muted rounded-card border border-rule text-center space-y-2">
            <span className="text-[11px] font-semibold text-ink-muted uppercase">
              Modo Bloques Sincronizados
            </span>
            <div className="text-lg font-bold text-ink">
              Bloque Actual: {dashboard.currentBlock} / 6
            </div>
            {!isFinished && (
              <button
                type="button"
                onClick={handleAdvanceBlock}
                disabled={advancing || dashboard.currentBlock >= 6}
                className="px-3 py-1.5 bg-ink text-paper hover:bg-ink/90 text-xs font-medium rounded-btn inline-flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
              >
                <FastForward className="w-3 h-3 mr-1" />
                <span>Avanzar al Bloque {dashboard.currentBlock + 1}</span>
              </button>
            )}
          </div>
        )}

        {/* Right: Summary Metrics */}
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
            <div className={`text-2xl font-bold ${
              (dashboard.summary.totalInfractions || 0) > 0 ? 'text-danger animate-pulse' : 'text-ink-muted'
            }`}>
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
          <a
            href="#security-incidents-section"
            className="px-3 py-1.5 bg-danger text-white hover:bg-danger/90 rounded-btn text-xs font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
          >
            <span>Ver Informe de Incidentes</span>
          </a>
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
                const isAbsentOrPending = status === 'PENDING' || status === 'ABSENT';

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
                      {attendee.focusLossCount !== undefined && attendee.focusLossCount > 0 && (
                        <span
                          className="ml-2 px-2 py-0.5 bg-danger-soft text-danger font-semibold rounded inline-flex items-center gap-1 border border-danger/20"
                          title="Se detectaron salidas de pantalla o pérdida de foco durante el examen"
                        >
                          <ShieldAlert className="w-3 h-3 text-danger" />
                          <span>{attendee.focusLossCount} {attendee.focusLossCount === 1 ? 'salida' : 'salidas'}</span>
                        </span>
                      )}
                      {status === 'PENDING' && (
                        <span className="px-2 py-0.5 bg-warning-soft text-warning font-semibold rounded">
                          Pendiente (No ha ingresado)
                        </span>
                      )}
                      {status === 'ABSENT' && (
                        <span className="px-2 py-0.5 bg-danger-soft text-danger font-semibold rounded">
                          No Presentó (N/P)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-ink">
                      {attendee.totalScore !== null && attendee.totalScore !== undefined
                        ? `${Number(attendee.totalScore).toFixed(1)} / 5.0`
                        : '---'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {/* One-Click Direct WhatsApp Button for Absentees */}
                      {isAbsentOrPending && attendee.whatsappLink ? (
                        <a
                          href={attendee.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-1 bg-success text-paper-card hover:bg-success/90 font-medium rounded-btn text-xs shadow-xs"
                          title="Enviar alerta automática de inicio de examen a WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Notificar por WhatsApp</span>
                          <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                      ) : (
                        <span className="text-ink-muted/50 text-[11px] italic">
                          {status === 'COMPLETED' ? 'Examen entregado' : 'Sin teléfono'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Incidents & Anti-Fraud Audit Section */}
      <div id="security-incidents-section" className="bg-paper-card border border-rule rounded-card overflow-hidden shadow-xs space-y-3">
        <div className="p-4 border-b border-rule flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-danger" />
            <h2 className="text-sm font-bold text-ink">
              Informe de Auditoría de Seguridad & Salidas de Pantalla (Tiempo Real)
            </h2>
          </div>
          <span className="text-xs text-ink-muted">
            Monitoreo en vivo de cambios de pestaña, IA y aplicaciones
          </span>
        </div>

        {(!dashboard.securityIncidents || dashboard.securityIncidents.length === 0) ? (
          <div className="p-8 text-center text-ink-muted space-y-1">
            <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-ink">
              Sin incidencias de seguridad registradas
            </p>
            <p className="text-[11px] text-ink-muted">
              Todos los estudiantes permanecen enfocados en la pantalla de su evaluación sin anomalías.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rule bg-paper-muted text-ink-muted font-semibold">
                  <th className="py-2.5 px-4">Hora</th>
                  <th className="py-2.5 px-4">Estudiante</th>
                  <th className="py-2.5 px-4">Tipo Infracción</th>
                  <th className="py-2.5 px-4">Detalle del Evento</th>
                  <th className="py-2.5 px-4">Reincidencia</th>
                  <th className="py-2.5 px-4 text-right">Acción Docente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-medium">
                {dashboard.securityIncidents.map((incident) => {
                  const attendee = dashboard.attendees.find((a) => a.studentId === incident.studentId);
                  const formattedTime = new Date(incident.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={incident.id} className="hover:bg-paper-muted/40">
                      <td className="py-2.5 px-4 font-mono text-ink-muted whitespace-nowrap">
                        {formattedTime}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-ink block">{incident.studentName}</span>
                        <span className="text-[10px] text-ink-muted font-mono">{incident.studentCode}</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {incident.incidentType === 'TAB_SWITCH' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold rounded text-[10px] uppercase">
                            Cambio de Pestaña
                          </span>
                        )}
                        {incident.incidentType === 'AI_POPUP_OR_WINDOW_BLUR' && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold rounded text-[10px] uppercase">
                            Ventana Externa / IA
                          </span>
                        )}
                        {incident.incidentType === 'MOBILE_APP_SWITCH' && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 font-bold rounded text-[10px] uppercase">
                            Cambio App Móvil
                          </span>
                        )}
                        {incident.incidentType === 'DEVTOOLS_INSPECT' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold rounded text-[10px] uppercase">
                            Intento Inspección
                          </span>
                        )}
                        {!['TAB_SWITCH', 'AI_POPUP_OR_WINDOW_BLUR', 'MOBILE_APP_SWITCH', 'DEVTOOLS_INSPECT'].includes(incident.incidentType) && (
                          <span className="px-2 py-0.5 bg-danger-soft text-danger font-bold rounded text-[10px] uppercase">
                            {incident.incidentType}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-ink-muted max-w-xs truncate" title={incident.details}>
                        {incident.details}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-danger">
                        #{incident.incidentNumber}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {attendee?.phoneNumber ? (
                          <a
                            href={`https://wa.me/${attendee.phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hola ${incident.studentName}, el sistema de evaluación ha registrado una infracción de seguridad durante tu examen (${incident.details}). Por favor regresa a la evaluación de inmediato.`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-0.5 bg-danger-soft text-danger hover:bg-danger hover:text-white font-bold rounded text-[11px] transition-colors"
                            title="Llamar la atención por WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            <span>Advertir por WhatsApp</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-ink-muted italic">Sin teléfono</span>
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
      </div>
    </RoleGuard>
  );
}
