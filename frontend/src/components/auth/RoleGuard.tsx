'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthUser } from '../../lib/api';
import EchoText from '../ui/EchoText';
import {
  ShieldAlert,
  ArrowRight,
  LogOut,
  GraduationCap,
  School,
  Loader2,
  Lock,
} from 'lucide-react';

export interface RoleGuardProps {
  allowedRoleIds: number[];
  sectionName?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoleIds,
  sectionName = 'esta sección restringida',
  children,
}) => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('cambridge_token');
      const userRaw = localStorage.getItem('cambridge_user');

      if (!token || !userRaw) {
        setIsAuthorized(false);
        setUser(null);
        setChecking(false);
        return;
      }

      const parsedUser: AuthUser = JSON.parse(userRaw);
      setUser(parsedUser);

      if (parsedUser?.role?.id && allowedRoleIds.includes(parsedUser.role.id)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch {
      setIsAuthorized(false);
      setUser(null);
    } finally {
      setChecking(false);
    }
  }, [allowedRoleIds]);

  const handleSwitchAccount = () => {
    localStorage.removeItem('cambridge_token');
    localStorage.removeItem('cambridge_user');
    router.push('/');
  };

  if (checking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <p className="text-xs text-ink-muted">Verificando permisos de acceso...</p>
      </div>
    );
  }

  // If user does not have permission, show the Hallmark Forbidden Screen with EchoText
  if (!isAuthorized) {
    const userRoleName = user?.role?.name || 'Estudiante';
    const isStudent = user?.role?.id === 3;
    const isTeacher = user?.role?.id === 2;

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 max-w-xl mx-auto w-full text-center">
        {/* Security Crest Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-semibold text-danger mb-6 shadow-xs">
          <Lock className="w-3.5 h-3.5" />
          <span>Control de Acceso y Seguridad Académica</span>
        </div>

        {/* EchoText Visual Security Heading */}
        <div className="mb-6 flex justify-center w-full overflow-hidden py-4">
          <EchoText
            text="ACCESO DENEGADO"
            echoes={10}
            lag={0.22}
            offset={24}
            direction="down"
            fade={0.65}
            blur={2.5}
            tint="#dc2626"
            echoStyle="solid"
            fontSize="clamp(2rem, 6vw, 3.5rem)"
            fontWeight={900}
            color="#991b1b"
            clickBurst
          />
        </div>

        {/* Editorial Notice Card */}
        <div className="w-full bg-paper-card border border-rule rounded-card p-6 sm:p-8 shadow-xs space-y-5 text-left">
          <div className="flex items-start space-x-3 pb-4 border-b border-rule">
            <div className="w-10 h-10 rounded-full bg-red-100 text-danger flex items-center justify-center shrink-0 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">
                Privilegios Insuficientes para {sectionName}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {user ? (
                  <>
                    Has iniciado sesión como <strong className="text-ink">{user.firstName || user.email}</strong> con rol de <strong className="text-danger">{userRoleName}</strong>.
                  </>
                ) : (
                  'No se ha detectado una sesión activa con permisos para este portal.'
                )}
              </p>
            </div>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            Esta sección contiene controles administrativos y auditoría oficial de la academia. Tu cuenta actual no cuenta con credenciales para gestionar o visualizar estos recursos.
          </p>

          {/* Contextual Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {isStudent && (
              <Link
                href="/exam/join"
                className="py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-btn transition-colors inline-flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Ir a mi Sala de Examen (/exam/join)</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            )}

            {isTeacher && (
              <Link
                href="/teacher"
                className="py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-btn transition-colors inline-flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <School className="w-4 h-4" />
                <span>Ir a mi Panel Docente (/teacher)</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            )}

            {!user && (
              <Link
                href="/"
                className="py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-btn transition-colors inline-flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            )}

            <button
              type="button"
              onClick={handleSwitchAccount}
              className="py-2.5 px-3.5 bg-paper border border-rule hover:border-danger hover:text-danger text-ink text-xs font-medium rounded-btn transition-colors inline-flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cambiar de Cuenta</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-ink-muted/70 mt-6">
          Cambridge Academy © 2026 · Sistema Oficial de Evaluaciones
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
