'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  GraduationCap,
  User,
  Phone,
  Hash,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();

  // Registration form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanPwd = password.trim();
    const cleanConfirmPwd = confirmPassword.trim();

    if (!cleanFirstName || !cleanLastName) {
      setError('Por favor ingresa tus nombres y apellidos completos.');
      return;
    }
    if (!cleanEmail) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!cleanPwd || cleanPwd.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (cleanPwd !== cleanConfirmPwd) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    try {
      setLoading(true);
      // Notice: studentCode is omitted from payload so the backend auto-generates it!
      const res = await api.studentRegister({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        password: cleanPwd,
        phoneNumber: cleanPhone || undefined,
      });

      setSuccess('¡Cuenta de estudiante creada con éxito! Ingresando al portal de exámenes...');

      // Save authentication session
      localStorage.setItem('cambridge_token', res.token);
      localStorage.setItem('cambridge_user', JSON.stringify(res.user));

      // Immediately redirect to student portal
      setTimeout(() => {
        router.push('/student');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar estudiante. Verifica los datos ingresados.');
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
      <main className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center">
        {/* Masthead Header */}
        <header className="text-center space-y-2.5 mb-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/95 border border-white/20 backdrop-blur-md shadow-xs">
            <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
            <span>Inscripción Oficial de Estudiantes</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
            Cambridge Academy
          </h1>

          <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto leading-relaxed">
            Crea tu perfil institucional para presentar exámenes y acceder a tus resultados
          </p>
        </header>

        {/* Registration Card */}
        <div className="w-full bg-white border border-rule rounded-card shadow-2xl p-6 sm:p-8 space-y-5">
          {/* Informational Banner */}
          <div className="p-3 bg-accent-soft/50 border border-accent/20 rounded-btn text-xs text-ink space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-accent">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Registro para Evaluaciones Oficiales</span>
            </div>
            <p className="text-ink-muted text-[11px] leading-relaxed">
              Diligencia tus datos personales. Al registrarte podrás ingresar tu PIN de clase y recibir seguimiento de tus pruebas.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-btn">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-btn flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Names row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="regFirstName" className="text-xs font-semibold text-ink block">
                  Nombres *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="regFirstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ej. Camila"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="regLastName" className="text-xs font-semibold text-ink block">
                  Apellidos *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="regLastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="ej. Morales"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="regEmail" className="text-xs font-semibold text-ink block">
                Correo Electrónico *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="regEmail"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. camila.morales@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                  required
                />
              </div>
            </div>

            {/* Phone & Institutional Code row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="regPhone" className="text-xs font-semibold text-ink block">
                  Celular / WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="regPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 312 987 6543"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                  />
                </div>
                <p className="text-[10px] text-ink-muted">
                  Para alertas automáticas de asistencia
                </p>
              </div>

              {/* Institutional Code: READONLY / NON-EDITABLE */}
              <div className="space-y-1">
                <label
                  htmlFor="regStudentCode"
                  className="text-xs font-semibold text-ink flex items-center justify-between"
                >
                  <span>Código Institucional</span>
                  <span className="text-[10px] text-accent font-medium inline-flex items-center space-x-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Automático</span>
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted/60">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    id="regStudentCode"
                    type="text"
                    readOnly
                    disabled
                    value="Asignado automáticamente"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-paper-muted border border-rule rounded-btn text-ink-muted select-none cursor-not-allowed font-mono opacity-80"
                  />
                </div>
                <p className="text-[10px] text-ink-muted">
                  El sistema te asignará tu código único (ej. EST-2026-XXXX)
                </p>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="regPassword" className="text-xs font-semibold text-ink block">
                  Contraseña *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="regPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
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

              <div className="space-y-1">
                <label htmlFor="regConfirmPassword" className="text-xs font-semibold text-ink block">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="regConfirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink cursor-pointer"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Registration Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover active:scale-[0.99] text-white font-medium text-sm rounded-btn transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta de estudiante...</span>
                </>
              ) : (
                <>
                  <span>Crear cuenta e iniciar evaluación</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link back to Login */}
          <div className="pt-3 border-t border-rule text-center space-y-1.5">
            <p className="text-xs text-ink-muted">
              ¿Ya tienes una cuenta registrada en la academia?
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-accent hover:text-accent-hover hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver e iniciar sesión</span>
            </Link>
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
