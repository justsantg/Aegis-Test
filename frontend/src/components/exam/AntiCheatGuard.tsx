'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ShieldAlert, Clock, AlertTriangle, EyeOff, Lock } from 'lucide-react';
import { api } from '../../lib/api';

interface AntiCheatGuardProps {
  isActive?: boolean;
  sessionId?: string;
  studentId?: number;
  timeLeftSeconds?: number;
  formatTime?: (seconds: number) => string;
  onInfraction?: (count: number) => void;
}

export const AntiCheatGuard: React.FC<AntiCheatGuardProps> = ({
  isActive = true,
  sessionId,
  studentId,
  timeLeftSeconds = 0,
  formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`,
  onInfraction,
}) => {
  const [warningsCount, setWarningsCount] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [lockoutReason, setLockoutReason] = useState<string>('');
  const [hasWindowFocus, setHasWindowFocus] = useState<boolean>(true);

  const lastTriggerRef = useRef<number>(0);

  const triggerLockout = useCallback((reason: string, incidentType: string = 'FOCUS_LOSS') => {
    if (!isActive) return;

    // Throttle triggers within 800ms to avoid double firing on blur + visibilitychange
    const now = Date.now();
    if (now - lastTriggerRef.current < 800) return;
    lastTriggerRef.current = now;

    setLockoutReason(reason);
    setIsLockedOut(true);
    setHasWindowFocus(false);

    setWarningsCount((prev) => {
      const next = prev + 1;
      if (onInfraction) onInfraction(next);

      // Report to backend with incident type and details for the teacher
      if (sessionId && studentId) {
        api.recordInfraction(sessionId, studentId, {
          incidentType,
          details: reason,
        }).catch(() => {
          // Silent catch for network hiccups during blur
        });
      }
      return next;
    });
  }, [isActive, sessionId, studentId, onInfraction]);

  useEffect(() => {
    if (!isActive) return;

    // 1. Detect tab change, minimizing or backgrounding
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState !== 'visible') {
        triggerLockout('Cambio de pestaña o aplicación minimizada', 'TAB_SWITCH');
      } else {
        setHasWindowFocus(document.hasFocus());
      }
    };

    // 2. Detect window blur (switching apps, opening AI sidebars, DevTools, or system popups)
    const handleWindowBlur = () => {
      triggerLockout(
        'Pérdida de foco (otra aplicación, popup de IA o ventana externa abierta)',
        'AI_POPUP_OR_WINDOW_BLUR',
      );
    };

    // 3. Detect window focus return
    const handleWindowFocus = () => {
      setHasWindowFocus(true);
    };

    // 4. Detect mobile app switching or page hide
    const handlePageHide = () => {
      triggerLockout('Cambio de aplicación en dispositivo móvil', 'MOBILE_APP_SWITCH');
    };

    // 5. Block right click context menu to prevent inspect / AI extensions
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 6. Block inspect shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        triggerLockout(
          'Intento de inspección de elementos o herramientas del navegador',
          'DEVTOOLS_INSPECT',
        );
        return false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, triggerLockout]);

  const handleResume = () => {
    setIsLockedOut(false);
  };

  if (!isLockedOut) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="lockout-title"
      className="fixed inset-0 z-[99999] bg-[#07080b]/98 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 text-center select-none"
    >
      <div className="max-w-md w-full bg-[#111318] border-2 border-danger/60 rounded-card p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Security Shield Icon */}
        <div className="flex justify-center">
          <div className="relative p-3.5 bg-danger/10 border border-danger/40 rounded-full inline-flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-danger animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              !
            </span>
          </div>
        </div>

        {/* Lockout Header */}
        <div className="space-y-1.5">
          <span className="px-2.5 py-0.5 bg-danger/20 text-danger font-mono font-bold text-[11px] rounded-full uppercase tracking-wider inline-block">
            Infracción de Seguridad #{warningsCount}
          </span>
          <h2
            id="lockout-title"
            className="text-lg sm:text-xl font-extrabold text-white tracking-tight"
          >
            PANTALLA BLOQUEADA
          </h2>
          <p className="text-xs font-semibold text-danger/90">
            {lockoutReason || 'Pérdida de foco de la evaluación detectada'}
          </p>
        </div>

        {/* Live Running Timer Box (Time keeps running down!) */}
        <div className="p-4 bg-black/40 border border-danger/40 rounded-btn space-y-1 shadow-inner">
          <div className="flex items-center justify-center gap-1.5 text-danger text-[11px] font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Tu tiempo continúa corriendo sin pausa:</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-widest drop-shadow-md">
            {formatTime(timeLeftSeconds)}
          </div>
          <p className="text-[10px] text-zinc-400">
            Cada segundo transcurrido fuera de la prueba se descuenta de tu tiempo final.
          </p>
        </div>

        {/* Warning Policy Text */}
        <p className="text-xs text-zinc-300 leading-relaxed text-left bg-zinc-900/60 p-3 rounded-btn border border-zinc-800">
          <strong className="text-white block mb-0.5">Política de Examen Seguro:</strong>
          No está permitido cambiar de pestaña, minimizar el navegador, alternar aplicaciones en móviles ni desplegar ventanas emergentes o asistentes de IA durante la prueba. Esta incidencia ha sido registrada en el panel del docente.
        </p>

        {/* Resume Button */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleResume}
            className="w-full py-3 px-5 bg-danger text-white hover:bg-danger/90 active:scale-98 rounded-btn text-xs sm:text-sm font-bold shadow-lg transition-[background-color,transform] cursor-pointer flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-[#111318]"
          >
            <Lock className="w-4 h-4" />
            <span>Entiendo la Infracción — Reanudar Evaluación</span>
          </button>
          {!hasWindowFocus && (
            <p className="text-[11px] text-amber-400 animate-pulse">
              * Toca o haz clic sobre la ventana para recuperar el foco
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
