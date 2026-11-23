'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, AuthUser } from '../../../lib/api';
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  User,
  LogOut,
  GraduationCap,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function JoinExamPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline login state if student is not logged in
  const [showInlineLogin, setShowInlineLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cambridge_user');
      if (stored) {
        const u: AuthUser = JSON.parse(stored);
        setCurrentUser(u);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cambridge_token');
    localStorage.removeItem('cambridge_user');
    setCurrentUser(null);
  };

  // Format PIN input automatically as XXX-XXX
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    if (raw.length > 3) {
      setPin(`${raw.slice(0, 3)}-${raw.slice(3)}`);
    } else {
      setPin(raw);
    }
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.trim() || !loginPassword) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }

    try {
      setLoginLoading(true);
      const res = await api.login({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      localStorage.setItem('cambridge_token', res.token);
      localStorage.setItem('cambridge_user', JSON.stringify(res.user));
      setCurrentUser(res.user);
      setShowInlineLogin(false);
      setLoginPassword('');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('Debes iniciar sesión con tu cuenta de estudiante para continuar');
      setShowInlineLogin(true);
      return;
    }

    const cleanPin = pin.trim();
    if (cleanPin.length < 7) {
      setError('Por favor ingresa un PIN válido de 6 dígitos proyectado por tu docente (ej. 136-934)');
      return;
    }

    try {
      setLoading(true);
      const sessionData = await api.joinSession({
        sessionPin: cleanPin,
        studentId: currentUser.id,
      });

      const studentFullName =
        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
        currentUser.email;

      // Save in session storage for the exam runner
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
      setError(err.message || 'Error al conectar con la sesión de examen');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (user: AuthUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const studentFullName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email
    : '';

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 max-w-md mx-auto w-full">
      {/* Back button & User status */}
      <div className="w-full mb-6 flex items-center justify-between">
        {currentUser?.role?.id === 1 ? (
          <Link
            href="/admin"
            className="inline-flex items-center text-xs text-accent hover:underline font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Volver al Panel Administrativo
          </Link>
        ) : currentUser?.role?.id === 2 ? (
          <Link
            href="/teacher"
            className="inline-flex items-center text-xs text-accent hover:underline font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Volver al Panel Docente
          </Link>
        ) : currentUser?.role?.id === 3 ? (
          <Link
            href="/student"
            className="inline-flex items-center text-xs text-accent hover:underline font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Volver a Mi Portal de Estudiante
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center text-xs text-ink-muted hover:text-ink font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Volver al inicio
          </Link>
        )}

        {currentUser && (
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-danger/80 hover:text-danger hover:underline inline-flex items-center gap-1 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-3 h-3" />
            <span>Cerrar sesión</span>
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="w-full bg-paper-card border border-rule rounded-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-full bg-accent-soft text-accent mx-auto flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-ink">
            Ingreso a Evaluación
          </h1>
          <p className="text-xs text-ink-muted">
            Digita el PIN proyectado por tu docente en el aula
          </p>
        </div>

        {error && (
          <div className="p-3 bg-danger-soft border border-danger/20 rounded-btn text-xs text-danger font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Authenticated Student Profile Card */}
        {currentUser ? (
          <div className="p-4 bg-paper-muted/70 border border-rule rounded-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-soft text-success text-[10px] font-bold rounded">
                <ShieldCheck className="w-3 h-3" />
                <span>Estudiante Identificado</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[11px] text-ink-muted hover:text-danger underline cursor-pointer"
              >
                ¿No eres tú? Cambiar
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-full bg-accent text-accent-ink font-bold flex items-center justify-center text-xs shrink-0">
                {getInitials(currentUser)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-ink text-sm truncate">
                  {studentFullName}
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="font-mono font-semibold text-accent">
                    {currentUser.studentCode || 'Sin código'}
                  </span>
                  <span>·</span>
                  <span className="truncate">{currentUser.email}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Unauthenticated Prompt */
          <div className="p-4 bg-paper-muted/60 border border-rule rounded-card space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-accent-soft text-accent rounded-full shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-ink">
                  Identifícate para vincular tu calificación
                </h3>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Para registrar tu asistencia y notas oficiales en el sistema, debes ingresar con tu cuenta de estudiante.
                </p>
              </div>
            </div>

            {!showInlineLogin ? (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInlineLogin(true)}
                    className="py-2 px-3 bg-accent text-accent-ink hover:bg-accent-hover font-semibold text-xs rounded-btn text-center cursor-pointer"
                  >
                    Iniciar Sesión
                  </button>
                  <Link
                    href="/register"
                    className="py-2 px-3 bg-paper border border-rule hover:border-rule-strong text-ink font-semibold text-xs rounded-btn text-center cursor-pointer inline-flex items-center justify-center"
                  >
                    Crear Cuenta
                  </Link>
                </div>
              </div>
            ) : (
              /* Inline Login Form */
              <form onSubmit={handleInlineLogin} className="space-y-2.5 pt-2 border-t border-rule">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ink-muted pointer-events-none" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="ej. estudiante@aegis.edu.co"
                      required
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-btn border border-rule bg-paper-card text-ink focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ink-muted pointer-events-none" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-btn border border-rule bg-paper-card text-ink focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="flex-1 py-1.5 px-3 bg-accent text-accent-ink hover:bg-accent-hover font-semibold text-xs rounded-btn inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <span>Identificarme</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInlineLogin(false)}
                    className="py-1.5 px-2.5 text-xs text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* PIN Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5 text-center">
              PIN de la clase (6 dígitos)
            </label>
            <input
              type="text"
              value={pin}
              onChange={handlePinChange}
              placeholder="000-000"
              maxLength={7}
              autoFocus={Boolean(currentUser)}
              className="w-full text-center text-3xl font-mono tracking-widest py-3 px-4 rounded-card border-2 border-rule hover:border-rule-strong bg-paper-card text-ink focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <p className="text-[11px] text-ink-muted text-center mt-1.5">
              Ejemplo: 123-456 (consulta la pantalla o tablero del docente)
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !currentUser}
              className="w-full py-3.5 px-4 bg-accent text-accent-ink hover:bg-accent-hover font-bold text-sm rounded-btn flex items-center justify-center space-x-2 disabled:opacity-50 transition-[background-color] cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando sesión...</span>
                </>
              ) : (
                <>
                  <span>Comenzar Evaluación Oficial</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
