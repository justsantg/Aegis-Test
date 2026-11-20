'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, AuthUser } from '../../../lib/api';
import { ArrowLeft, KeyRound, Loader2, User, LogOut } from 'lucide-react';

export default function JoinExamPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [studentId, setStudentId] = useState('3'); // Default test student ID in DB
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cambridge_user');
      if (stored) {
        const u: AuthUser = JSON.parse(stored);
        setCurrentUser(u);
        if (u.id) {
          setStudentId(String(u.id));
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cambridge_token');
    localStorage.removeItem('cambridge_user');
    router.push('/');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim();
    if (cleanPin.length < 7) {
      setError('Por favor ingresa un PIN válido de 6 dígitos (ej. 136-934)');
      return;
    }

    const sIdNum = parseInt(studentId, 10);
    if (isNaN(sIdNum) || sIdNum <= 0) {
      setError('Ingresa un ID de estudiante válido');
      return;
    }

    try {
      setLoading(true);
      const sessionData = await api.joinSession({
        sessionPin: cleanPin,
        studentId: sIdNum,
      });

      // Save in session storage for the exam runner
      sessionStorage.setItem('active_exam_session', JSON.stringify({
        ...sessionData,
        studentId: sIdNum,
      }));

      router.push(`/exam/${sessionData.sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la sesión');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex items-center space-x-2 text-xs text-ink-muted">
            <span className="font-medium text-ink truncate max-w-[150px]">
              {currentUser.firstName ? `${currentUser.firstName} (${currentUser.role.name})` : currentUser.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-danger hover:underline inline-flex items-center space-x-0.5 cursor-pointer ml-1"
              title="Cerrar sesión"
            >
              <LogOut className="w-3 h-3" />
              <span>Salir</span>
            </button>
          </div>
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
            Digita el PIN que el docente proyectó en el aula
          </p>
        </div>

        {error && (
          <div className="p-3 bg-danger-soft border border-danger/20 rounded-btn text-xs text-danger font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Input */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              PIN de la clase
            </label>
            <input
              type="text"
              value={pin}
              onChange={handlePinChange}
              placeholder="000-000"
              maxLength={7}
              autoFocus
              className="w-full text-center text-2xl font-mono tracking-widest p-3 rounded-card border border-rule hover:border-rule-strong bg-paper-card text-ink focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Student ID / Code */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              ID del Estudiante
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                <User className="w-4 h-4" />
              </span>
              <input
                type="number"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Ej. 3"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-card border border-rule hover:border-rule-strong bg-paper-card text-ink focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              (Estudiante de prueba inicial: ID 3 - Student Cambridge)
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-accent text-accent-ink hover:bg-accent-hover font-medium text-sm rounded-btn flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando PIN...</span>
                </>
              ) : (
                <span>Comenzar Evaluación</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
