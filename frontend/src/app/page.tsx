'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Maximize2,
  Minimize2,
  User,
  Phone,
  Hash,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import ScrollExpand from '../components/ui/ScrollExpand';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regStudentCode, setRegStudentCode] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

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
    setIsEmailFocused(true);
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const firstName = regFirstName.trim();
    const lastName = regLastName.trim();
    const studentEmail = regEmail.trim();
    const studentPhone = regPhone.trim();
    const studentCode = regStudentCode.trim();
    const pwd = regPassword.trim();
    const confirmPwd = regConfirmPassword.trim();

    if (!firstName || !lastName) {
      setRegError('Por favor ingresa tus nombres y apellidos completos.');
      return;
    }
    if (!studentEmail) {
      setRegError('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!pwd || pwd.length < 6) {
      setRegError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (pwd !== confirmPwd) {
      setRegError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    try {
      setRegLoading(true);
      const res = await api.studentRegister({
        firstName,
        lastName,
        email: studentEmail,
        password: pwd,
        phoneNumber: studentPhone || undefined,
        studentCode: studentCode || undefined,
      });

      setRegSuccess('¡Cuenta de estudiante creada con éxito! Ingresando al portal...');

      // Save authentication session
      localStorage.setItem('cambridge_token', res.token);
      localStorage.setItem('cambridge_user', JSON.stringify(res.user));

      // Immediately redirect to student exam portal
      setTimeout(() => {
        router.push('/exam/join');
      }, 1000);
    } catch (err: any) {
      setRegError(err.message || 'Error al registrar estudiante. Verifica los datos ingresados.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 overflow-x-hidden selection:bg-accent selection:text-white">
      {/* ScrollExpand Animated Background Component */}
      <ScrollExpand
        src="/library-hero.jpg"
        mediaType="image"
        alt="Cambridge Peabody Academic Library"
        startWidth={48}
        startHeight={64}
        startRadius={24}
        endRadius={0}
        mediaZoom={1.35}
        smoothing={0.14}
        overlayScrim={0.58}
        isExpanded={isEmailFocused}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Main Content Area */}
      <main
        className={`relative z-10 w-full mx-auto flex flex-col items-center transition-[max-width] duration-300 ${
          mode === 'register' ? 'max-w-lg' : 'max-w-md'
        }`}
      >
        {/* Masthead Header */}
        <div className="text-center space-y-2 mb-6">
          <div
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium border shadow-xs transition-colors ${
              isEmailFocused
                ? 'bg-slate-900/90 text-white border-white/20 backdrop-blur-sm'
                : 'bg-white text-ink border-rule shadow-xs'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Sistema Oficial de Evaluaciones</span>
          </div>

          <h1
            className={`text-3xl sm:text-4xl font-bold tracking-tight transition-colors drop-shadow-sm ${
              isEmailFocused ? 'text-white drop-shadow-md' : 'text-ink'
            }`}
          >
            Cambridge Academy
          </h1>

          <p
            className={`text-xs sm:text-sm max-w-sm mx-auto transition-colors ${
              isEmailFocused ? 'text-white/90 drop-shadow' : 'text-ink-muted'
            }`}
          >
            {mode === 'login'
              ? 'Acceso universal para Docentes, Estudiantes y Administradores'
              : 'Registro oficial de estudiantes para presentación de evaluaciones'}
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white border border-rule rounded-card shadow-2xl p-6 sm:p-8 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-paper-muted rounded-btn border border-rule text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setRegError(null);
              }}
              className={`py-2 px-3 rounded-btn transition-colors text-center cursor-pointer flex items-center justify-center space-x-1.5 ${
                mode === 'login'
                  ? 'bg-white text-ink shadow-xs font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setRegError(null);
                setIsEmailFocused(false);
              }}
              className={`py-2 px-3 rounded-btn transition-colors text-center cursor-pointer flex items-center justify-center space-x-1.5 ${
                mode === 'register'
                  ? 'bg-white text-ink shadow-xs font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-accent" />
              <span>Registro Estudiante</span>
            </button>
          </div>

          {mode === 'login' ? (
            <>
              {/* Quick Demo Credentials Bar */}
              <div className="space-y-2 pb-3 border-b border-rule">
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>Acceso rápido de prueba (Demo):</span>
                  <button
                    type="button"
                    onClick={() => setIsEmailFocused(!isEmailFocused)}
                    className="inline-flex items-center space-x-1 text-xs text-accent hover:text-accent-hover hover:underline cursor-pointer font-medium"
                    title="Alternar animación de fondo"
                  >
                    {isEmailFocused ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Contraer fondo</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Expandir fondo</span>
                      </>
                    )}
                  </button>
                </div>
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

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-btn">
                    {error}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-ink flex items-center justify-between"
                  >
                    <span>Correo Electrónico</span>
                    {isEmailFocused && (
                      <span className="text-[11px] text-accent font-medium">
                        Fondo expandido
                      </span>
                    )}
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
                      onFocus={() => setIsEmailFocused(true)}
                      onClick={() => setIsEmailFocused(true)}
                      placeholder="ej. docente@cambridge.edu.co"
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-paper border rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors ${
                        isEmailFocused ? 'border-accent ring-1 ring-accent/30' : 'border-rule'
                      }`}
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

              {/* Toggle to Register */}
              <div className="text-center pt-2">
                <p className="text-xs text-ink-muted">
                  ¿Eres estudiante nuevo y no tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="font-semibold text-accent hover:underline cursor-pointer"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>

              {/* Student Direct Link (Class PIN) */}
              <div className="pt-3 border-t border-rule text-center space-y-1.5">
                <p className="text-xs text-ink-muted">
                  ¿Tienes un PIN de examen suministrado por tu profesor?
                </p>
                <Link
                  href="/exam/join"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-accent hover:text-accent-hover hover:underline cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Ingresar directamente con PIN de clase</span>
                </Link>
              </div>
            </>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-accent-soft/40 border border-accent/20 rounded-btn text-xs text-ink space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-accent">
                  <GraduationCap className="w-4 h-4" />
                  <span>Inscripción de Estudiante</span>
                </div>
                <p className="text-ink-muted text-[11px] leading-relaxed">
                  Crea tu perfil para registrar asistencia, rendir exámenes oficiales y consultar tus calificaciones en tiempo real.
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-btn">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-btn flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {/* Names row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
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
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
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
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ej. camila.morales@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Phone & Student Code row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+57 312 987 6543"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-ink-muted">
                    Para alertas de ausencia del docente
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="regStudentCode" className="text-xs font-semibold text-ink block">
                    Código Institucional
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input
                      id="regStudentCode"
                      type="text"
                      value={regStudentCode}
                      onChange={(e) => setRegStudentCode(e.target.value)}
                      placeholder="Opcional (ej. EST-104)"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-ink-muted">
                    Se generará uno si se deja vacío
                  </p>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-10 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegPassword ? (
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
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      className="w-full pl-9 pr-10 py-2 text-sm bg-paper border border-rule rounded-btn text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegConfirmPassword ? (
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
                disabled={regLoading}
                className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover active:scale-[0.99] text-white font-medium text-sm rounded-btn transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50 mt-2"
              >
                {regLoading ? (
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

              {/* Toggle to Login */}
              <div className="text-center pt-2">
                <p className="text-xs text-ink-muted">
                  ¿Ya tienes una cuenta creada?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setRegError(null);
                    }}
                    className="font-semibold text-accent hover:underline cursor-pointer"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <footer
          className={`mt-6 text-center text-xs transition-colors ${
            isEmailFocused ? 'text-white/80 drop-shadow' : 'text-ink-muted'
          }`}
        >
          <p>Cambridge Academy © 2026 · Evaluaciones de Gramática, Vocabulario y Sintaxis</p>
        </footer>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-paper">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
