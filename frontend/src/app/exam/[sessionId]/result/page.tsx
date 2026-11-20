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

  useEffect(() => {
    const stored = sessionStorage.getItem('exam_result');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);

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
        return;
      } catch {
        // ignore
      }
    }
  }, [router]);

  const handleFinish = () => {
    sessionStorage.removeItem('active_exam_session');
    sessionStorage.removeItem('exam_result');
    router.push('/');
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
