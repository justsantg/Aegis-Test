'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { CheckCircle2, Award, Home } from 'lucide-react';
import { SubmitResultResponse } from '../../../../lib/api';

export default function ExamResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<SubmitResultResponse | null>(null);
  const [sessionMeta, setSessionMeta] = useState<{
    studentName?: string;
    studentCode?: string;
    courseName?: string;
    examTitle?: string;
  } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('exam_result');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);
      } catch {
        // ignore
      }
    }

    const sessionStored = sessionStorage.getItem('active_exam_session');
    if (sessionStored) {
      try {
        const s = JSON.parse(sessionStored);
        setSessionMeta({
          studentName: s.studentName || s.student?.fullName,
          studentCode: s.studentCode || s.student?.studentCode,
          courseName: s.courseName,
          examTitle: s.examTitle,
        });
      } catch {
        // ignore
      }
    }

    // Fire festive celebration confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore if canvas not supported
    }
  }, [router]);

  const handleFinish = () => {
    sessionStorage.removeItem('active_exam_session');
    sessionStorage.removeItem('exam_result');
    router.push('/student');
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-md mx-auto w-full">
      <div className="w-full bg-paper-card border border-rule rounded-card p-6 sm:p-8 shadow-xs text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-success-soft text-success mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-ink">
            ¡Evaluación Completada!
          </h1>
          <p className="text-xs text-ink-muted">
            Tus respuestas han sido recibidas y calificadas por el sistema
          </p>
        </div>

        {/* Student and Exam Meta */}
        {sessionMeta && (sessionMeta.studentName || sessionMeta.courseName) && (
          <div className="p-3 bg-paper-muted/80 rounded-btn border border-rule text-xs space-y-1">
            {sessionMeta.studentName && (
              <div className="font-bold text-ink">
                {sessionMeta.studentName}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 text-ink-muted text-[11px]">
              {sessionMeta.studentCode && (
                <span className="font-mono font-bold text-accent">
                  {sessionMeta.studentCode}
                </span>
              )}
              {sessionMeta.courseName && (
                <span>· {sessionMeta.courseName}</span>
              )}
              {sessionMeta.examTitle && (
                <span>· {sessionMeta.examTitle}</span>
              )}
            </div>
          </div>
        )}

        {/* Score Card */}
        <div className="p-5 bg-paper-muted rounded-card border border-rule space-y-2">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-accent">
            <Award className="w-4 h-4" />
            <span>Calificación Final Obtenida</span>
          </div>

          <div className="text-4xl font-extrabold text-ink tracking-tight">
            {result?.totalScore !== undefined
              ? Number(result.totalScore).toFixed(1)
              : '---'}
          </div>

          <p className="text-xs text-ink-muted">
            Preguntas evaluadas: {result?.totalQuestionsEvaluated ?? 0}
          </p>
        </div>

        {/* Return Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-3 px-4 bg-ink text-paper hover:bg-ink/90 font-medium text-sm rounded-btn inline-flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home className="w-4 h-4 mr-1.5" />
            <span>Finalizar y Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
