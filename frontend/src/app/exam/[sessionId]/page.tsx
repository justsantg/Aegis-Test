'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, Question, SessionJoinResponse } from '../../../lib/api';
import { IcfesQuestion } from '../../../components/exam/IcfesQuestion';
import { SentenceScrambleQuestion } from '../../../components/exam/SentenceScrambleQuestion';
import { ClozeDropdownQuestion } from '../../../components/exam/ClozeDropdownQuestion';
import { SentenceCompletionQuestion } from '../../../components/exam/SentenceCompletionQuestion';
import { AntiCheatGuard } from '../../../components/exam/AntiCheatGuard';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Send,
  Loader2,
  Clock,
  Tv,
  CheckCheck,
} from 'lucide-react';

export default function ExamRunnerPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [sessionData, setSessionData] = useState<(SessionJoinResponse & { studentId: number }) | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0); // for FREE_PACE
  const [blockCurrentIndex, setBlockCurrentIndex] = useState(0); // for SYNC_BLOCKS
  const [activeBlock, setActiveBlock] = useState<number>(1);
  const [blockSubmitted, setBlockSubmitted] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);

  useEffect(() => {
    // Load stored session from sessionStorage
    const stored = sessionStorage.getItem('active_exam_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.sessionId === sessionId) {
          setSessionData(parsed);
          if (parsed.currentBlock) {
            setActiveBlock(parsed.currentBlock);
          }
          return;
        }
      } catch {
        // ignore
      }
    }
    // If not found or mismatch, go back to join
    router.replace('/exam/join');
  }, [sessionId, router]);

  // Initial sync with remote session mode and currentBlock
  useEffect(() => {
    if (!sessionId) return;
    api
      .getSession(sessionId)
      .then((rem) => {
        if (rem) {
          if (typeof rem.currentBlock === 'number') {
            setActiveBlock(rem.currentBlock);
          }
          setSessionData((prev) =>
            prev
              ? {
                  ...prev,
                  mode: rem.mode || prev.mode,
                  currentBlock: rem.currentBlock || prev.currentBlock,
                }
              : prev,
          );
        }
      })
      .catch(() => {});
  }, [sessionId]);

  const isSyncMode = sessionData?.mode === 'SYNC_BLOCKS';
  const questions: Question[] = sessionData?.questions || [];
  const totalQuestions = questions.length;
  const BLOCK_SIZE = 5;
  const totalBlocks = Math.max(1, Math.ceil(totalQuestions / BLOCK_SIZE));

  // Sync mode questions for the active block
  const currentBlockQuestions = useMemo(() => {
    if (!isSyncMode || totalQuestions === 0) return [];
    const start = (activeBlock - 1) * BLOCK_SIZE;
    const end = Math.min(start + BLOCK_SIZE, totalQuestions);
    return questions.slice(start, end);
  }, [isSyncMode, activeBlock, questions, totalQuestions]);

  // Polling for SYNC_BLOCKS advances or completion
  useEffect(() => {
    if (!isSyncMode || !sessionData) return;

    const interval = setInterval(async () => {
      try {
        const rem = await api.getSession(sessionId);
        if (rem) {
          if (rem.status === 'FINISHED') {
            clearInterval(interval);
            handleSubmitExam();
            return;
          }

          if (
            typeof rem.currentBlock === 'number' &&
            rem.currentBlock > activeBlock
          ) {
            setActiveBlock(rem.currentBlock);
            setBlockSubmitted(false);
            setBlockCurrentIndex(0);
          }
        }
      } catch {
        // Ignore network hiccups during live polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isSyncMode, sessionData, sessionId, activeBlock]);

  // Exam countdown timer (persists across refreshes)
  useEffect(() => {
    if (!sessionData) return;

    const durationMin = sessionData.durationMinutes || 45;
    const storageKey = `exam_end_time_${sessionId}`;
    let endTimestamp = Number(sessionStorage.getItem(storageKey));

    if (!endTimestamp || isNaN(endTimestamp)) {
      endTimestamp = Date.now() + durationMin * 60 * 1000;
      sessionStorage.setItem(storageKey, endTimestamp.toString());
    }

    const calcRemaining = () => {
      const remainingMs = endTimestamp - Date.now();
      return Math.max(0, Math.floor(remainingMs / 1000));
    };

    setTimeLeftSeconds(calcRemaining());

    const timer = setInterval(() => {
      const remaining = calcRemaining();
      setTimeLeftSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmitExam();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionData, sessionId]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!sessionData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-ink-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando examen...</span>
      </div>
    );
  }

  const currentQuestion = isSyncMode
    ? currentBlockQuestions[blockCurrentIndex]
    : questions[currentIndex];

  const handleAnswerChange = (questionId: string, response: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };

  const isAnswered = (val: any) => {
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (typeof val === 'object' && Object.keys(val).length === 0) return false;
    return true;
  };

  const answeredCount = Object.keys(answers).filter((k) => isAnswered(answers[k])).length;
  const blockAnsweredCount = currentBlockQuestions.filter((q) => isAnswered(answers[q.id])).length;

  const handleNext = () => {
    if (isSyncMode) {
      if (blockCurrentIndex < currentBlockQuestions.length - 1) {
        setBlockCurrentIndex((prev) => prev + 1);
      }
    } else {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    if (isSyncMode) {
      if (blockCurrentIndex > 0) {
        setBlockCurrentIndex((prev) => prev - 1);
      }
    } else {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  };

  const handleSaveBlockAnswers = async () => {
    if (!sessionData) return;
    setSavingBlock(true);
    setError(null);

    const blockAnswersPayload = currentBlockQuestions.map((q) => ({
      questionId: q.id,
      response: answers[q.id] ?? null,
    }));

    try {
      await api.saveBlockAnswers(sessionId, {
        studentId: sessionData.studentId,
        answers: blockAnswersPayload,
      });
      setBlockSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error al guardar las respuestas del bloque');
    } finally {
      setSavingBlock(false);
    }
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    setError(null);

    const answersPayload = Object.entries(answers).map(([qId, response]) => ({
      questionId: qId,
      response,
    }));

    try {
      const result = await api.submitExam(sessionId, {
        studentId: sessionData.studentId,
        answers: answersPayload,
      });

      // Store result and navigate to results screen
      sessionStorage.setItem('exam_result', JSON.stringify(result));
      router.push(`/exam/${sessionId}/result`);
    } catch (err: any) {
      setError(err.message || 'Error al enviar el examen');
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-paper">
      {/* Anti-cheat tab/blur/IA blackout guard */}
      <AntiCheatGuard
        isActive={true}
        sessionId={sessionId}
        studentId={sessionData.studentId}
        timeLeftSeconds={timeLeftSeconds}
        formatTime={formatTime}
      />

      {/* Top Bar: Exam Info, Timer & Progress */}
      <header className="sticky top-0 z-30 bg-paper-card border-b border-rule px-4 py-3 sm:px-6">
        <div className="max-w-container mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                {sessionData.courseName}
              </span>
              {isSyncMode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-soft text-accent border border-accent/20">
                  <Tv className="w-3 h-3" />
                  Bloques Sincronizados (Proyector)
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-bold text-ink">
              {sessionData.examTitle}
            </h1>
          </div>

          <div className="flex items-center space-x-3 text-xs text-ink-muted flex-wrap gap-y-2">
            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-btn font-mono text-xs font-bold border transition-colors ${
                timeLeftSeconds < 300
                  ? 'bg-danger-soft text-danger border-danger/40 animate-pulse'
                  : 'bg-paper-muted text-ink border-rule'
              }`}
              title="Tiempo restante para entregar la evaluación"
            >
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            {isSyncMode ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">
                  Bloque {activeBlock} / {totalBlocks}
                </span>
                <span className="text-[11px] text-ink-muted hidden sm:inline">
                  ({blockAnsweredCount} de {currentBlockQuestions.length} resp.)
                </span>
              </div>
            ) : (
              <>
                <span className="font-medium hidden sm:inline">
                  Respondidas: <strong className="text-ink">{answeredCount}</strong> / {totalQuestions}
                </span>
                <div className="w-20 sm:w-24 bg-paper-muted h-2 rounded-full overflow-hidden border border-rule">
                  <div
                    className="bg-accent h-full transition-[width] duration-300"
                    style={{
                      width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </>
            )}

            {isSyncMode ? (
              activeBlock < totalBlocks ? (
                blockSubmitted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-success bg-success-soft rounded-btn border border-success/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Bloque {activeBlock} Listo
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={savingBlock}
                    onClick={handleSaveBlockAnswers}
                    className="px-3 py-1.5 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-semibold rounded-btn cursor-pointer disabled:opacity-50"
                  >
                    {savingBlock ? 'Guardando...' : `Enviar Bloque ${activeBlock}`}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-3 py-1.5 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-semibold rounded-btn cursor-pointer"
                >
                  Enviar Examen
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-3 py-1.5 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-semibold rounded-btn cursor-pointer"
              >
                Enviar Examen
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Runner Area */}
      {isSyncMode && blockSubmitted ? (
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 flex flex-col items-center justify-center">
          <div className="bg-paper-card border border-rule rounded-card p-6 sm:p-8 text-center space-y-5 shadow-xs w-full">
            <div className="w-16 h-16 bg-accent-soft text-accent rounded-full flex items-center justify-center mx-auto">
              <Tv className="w-8 h-8 animate-pulse text-accent" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-soft text-success border border-success/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Respuestas del Bloque {activeBlock} Registradas</span>
              </div>
              <h2 className="text-lg font-bold text-ink">
                Esperando al Docente
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
                Has completado el <strong>Bloque {activeBlock}</strong> ({blockAnsweredCount} de {currentBlockQuestions.length} respondidas).
                Mira la pantalla del aula / proyector mientras el docente verifica las respuestas del grupo y avanza al siguiente bloque.
              </p>
            </div>

            <div className="p-3.5 bg-paper-muted rounded-btn border border-rule flex items-center justify-center gap-2.5 text-xs text-ink font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span>Sincronizando con el proyector de aula...</span>
            </div>

            <div className="pt-2 border-t border-rule">
              <button
                type="button"
                onClick={() => setBlockSubmitted(false)}
                className="text-xs text-ink-muted hover:text-ink underline cursor-pointer"
              >
                Modificar respuestas de este bloque antes de que avance el docente
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col justify-between">
          {error && (
            <div className="mb-4 p-3 bg-danger-soft border border-danger/20 rounded-btn text-xs text-danger font-medium">
              {error}
            </div>
          )}

          {/* Question Header & Points */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-paper-muted text-ink font-semibold rounded-btn text-xs">
                  {isSyncMode ? (
                    <>
                      Pregunta {blockCurrentIndex + 1} de {currentBlockQuestions.length} (Global: #{((activeBlock - 1) * BLOCK_SIZE) + blockCurrentIndex + 1})
                    </>
                  ) : (
                    <>
                      Pregunta {currentIndex + 1} de {totalQuestions}
                    </>
                  )}
                </span>
                {isSyncMode ? (
                  <span className="text-xs text-accent font-semibold bg-accent-soft px-2 py-0.5 rounded">
                    Bloque {activeBlock} de {totalBlocks}
                  </span>
                ) : (
                  currentQuestion?.blockNumber && (
                    <span className="text-xs text-ink-muted">
                      Bloque {currentQuestion.blockNumber}
                    </span>
                  )
                )}
              </div>
              <span className="text-xs font-medium text-accent bg-accent-soft px-2 py-0.5 rounded">
                {currentQuestion?.points} {Number(currentQuestion?.points) === 1 ? 'punto' : 'puntos'}
              </span>
            </div>

            {/* Interactive Question Body */}
            {currentQuestion ? (
              <div className="bg-paper-card border border-rule rounded-card p-5 sm:p-6 shadow-xs">
                {currentQuestion.type === 'ICFES_MULTIPLE_CHOICE' && (
                  <IcfesQuestion
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                )}

                {currentQuestion.type === 'SENTENCE_SCRAMBLE' && (
                  <SentenceScrambleQuestion
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                )}

                {currentQuestion.type === 'FILL_IN_BLANK' && (
                  <ClozeDropdownQuestion
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                )}

                {currentQuestion.type === 'SENTENCE_COMPLETION' && (
                  <SentenceCompletionQuestion
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                )}
              </div>
            ) : (
              <div className="bg-paper-card border border-rule rounded-card p-8 text-center text-ink-muted text-xs">
                No hay preguntas configuradas para este bloque.
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="pt-6 border-t border-rule mt-8 flex items-center justify-between">
            <button
              type="button"
              disabled={isSyncMode ? blockCurrentIndex === 0 : currentIndex === 0}
              onClick={handlePrev}
              className="inline-flex items-center px-4 py-2 border border-rule hover:border-rule-strong rounded-btn text-xs font-medium text-ink bg-paper-card disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Anterior
            </button>

            {/* Question Dots indicator */}
            {isSyncMode ? (
              <div className="flex items-center space-x-1.5">
                {currentBlockQuestions.map((q, idx) => {
                  const hasAnswer = isAnswered(answers[q.id]);
                  const isCurrent = idx === blockCurrentIndex;
                  const globalNum = (activeBlock - 1) * BLOCK_SIZE + idx + 1;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setBlockCurrentIndex(idx)}
                      className={`w-7 h-7 rounded text-[11px] font-semibold flex items-center justify-center cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-accent text-accent-ink ring-2 ring-accent'
                          : hasAnswer
                          ? 'bg-paper-muted text-accent border border-accent/40 font-bold'
                          : 'bg-paper-muted text-ink-muted border border-rule'
                      }`}
                      title={`Pregunta ${globalNum}`}
                    >
                      {globalNum}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-1.5">
                {questions.map((q, idx) => {
                  const hasAnswer = isAnswered(answers[q.id]);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-6 h-6 rounded text-[11px] font-semibold flex items-center justify-center cursor-pointer ${
                        isCurrent
                          ? 'bg-accent text-accent-ink ring-2 ring-accent'
                          : hasAnswer
                          ? 'bg-paper-muted text-accent border border-accent/30'
                          : 'bg-paper-muted text-ink-muted'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            )}

            {isSyncMode ? (
              blockCurrentIndex < currentBlockQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-4 py-2 bg-ink text-paper rounded-btn text-xs font-medium hover:bg-ink/90 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </button>
              ) : activeBlock < totalBlocks ? (
                <button
                  type="button"
                  disabled={savingBlock}
                  onClick={handleSaveBlockAnswers}
                  className="inline-flex items-center px-4 py-2 bg-accent text-accent-ink hover:bg-accent-hover rounded-btn text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingBlock ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      <span>Enviar Bloque {activeBlock}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-accent text-accent-ink hover:bg-accent-hover rounded-btn text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                  <span>Finalizar Examen</span>
                </button>
              )
            ) : currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center px-4 py-2 bg-ink text-paper rounded-btn text-xs font-medium hover:bg-ink/90 cursor-pointer"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center px-4 py-2 bg-accent text-accent-ink hover:bg-accent-hover rounded-btn text-xs font-medium cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>Enviar Examen</span>
              </button>
            )}
          </div>
        </main>
      )}

      {/* Confirmation Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4">
          <div className="bg-paper-card border border-rule rounded-card max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-accent mx-auto" />
              <h3 className="text-base font-bold text-ink">
                ¿Confirmas el envío de tu examen?
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Has respondido <strong className="text-ink">{answeredCount}</strong> de <strong className="text-ink">{totalQuestions}</strong> preguntas. Una vez enviado, se calculará tu nota y no podrás modificar las respuestas.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-3 border border-rule hover:border-rule-strong rounded-btn text-xs font-medium text-ink bg-paper-card"
              >
                Revisar respuestas
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitExam}
                className="flex-1 py-2 px-3 bg-accent text-accent-ink hover:bg-accent-hover rounded-btn text-xs font-medium flex items-center justify-center space-x-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Sí, enviar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
