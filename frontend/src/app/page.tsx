'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
} from 'lucide-react';
import { api } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to the user's role portal
  useEffect(() => {
    try {
      const token = localStorage.getItem('cambridge_token');
      const userRaw = localStorage.getItem('cambridge_user');
      if (token && userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.role?.id === 1) {
          router.replace('/admin');
        } else if (u?.role?.id === 2) {
          router.replace('/teacher');
        } else if (u?.role?.id === 3) {
          router.replace('/exam/join');
        }
      }
    } catch {}
  }, [router]);

  // Quick Demo credentials
  const selectDemoRole = (role: 'admin' | 'teacher' | 'student') => {
    setError(null);
    if (role === 'admin') {
      setEmail('admin@example.com');
      setPassword('secret');
    } else if (role === 'teacher') {
      setEmail('teacher@example.com');
      setPassword('secret');
    } else {
      setEmail('student@example.com');
      setPassword('secret');
    }
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({
        email: cleanEmail,
        password: cleanPassword,
      });

      // Save token and user in localStorage
      localStorage.setItem('cambridge_token', res.token);
      localStorage.setItem('cambridge_user', JSON.stringify(res.user));

      // Role-based routing:
      // role.id: 1 = Admin, 2 = Teacher, 3 = Student
      if (res.user.role.id === 1) {
        router.push('/admin');
      } else if (res.user.role.id === 2) {
        router.push('/teacher');
      } else if (res.user.role.id === 3) {
        router.push('/exam/join');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 py-10 bg-slate-950 selection:bg-accent selection:text-white">
      {/* Full-bleed atmospheric background: Peabody Library with dark academic scrim */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <img
          src="/library-hero.jpg"
          alt="Cambridge Peabody Library"
          className="w-full h-full object-cover object-center filter brightness-[0.38] saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px]" />
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
        {/* Masthead Header */}
        <header className="text-center space-y-2.5 mb-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/95 border border-white/20 backdrop-blur-md shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            <span>Sistema Oficial de Evaluaciones</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
            Cambridge Academy
          </h1>

          <p className="text-xs sm:text-sm text-white/80 max-w-sm mx-auto leading-relaxed">
            Acceso universal para Docentes, Estudiantes y Administradores
          </p>
        </header>

        {/* Login Card */}
        <div className="w-full bg-white border border-rule rounded-card shadow-2xl p-6 sm:p-8 space-y-5">
          {/* Quick Demo Credentials Bar */}
          <div className="space-y-2 pb-3.5 border-b border-rule">
            <span className="block text-xs font-semibold text-ink">
              Acceso rápido de prueba (Demo):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectDemoRole('teacher')}
                className="py-1.5 px-2 text-xs font-medium bg-paper-muted hover:bg-accent-soft hover:text-accent border border-rule hover:border-accent rounded-btn transition-colors text-center text-ink cursor-pointer"
              >
                Docente
              </button>
              <button
                type="button"
                onClick={() => selectDemoRole('student')}
                className="py-1.5 px-2 text-xs font-medium bg-paper-muted hover:bg-accent-soft hover:text-accent border border-rule hover:border-accent rounded-btn transition-colors text-center text-ink cursor-pointer"
              >
                Estudiante
              </button>
              <button
                type="button"
                onClick={() => selectDemoRole('admin')}
                className="py-1.5 px-2 text-xs font-medium bg-paper-muted hover:bg-accent-soft hover:text-accent border border-rule hover:border-accent rounded-btn transition-colors text-center text-ink cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-btn">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-ink block"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. docente@cambridge.edu.co"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-ink block"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover active:scale-[0.99] text-white font-medium text-sm rounded-btn transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a la plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Distinct Student Registration Navigation */}
          <div className="pt-3 border-t border-rule space-y-3 text-center">
            <div className="space-y-1">
              <p className="text-xs text-ink-muted">
                ¿Eres estudiante nuevo y no tienes una cuenta?
              </p>
              <Link
                href="/register"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-accent hover:text-accent-hover hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crear cuenta de estudiante</span>
              </Link>
            </div>

            {/* Direct PIN Join Option */}
            <div className="pt-2 border-t border-rule/60 space-y-1">
              <p className="text-xs text-ink-muted">
                ¿Tienes un PIN de examen suministrado por tu profesor?
              </p>
              <Link
                href="/exam/join"
                className="inline-flex items-center space-x-1.5 text-xs font-medium text-ink-muted hover:text-accent hover:underline cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ingresar directamente con PIN de clase</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs text-white/75">
          <p>Cambridge Academy © 2026 · Evaluaciones de Gramática, Vocabulario y Sintaxis</p>
        </footer>
      </main>
    </div>
  );
}
