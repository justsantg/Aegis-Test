'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  api,
  Course,
  ExamTemplate,
  Question,
  QuestionOption,
} from '../../lib/api';
import {
  X,
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Clock,
  BookOpen,
  Loader2,
  Sparkles,
  ArrowLeft,
  FileText,
  AlertCircle,
  Check,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

interface CourseExamManagerModalProps {
  course: Course;
  onClose: () => void;
  onExamCreated?: () => void;
}

interface EditableOption {
  content: string;
  isCorrect: boolean;
  correctPosition?: number;
  blankId?: number;
}

interface EditableQuestion {
  id?: string;
  type: 'ICFES_MULTIPLE_CHOICE' | 'SENTENCE_SCRAMBLE' | 'FILL_IN_BLANK' | 'SENTENCE_COMPLETION';
  prompt: string;
  contextText?: string;
  points: number;
  blockNumber: number;
  orderIndex: number;
  options: EditableOption[];
}

export default function CourseExamManagerModal({
  course,
  onClose,
  onExamCreated,
}: CourseExamManagerModalProps) {
  const [view, setView] = useState<'LIST' | 'EDITOR'>('LIST');
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor form state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState<'MIDTERM' | 'FINAL'>('MIDTERM');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Sentence Scramble simulator state
  const [testingScrambleIndex, setTestingScrambleIndex] = useState<number | null>(null);
  const [testChosenIndices, setTestChosenIndices] = useState<number[]>([]);
  const [testBankIndices, setTestBankIndices] = useState<number[]>([]);
  const [scrambleSentences, setScrambleSentences] = useState<Record<number, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTraining =
    course.level?.levelType === 'TRAINING_APTIS' ||
    course.level?.levelType === 'TRAINING' ||
    course.level?.code === 'TRAINING';

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTemplates(course.level.id, course.id);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar exámenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [course.id]);

  const handleStartNewExam = () => {
    setEditingTemplateId(null);
    setTitle(`Examen Personalizado — ${course.courseName}`);
    setExamType('MIDTERM');
    setDurationMinutes(45);
    setDescription(`Examen creado específicamente para el curso ${course.courseName}`);
    setQuestions([
      {
        type: 'ICFES_MULTIPLE_CHOICE',
        prompt: 'Elige la opción gramatical correcta para completar la oración.',
        points: 1,
        blockNumber: 1,
        orderIndex: 1,
        options: [
          { content: 'Opción A', isCorrect: true },
          { content: 'Opción B', isCorrect: false },
          { content: 'Opción C', isCorrect: false },
          { content: 'Opción D', isCorrect: false },
        ],
      },
    ]);
    setView('EDITOR');
  };

  const handleEditTemplate = async (template: ExamTemplate) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the full template with questions and options
      const full = await api.getTemplate(template.id);
      const isCustom = Boolean(template.course?.id);

      if (isCustom) {
        setEditingTemplateId(full.id);
        setTitle(full.title);
      } else {
        // Official template: prepare as custom copy for this course
        setEditingTemplateId(null);
        setTitle(`${full.title} (${course.courseName})`);
      }

      setExamType(full.examType);
      setDurationMinutes(full.durationMinutes || 45);
      setDescription(full.description || '');

      if (full.questions && full.questions.length > 0) {
        setQuestions(
          full.questions.map((q, idx) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            contextText: q.contextText || undefined,
            points: Number(q.points) || 1,
            blockNumber: q.blockNumber || Math.min(6, Math.floor(idx / 5) + 1),
            orderIndex: q.orderIndex || idx + 1,
            options: (q.options || []).map((opt) => ({
              content: opt.content,
              isCorrect: Boolean(opt.isCorrect),
              correctPosition: opt.correctPosition || undefined,
              blankId: opt.blankId || undefined,
            })),
          })),
        );
      } else {
        setQuestions([
          {
            type: 'ICFES_MULTIPLE_CHOICE',
            prompt: 'Pregunta 1',
            points: 1,
            blockNumber: 1,
            orderIndex: 1,
            options: [
              { content: 'Opción A', isCorrect: true },
              { content: 'Opción B', isCorrect: false },
            ],
          },
        ]);
      }

      setView('EDITOR');
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del examen');
    } finally {
      setLoading(false);
    }
  };

  // Upload and parse PPTX
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setParsing(true);
      setError(null);
      const result = await api.parsePptx(file);

      if (result.questions && result.questions.length > 0) {
        setTitle(result.suggestedTitle || `Examen PPTX — ${course.courseName}`);
        setQuestions(
          result.questions.map((q: any, idx: number) => ({
            type: q.type || 'ICFES_MULTIPLE_CHOICE',
            prompt: q.prompt || `Pregunta ${idx + 1}`,
            contextText: q.contextText,
            points: q.points || 1,
            blockNumber: q.blockNumber || Math.min(6, Math.floor(idx / 5) + 1),
            orderIndex: idx + 1,
            options: (q.options || []).map((opt: any) => ({
              content: opt.content || '',
              isCorrect: Boolean(opt.isCorrect),
              correctPosition: opt.correctPosition,
              blankId: opt.blankId,
            })),
          })),
        );
        setView('EDITOR');
      } else {
        setError('No se pudieron detectar preguntas en el archivo subido.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo PowerPoint');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Parse raw pasted text
  const handleParsePastedText = async () => {
    if (!pasteText.trim()) return;

    try {
      setParsing(true);
      setError(null);
      const result = await api.parseText(pasteText);

      if (result.questions && result.questions.length > 0) {
        setTitle(result.suggestedTitle || `Examen Importado — ${course.courseName}`);
        setQuestions(
          result.questions.map((q: any, idx: number) => ({
            type: q.type || 'ICFES_MULTIPLE_CHOICE',
            prompt: q.prompt || `Pregunta ${idx + 1}`,
            contextText: q.contextText,
            points: q.points || 1,
            blockNumber: q.blockNumber || Math.min(6, Math.floor(idx / 5) + 1),
            orderIndex: idx + 1,
            options: (q.options || []).map((opt: any) => ({
              content: opt.content || '',
              isCorrect: Boolean(opt.isCorrect),
              correctPosition: opt.correctPosition,
              blankId: opt.blankId,
            })),
          })),
        );
        setShowPasteArea(false);
        setPasteText('');
        setView('EDITOR');
      } else {
        setError('No se pudieron identificar preguntas en el texto pegado.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el texto');
    } finally {
      setParsing(false);
    }
  };

  // Question editing helpers
  const handleAddQuestion = () => {
    const nextOrder = questions.length + 1;
    const nextBlock = Math.min(6, Math.floor((nextOrder - 1) / 5) + 1);
    setQuestions([
      ...questions,
      {
        type: 'ICFES_MULTIPLE_CHOICE',
        prompt: `Pregunta ${nextOrder}: Escribe el enunciado aquí`,
        points: 1,
        blockNumber: nextBlock,
        orderIndex: nextOrder,
        options: [
          { content: 'Opción 1', isCorrect: true },
          { content: 'Opción 2', isCorrect: false },
          { content: 'Opción 3', isCorrect: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index).map((q, idx) => ({
      ...q,
      orderIndex: idx + 1,
      blockNumber: Math.min(6, Math.floor(idx / 5) + 1),
    }));
    setQuestions(updated);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<EditableQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const newOptions = [...q.options, { content: `Opción ${q.options.length + 1}`, isCorrect: false }];
    handleUpdateQuestion(qIndex, { options: newOptions });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length <= 1) return;
    const newOptions = q.options.filter((_, idx) => idx !== optIndex);
    if (!newOptions.some((o) => o.isCorrect) && newOptions.length > 0) {
      newOptions[0].isCorrect = true;
    }
    handleUpdateQuestion(qIndex, { options: newOptions });
  };

  const handleSelectCorrectOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    const newOptions = q.options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === optIndex,
    }));
    handleUpdateQuestion(qIndex, { options: newOptions });
  };

  // Sentence Scramble helpers
  const handleScrambleSentenceChange = (qIndex: number, text: string) => {
    setScrambleSentences((prev) => ({ ...prev, [qIndex]: text }));

    // Extract tokens from sentence in real time
    let tokens: string[] = [];
    if (text.includes('/')) {
      tokens = text.split('/').map((t) => t.trim()).filter(Boolean);
    } else {
      tokens = text.trim().split(/\s+/).filter(Boolean);
    }

    if (tokens.length > 0) {
      const newOptions = tokens.map((token, idx) => ({
        content: token,
        isCorrect: true,
        correctPosition: idx + 1,
      }));
      handleUpdateQuestion(qIndex, { options: newOptions });
    }
  };

  const handleMoveScrambleOption = (qIndex: number, optIndex: number, direction: 'left' | 'right') => {
    const q = questions[qIndex];
    const targetIndex = direction === 'left' ? optIndex - 1 : optIndex + 1;
    if (targetIndex < 0 || targetIndex >= q.options.length) return;
    const newOptions = [...q.options];
    const temp = newOptions[optIndex];
    newOptions[optIndex] = newOptions[targetIndex];
    newOptions[targetIndex] = temp;
    handleUpdateQuestion(qIndex, { options: newOptions });
    setScrambleSentences((prev) => ({
      ...prev,
      [qIndex]: newOptions.map((o) => o.content).join(' '),
    }));
  };

  const handleToggleTestScramble = (qIndex: number) => {
    if (testingScrambleIndex === qIndex) {
      setTestingScrambleIndex(null);
      setTestChosenIndices([]);
      setTestBankIndices([]);
    } else {
      const q = questions[qIndex];
      const indices = q.options.map((_, i) => i);
      const shuffled = [...indices].sort(() => Math.random() - 0.5);
      setTestBankIndices(shuffled);
      setTestChosenIndices([]);
      setTestingScrambleIndex(qIndex);
    }
  };

  const handleTestPickWord = (optIdx: number) => {
    setTestChosenIndices([...testChosenIndices, optIdx]);
    setTestBankIndices(testBankIndices.filter((i) => i !== optIdx));
  };

  const handleTestRemoveWord = (positionInChosen: number) => {
    const optIdx = testChosenIndices[positionInChosen];
    setTestChosenIndices(testChosenIndices.filter((_, idx) => idx !== positionInChosen));
    setTestBankIndices([...testBankIndices, optIdx]);
  };

  const handleTestReset = (qIndex: number) => {
    const q = questions[qIndex];
    const indices = q.options.map((_, i) => i);
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    setTestBankIndices(shuffled);
    setTestChosenIndices([]);
  };

  const handleApplyTestedOrderAsCanonical = (qIndex: number) => {
    const q = questions[qIndex];
    if (testChosenIndices.length !== q.options.length) return;
    const reorderedOptions = testChosenIndices.map((idx, pos) => ({
      ...q.options[idx],
      correctPosition: pos + 1,
    }));
    handleUpdateQuestion(qIndex, { options: reorderedOptions });
    setScrambleSentences((prev) => ({
      ...prev,
      [qIndex]: reorderedOptions.map((o) => o.content).join(' '),
    }));
    setTestingScrambleIndex(null);
    setTestChosenIndices([]);
    setTestBankIndices([]);
  };

  // Cloze Inline & Word Bank helpers
  const handleInsertBlankIntoPrompt = (qIndex: number) => {
    const q = questions[qIndex];
    const textarea = document.getElementById(`prompt-textarea-${qIndex}`) as HTMLTextAreaElement | null;
    const blankToken = q.type === 'SENTENCE_COMPLETION' ? ' [ _________ ] ' : ' [ _____ ] ';

    if (textarea && textarea.selectionStart !== null && textarea.selectionEnd !== null) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = q.prompt || '';
      const updated = current.substring(0, start) + blankToken + current.substring(end);
      handleUpdateQuestion(qIndex, { prompt: updated });
      setTimeout(() => {
        textarea.focus();
        const cursor = start + blankToken.length;
        textarea.setSelectionRange(cursor, cursor);
      }, 50);
    } else {
      const current = q.prompt || '';
      handleUpdateQuestion(qIndex, {
        prompt: current ? `${current}${blankToken}` : `Completa la oración:${blankToken}`,
      });
    }
  };

  const handleQuickAddWordBank = (qIndex: number, text: string) => {
    if (!text.trim()) return;
    const words = text.split(/[\,\/\|]/).map((w) => w.trim()).filter(Boolean);
    if (words.length === 0) return;
    const q = questions[qIndex];
    const existingCorrect = q.options.find((o) => o.isCorrect)?.content;

    const newOptions = words.map((w, idx) => ({
      content: w,
      isCorrect: existingCorrect ? w.toLowerCase() === existingCorrect.toLowerCase() : idx === 0,
    }));
    handleUpdateQuestion(qIndex, { options: newOptions });
  };

  const renderClozePreview = (q: EditableQuestion) => {
    const text = q.prompt || '';
    const regex = /\[(?:blank_)?\d*\]|\[_{2,}\]|\[blank\]|_{3,}/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let blankIndex = 0;

    const correctOpt = q.options.find((o) => o.isCorrect)?.content || 'Opción Correcta';

    while ((match = regex.exec(text)) !== null) {
      blankIndex++;
      const preceding = text.substring(lastIndex, match.index);
      if (preceding) {
        parts.push(<span key={`text-${lastIndex}`}>{preceding}</span>);
      }

      parts.push(
        <span
          key={`blank-${blankIndex}-${lastIndex}`}
          className="inline-flex items-center gap-1.5 mx-1.5 px-3 py-1 rounded-btn bg-accent/15 border-2 border-accent text-accent font-bold text-xs shadow-2xs"
        >
          <span>{correctOpt}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    const trailing = text.substring(lastIndex);
    if (trailing) {
      parts.push(<span key={`text-end`}>{trailing}</span>);
    }

    if (blankIndex === 0) {
      parts.push(
        <span
          key="blank-placeholder"
          className="inline-flex items-center gap-1.5 mx-1.5 px-3 py-1 rounded-btn bg-danger-soft/40 border border-dashed border-danger text-danger font-semibold text-xs"
        >
          <span>(Inserta un espacio [ _____ ] arriba para ver el desplegable)</span>
        </span>
      );
    }

    return parts;
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor indica un título para el examen');
      return;
    }
    if (questions.length === 0) {
      setError('El examen debe tener al menos una pregunta');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        levelId: course.level.id,
        courseId: course.id,
        title: title.trim(),
        description: description.trim() || undefined,
        examType,
        durationMinutes: Number(durationMinutes) || 45,
        questions: questions.map((q, idx) => ({
          type: q.type,
          prompt: q.prompt.trim(),
          contextText: q.contextText?.trim() || undefined,
          points: Number(q.points) || 1,
          blockNumber: Math.min(6, Math.floor(idx / 5) + 1),
          orderIndex: idx + 1,
          options: q.options.map((opt, optIdx) => ({
            content: opt.content.trim(),
            isCorrect: opt.isCorrect,
            correctPosition: q.type === 'SENTENCE_SCRAMBLE' ? optIdx + 1 : opt.correctPosition,
            blankId: q.type === 'FILL_IN_BLANK' ? 1 : opt.blankId,
          })),
        })),
      };

      if (editingTemplateId) {
        await api.updateExamTemplate(editingTemplateId, payload);
      } else {
        await api.createExamTemplate(payload);
      }

      setEditingTemplateId(null);
      // Reload and return to list
      await loadTemplates();
      setView('LIST');
      if (onExamCreated) onExamCreated();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el examen');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este examen personalizado?')) return;

    try {
      setLoading(true);
      await api.deleteExamTemplate(templateId);
      await loadTemplates();
      if (onExamCreated) onExamCreated();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el examen');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-paper-card border border-rule rounded-card max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule flex-shrink-0 bg-paper">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2 py-0.5 bg-accent-soft text-accent text-[11px] font-bold rounded">
                {course.level?.name || 'Nivel'}
              </span>
              <span className="text-xs text-ink-muted">· {course.courseName}</span>
            </div>
            <h2 className="text-lg font-bold text-ink">
              {view === 'LIST'
                ? 'Centro de Exámenes del Curso'
                : 'Diseñador & Importador de Examen'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink rounded-btn hover:bg-paper-muted cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-danger-soft border border-danger/20 rounded-btn text-xs text-danger font-medium flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-danger font-bold ml-2">
              ×
            </button>
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {view === 'LIST' ? (
            /* ================= VIEW 1: EXAM LIST ================= */
            <div className="space-y-6">
              {/* Quick actions bar */}
              <div className="p-5 bg-paper rounded-card border border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-ink mb-1">
                    Crear o Importar Nuevo Examen
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Puedes diseñar un examen desde cero o importar directamente las 30 diapositivas de tu PowerPoint (.pptx).
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pptx"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                    className="px-3 py-2 bg-paper-card border border-rule hover:border-rule-strong text-ink text-xs font-semibold rounded-btn inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {parsing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-accent" />
                    )}
                    <span>Importar PPTX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    className="px-3 py-2 bg-paper-card border border-rule hover:border-rule-strong text-ink text-xs font-semibold rounded-btn inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Pegar Texto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartNewExam}
                    className="px-3.5 py-2 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-semibold rounded-btn inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Diseñar en Blanco</span>
                  </button>
                </div>
              </div>

              {/* Collapsible paste area */}
              {showPasteArea && (
                <div className="p-4 bg-paper rounded-card border border-rule space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">
                      Pegar texto de las diapositivas o preguntas:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasteArea(false)}
                      className="text-xs text-ink-muted hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="1. What is the past of go?&#10;*A) went&#10;B) goed&#10;C) gone&#10;&#10;2. Complete the sentence: She [was/were] happy."
                    className="w-full text-xs font-mono p-3 rounded-card border border-rule bg-paper-card text-ink focus:border-accent"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      disabled={parsing || !pasteText.trim()}
                      className="px-4 py-2 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-semibold rounded-btn inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {parsing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Extrayendo preguntas...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Convertir a Examen Digital</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Template list */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Exámenes Disponibles para este Curso ({templates.length})
                </h3>

                {loading ? (
                  <div className="py-12 text-center text-ink-muted text-xs flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Cargando exámenes...</span>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="p-8 text-center bg-paper rounded-card border border-rule text-ink-muted text-xs space-y-2">
                    <p className="font-semibold text-ink">No hay exámenes registrados para este curso todavía.</p>
                    <p>Usa los botones superiores para importar tu PowerPoint o diseñar tu primera evaluación.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {templates.map((tpl) => {
                      const isCustom = Boolean(tpl.course?.id);

                      return (
                        <div
                          key={tpl.id}
                          className="p-4 bg-paper-card border border-rule hover:border-rule-strong rounded-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  isCustom
                                    ? 'bg-accent-soft text-accent'
                                    : 'bg-paper-muted text-ink-muted border border-rule'
                                }`}
                              >
                                {isCustom ? '🌟 Personalizado de este Curso' : '🏛️ Oficial de Coordinación'}
                              </span>
                              <span className="text-[11px] font-semibold text-ink-muted">
                                {tpl.examType === 'MIDTERM' ? 'Examen Intermedio' : 'Examen Final'}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-ink">{tpl.title}</h4>

                            <div className="flex items-center space-x-4 text-xs text-ink-muted">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {tpl.durationMinutes} minutos
                              </span>
                              <span className="flex items-center">
                                <BookOpen className="w-3 h-3 mr-1" />
                                {tpl.questions?.length ?? 30} preguntas
                              </span>
                              {tpl.createdBy && (
                                <span>
                                  Creado por: {tpl.createdBy.firstName || tpl.createdBy.email}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleEditTemplate(tpl)}
                              className="px-2.5 py-1.5 bg-paper hover:bg-accent-soft text-accent border border-rule hover:border-accent/40 rounded-btn text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer shadow-2xs"
                              title={
                                isCustom
                                  ? 'Editar preguntas y respuestas de este examen'
                                  : 'Crear una copia editable para este curso'
                              }
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>{isCustom ? 'Editar' : 'Personalizar Copia'}</span>
                            </button>

                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.id)}
                                className="p-1.5 text-danger hover:bg-danger-soft rounded-btn border border-rule hover:border-danger/30 text-xs font-medium cursor-pointer"
                                title="Eliminar examen personalizado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ================= VIEW 2: VISUAL EDITOR ================= */
            <form onSubmit={handleSaveExam} className="space-y-6">
              {/* Back to list button */}
              <div className="flex items-center justify-between pb-3 border-b border-rule">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplateId(null);
                      setView('LIST');
                    }}
                    className="inline-flex items-center text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Volver al listado de exámenes
                  </button>
                  {editingTemplateId && (
                    <span className="px-2 py-0.5 bg-accent-soft text-accent text-[10px] font-bold rounded">
                      Modo Edición
                    </span>
                  )}
                </div>
                <span className="text-xs text-ink-muted font-medium">
                  {questions.length} reactivo(s) cargado(s)
                </span>
              </div>

              {/* Exam metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-paper rounded-card border border-rule">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-ink mb-1">
                    Título del Examen:
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 rounded-btn border border-rule bg-paper-card text-ink focus:border-accent"
                    placeholder="Ej. Midterm Exam - Gramática & Sintaxis 10B"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Tipo de Examen:
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as any)}
                    disabled={isTraining}
                    className="w-full text-xs font-medium p-2.5 rounded-btn border border-rule bg-paper-card text-ink focus:border-accent disabled:opacity-50"
                  >
                    <option value="MIDTERM">Examen Intermedio (Midterm)</option>
                    {!isTraining && <option value="FINAL">Examen Final</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Duración (Minutos):
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-xs font-medium p-2.5 rounded-btn border border-rule bg-paper-card text-ink focus:border-accent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-ink mb-1">
                    Instrucciones o Descripción:
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 rounded-btn border border-rule bg-paper-card text-ink focus:border-accent"
                    placeholder="Ej. Evaluación de 30 puntos. Prohibido abrir pestañas externas."
                  />
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Reactivos de la Evaluación ({questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 bg-paper-card border border-rule hover:border-rule-strong text-ink text-xs font-semibold rounded-btn inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-accent" />
                    <span>Agregar Pregunta</span>
                  </button>
                </div>

                {questions.map((q, qIdx) => {
                  return (
                    <div
                      key={qIdx}
                      className="p-5 bg-paper-card border border-rule rounded-card space-y-4 shadow-xs"
                    >
                      {/* Question card header */}
                      <div className="flex items-center justify-between pb-3 border-b border-rule">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-ink text-paper text-xs font-bold flex items-center justify-center">
                            {qIdx + 1}
                          </span>
                          <span className="text-xs font-semibold text-ink-muted">
                            Bloque {Math.min(6, Math.floor(qIdx / 5) + 1)} (Pantalla Grupal)
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Type selector */}
                          <select
                            value={q.type}
                            onChange={(e) =>
                              handleUpdateQuestion(qIdx, {
                                type: e.target.value as any,
                              })
                            }
                            className="text-xs font-medium p-1.5 rounded-btn border border-rule bg-paper-card text-ink focus:border-accent"
                          >
                            <option value="ICFES_MULTIPLE_CHOICE">Tipo ICFES (Opción múltiple)</option>
                            <option value="SENTENCE_SCRAMBLE">Ordenar Oración (Sentence Scramble)</option>
                            <option value="FILL_IN_BLANK">Completar Espacio (Cloze Inline)</option>
                            <option value="SENTENCE_COMPLETION">Completar con Recuadro de Palabras (Concordancia)</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="p-1.5 text-ink-muted hover:text-danger rounded hover:bg-danger-soft cursor-pointer"
                            title="Eliminar pregunta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Prompt input */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-ink">
                            {q.type === 'FILL_IN_BLANK'
                              ? 'Oración del Ejercicio (Inserta el espacio donde irá el menú desplegable):'
                              : q.type === 'SENTENCE_COMPLETION'
                              ? 'Oración del Ejercicio (Inserta el espacio que el alumno debe completar):'
                              : 'Enunciado / Pregunta:'}
                          </label>
                          {q.type === 'FILL_IN_BLANK' && (
                            <button
                              type="button"
                              onClick={() => handleInsertBlankIntoPrompt(qIdx)}
                              className="px-2.5 py-1 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-bold rounded-btn transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                              title="Inserta automáticamente el espacio en blanco para el menú desplegable"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Insertar Espacio Desplegable [ _____ ]
                            </button>
                          )}
                          {q.type === 'SENTENCE_COMPLETION' && (
                            <button
                              type="button"
                              onClick={() => handleInsertBlankIntoPrompt(qIdx)}
                              className="px-2.5 py-1 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-bold rounded-btn transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                              title="Inserta automáticamente el espacio en blanco en la oración"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Insertar Espacio [ _________ ]
                            </button>
                          )}
                        </div>
                        <textarea
                          id={`prompt-textarea-${qIdx}`}
                          rows={2}
                          required
                          value={q.prompt}
                          onChange={(e) => handleUpdateQuestion(qIdx, { prompt: e.target.value })}
                          className="w-full text-xs font-medium p-2.5 rounded-btn border border-rule bg-paper-card text-ink focus:border-accent"
                          placeholder={
                            q.type === 'FILL_IN_BLANK'
                              ? 'Ej: Yesterday I [ _____ ] to the cinema with my friends.'
                              : q.type === 'SENTENCE_COMPLETION'
                              ? 'Ej: El niño estaba tan emocionado que [ _________ ] por el parque.'
                              : 'Escribe el enunciado de la pregunta...'
                          }
                        />
                      </div>

                      {/* Options / Answers according to question type */}
                      {q.type === 'ICFES_MULTIPLE_CHOICE' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-ink">
                            Opciones de Respuesta (Marca con el círculo verde la opción correcta):
                          </label>
                          {q.options.map((opt, optIdx) => {
                            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                            const letter = letters[optIdx] || `${optIdx + 1}`;

                            return (
                              <div key={optIdx} className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleSelectCorrectOption(qIdx, optIdx)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer ${
                                    opt.isCorrect
                                      ? 'bg-success text-white ring-2 ring-success/30'
                                      : 'bg-paper-muted border border-rule text-ink hover:border-rule-strong'
                                  }`}
                                  title={opt.isCorrect ? 'Opción Correcta' : 'Hacer esta opción la correcta'}
                                >
                                  {opt.isCorrect ? <Check className="w-3.5 h-3.5" /> : letter}
                                </button>
                                <input
                                  type="text"
                                  required
                                  value={opt.content}
                                  onChange={(e) => {
                                    const newOpts = [...q.options];
                                    newOpts[optIdx].content = e.target.value;
                                    handleUpdateQuestion(qIdx, { options: newOpts });
                                  }}
                                  className={`flex-1 text-xs p-2 rounded-btn border text-ink focus:border-accent ${
                                    opt.isCorrect
                                      ? 'border-success bg-success-soft/30 font-semibold'
                                      : 'border-rule bg-paper-card font-medium'
                                  }`}
                                  placeholder={`Texto de la opción ${letter}...`}
                                />
                                {q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(qIdx, optIdx)}
                                    className="p-1 text-ink-muted hover:text-danger rounded"
                                    title="Quitar opción"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => handleAddOption(qIdx)}
                            className="mt-1 text-xs text-accent hover:underline font-semibold inline-flex items-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3 mr-0.5" />
                            Agregar otra opción
                          </button>
                        </div>
                      )}

                      {q.type === 'SENTENCE_SCRAMBLE' && (() => {
                        const currentSentence =
                          scrambleSentences[qIdx] ??
                          q.options
                            .map((o) => o.content.trim())
                            .filter(Boolean)
                            .join(' ');

                        return (
                          <div className="space-y-4 p-4 bg-paper rounded-card border border-rule">
                            {/* Paso 1: El profesor escribe la oración correcta */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-ink flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-accent text-accent-ink inline-flex items-center justify-center text-[11px] font-bold">
                                    1
                                  </span>
                                  <span>Oración Correcta (Escribe la respuesta esperada aquí):</span>
                                </label>
                                <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">
                                  {q.options.filter((o) => o.content.trim()).length} fichas generadas
                                </span>
                              </div>
                              <p className="text-[11px] text-ink-muted">
                                Escribe la frase completa tal y como debe ser armada por el alumno. Conforme escribes, las fichas de abajo se adecuarán automáticamente.
                              </p>
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  value={currentSentence}
                                  onChange={(e) => handleScrambleSentenceChange(qIdx, e.target.value)}
                                  placeholder="Ej: She has lived in London for three years."
                                  className="w-full text-sm font-semibold p-3 rounded-btn border-2 border-rule focus:border-accent bg-paper-card text-ink shadow-2xs outline-hidden tracking-wide"
                                />
                              </div>
                              <p className="text-[10px] text-ink-muted">
                                💡 <strong>Agrupación de palabras:</strong> Si quieres que dos o más palabras vayan juntas en una sola ficha (ej: <em>in London</em>), sepáralas con barras: <code className="bg-paper-card px-1.5 py-0.5 rounded border border-rule font-mono text-accent">She / has lived / in London</code>.
                              </p>
                            </div>

                            {/* Paso 2: Fichas individuales adecuadas a la oración */}
                            <div className="space-y-2 pt-3 border-t border-rule/60">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <label className="block text-xs font-bold text-ink flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-paper-muted border border-rule text-ink inline-flex items-center justify-center text-[11px] font-bold">
                                    2
                                  </span>
                                  <span>Fichas Individuales Adecuadas (Clave Canónica 1 a {q.options.length}):</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTestScramble(qIdx)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-btn border transition-colors cursor-pointer inline-flex items-center ${
                                    testingScrambleIndex === qIdx
                                      ? 'bg-accent text-accent-ink border-accent'
                                      : 'bg-paper-card text-accent border-accent/40 hover:bg-accent/10'
                                  }`}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  {testingScrambleIndex === qIdx ? 'Cerrar Simulador' : 'Probar como Estudiante'}
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {q.options.map((opt, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className="flex items-center space-x-1 px-2.5 py-1 bg-paper-card border border-rule rounded-btn text-xs font-semibold text-ink shadow-2xs hover:border-accent/40 transition-colors"
                                  >
                                    <button
                                      type="button"
                                      disabled={optIdx === 0}
                                      onClick={() => handleMoveScrambleOption(qIdx, optIdx, 'left')}
                                      className="p-0.5 text-ink-muted hover:text-accent disabled:opacity-20 cursor-pointer"
                                      title="Mover palabra a la izquierda"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    <span className="text-[11px] font-bold text-accent px-0.5">{optIdx + 1}.</span>

                                    <input
                                      type="text"
                                      required
                                      value={opt.content}
                                      onChange={(e) => {
                                        const newOpts = [...q.options];
                                        newOpts[optIdx].content = e.target.value;
                                        handleUpdateQuestion(qIdx, { options: newOpts });
                                        setScrambleSentences((prev) => ({
                                          ...prev,
                                          [qIdx]: newOpts.map((o) => o.content).join(' '),
                                        }));
                                      }}
                                      className="w-20 sm:w-24 text-xs px-1 py-0.5 border-b border-rule bg-transparent text-ink font-semibold focus:border-accent outline-hidden"
                                      placeholder="Palabra..."
                                    />

                                    <button
                                      type="button"
                                      disabled={optIdx === q.options.length - 1}
                                      onClick={() => handleMoveScrambleOption(qIdx, optIdx, 'right')}
                                      className="p-0.5 text-ink-muted hover:text-accent disabled:opacity-20 cursor-pointer"
                                      title="Mover palabra a la derecha"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>

                                    {q.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleRemoveOption(qIdx, optIdx);
                                          const newOpts = q.options.filter((_, i) => i !== optIdx);
                                          setScrambleSentences((prev) => ({
                                            ...prev,
                                            [qIdx]: newOpts.map((o) => o.content).join(' '),
                                          }));
                                        }}
                                        className="p-0.5 text-ink-muted hover:text-danger text-xs ml-0.5 cursor-pointer"
                                        title="Eliminar esta ficha"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => handleAddOption(qIdx)}
                                  className="px-2.5 py-1.5 border border-dashed border-rule hover:border-rule-strong rounded-btn text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer bg-paper-card"
                                >
                                  + Ficha
                                </button>
                              </div>
                            </div>

                            {/* Paso 3: Vista previa del estudiante */}
                            <div className="pt-2 border-t border-rule/60">
                              <span className="block text-[11px] font-bold text-ink-muted mb-1.5">
                                Vista previa de cómo recibirá las fichas el estudiante (Barajadas al azar):
                              </span>
                              <div className="p-2.5 bg-paper-card rounded-btn border border-rule/70 flex flex-wrap gap-1.5">
                                {[...q.options]
                                  .map((opt) => opt.content.trim())
                                  .filter(Boolean)
                                  .reverse()
                                  .map((word, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2.5 py-1 rounded-btn bg-paper border border-rule text-xs font-medium text-ink select-none"
                                    >
                                      {word}
                                    </span>
                                  ))}
                              </div>
                            </div>

                            {/* Simulador Interactivo de Comprobación */}
                            {testingScrambleIndex === qIdx && (
                              <div className="mt-3 p-3.5 bg-paper-card border-2 border-accent/40 rounded-card space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                    <span className="text-xs font-bold text-ink">
                                      Simulador: Comprobación táctil de cómo lo resolverá el estudiante
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleTestReset(qIdx)}
                                    className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1 font-medium cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Reiniciar Prueba
                                  </button>
                                </div>

                                {/* Zona de construcción del estudiante */}
                                <div className="p-3 min-h-[50px] rounded-btn border-2 border-dashed border-rule bg-paper flex flex-wrap items-center gap-1.5">
                                  {testChosenIndices.length === 0 ? (
                                    <span className="text-xs text-ink-muted italic">
                                      Toca las fichas de abajo para armar la frase en el orden que deseas comprobar...
                                    </span>
                                  ) : (
                                    testChosenIndices.map((optIdx, pos) => (
                                      <button
                                        key={`${optIdx}-${pos}`}
                                        type="button"
                                        onClick={() => handleTestRemoveWord(pos)}
                                        className="px-2.5 py-1 rounded-btn bg-accent text-accent-ink text-xs font-semibold shadow-2xs hover:bg-accent-hover cursor-pointer inline-flex items-center gap-1"
                                        title="Toca para devolver al banco"
                                      >
                                        <span>{q.options[optIdx]?.content}</span>
                                        <span className="text-[10px] opacity-70">×</span>
                                      </button>
                                    ))
                                  )}
                                </div>

                                {/* Banco de fichas barajadas */}
                                <div className="space-y-1">
                                  <span className="text-[11px] font-bold text-ink-muted">
                                    Banco de Fichas (Barajadas al azar):
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {testBankIndices.map((optIdx) => (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        onClick={() => handleTestPickWord(optIdx)}
                                        className="px-2.5 py-1 rounded-btn bg-paper border border-rule hover:border-accent text-xs font-medium text-ink cursor-pointer hover:bg-paper-card"
                                      >
                                        {q.options[optIdx]?.content}
                                      </button>
                                    ))}
                                    {testBankIndices.length === 0 && (
                                      <span className="text-xs text-ink-muted italic py-1">
                                        Has colocado todas las fichas en la oración.
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Feedback y botón para fijar como clave */}
                                {testChosenIndices.length === q.options.length && (
                                  <div className="space-y-2">
                                    <div
                                      className={`p-2.5 rounded-btn border text-xs font-semibold flex items-center justify-between ${
                                        testChosenIndices.every((optIdx, pos) => optIdx === pos)
                                          ? 'bg-success-soft/30 border-success text-success'
                                          : 'bg-danger-soft/30 border-danger text-danger'
                                      }`}
                                    >
                                      {testChosenIndices.every((optIdx, pos) => optIdx === pos) ? (
                                        <span className="flex items-center gap-1.5">
                                          <CheckCircle className="w-4 h-4 text-success" />
                                          ¡Comprobación Exitosa! El orden formado coincide exactamente con la clave canónica del examen (100% de la nota).
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1.5">
                                          <AlertCircle className="w-4 h-4 text-danger" />
                                          Orden Diferente: No coincide con el orden canónico actual (1 a {q.options.length}).
                                        </span>
                                      )}
                                    </div>

                                    <div className="p-2.5 bg-paper rounded-btn border border-rule/60 flex flex-col sm:flex-row items-center justify-between gap-2">
                                      <span className="text-xs text-ink">
                                        Frase armada en la prueba: <strong>&ldquo;{testChosenIndices.map((i) => q.options[i]?.content).join(' ')}&rdquo;</strong>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleApplyTestedOrderAsCanonical(qIdx)}
                                        className="px-3 py-1.5 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-bold rounded-btn transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        Establecer este orden como la Clave Correcta
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {q.type === 'FILL_IN_BLANK' && (
                        <div className="space-y-3.5 p-4 bg-paper rounded-card border border-rule">
                          {/* Live preview banner of the sentence with the inline select */}
                          <div className="p-3 bg-paper-card rounded-btn border border-rule space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-accent" />
                                Vista Previa en Vivo (Así lo verá el estudiante en su examen):
                              </span>
                              <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">
                                Desplegable Integrado en Texto
                              </span>
                            </div>
                            <div className="p-3 bg-paper rounded border border-rule/70 text-sm font-medium text-ink leading-loose">
                              {renderClozePreview(q)}
                            </div>
                          </div>

                          {/* Dropdown Options Editor */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-ink flex items-center gap-1.5">
                                <ChevronDown className="w-4 h-4 text-accent" />
                                <span>Opciones dentro del Menú Desplegable [ _____ ]:</span>
                              </label>
                              <span className="text-[11px] text-ink-muted">
                                Marca con el botón verde la respuesta correcta
                              </span>
                            </div>

                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`flex items-center space-x-2.5 p-2 rounded-btn border transition-colors ${
                                    opt.isCorrect
                                      ? 'bg-success-soft/20 border-success/60'
                                      : 'bg-paper-card border-rule'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleSelectCorrectOption(qIdx, optIdx)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer transition-colors ${
                                      opt.isCorrect
                                        ? 'bg-success text-white ring-2 ring-success/30'
                                        : 'bg-paper border border-rule text-ink hover:border-rule-strong'
                                    }`}
                                    title={
                                      opt.isCorrect
                                        ? 'Opción Correcta en el Desplegable'
                                        : 'Hacer esta opción la correcta'
                                    }
                                  >
                                    {opt.isCorrect ? <Check className="w-3.5 h-3.5" /> : optIdx + 1}
                                  </button>

                                  <input
                                    type="text"
                                    required
                                    value={opt.content}
                                    onChange={(e) => {
                                      const newOpts = [...q.options];
                                      newOpts[optIdx].content = e.target.value;
                                      handleUpdateQuestion(qIdx, { options: newOpts });
                                    }}
                                    className="flex-1 text-xs p-2 rounded-btn border border-rule bg-paper-card text-ink font-semibold focus:border-accent outline-hidden"
                                    placeholder={`Opción ${optIdx + 1} del menú desplegable (ej. went)...`}
                                  />

                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                                      opt.isCorrect
                                        ? 'bg-success text-white'
                                        : 'bg-paper-muted text-ink-muted border border-rule'
                                    }`}
                                  >
                                    {opt.isCorrect ? 'Correcta' : 'Distractor'}
                                  </span>

                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(qIdx, optIdx)}
                                      className="p-1 text-ink-muted hover:text-danger rounded cursor-pointer"
                                      title="Eliminar opción"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddOption(qIdx)}
                              className="mt-2 text-xs text-accent hover:underline font-semibold inline-flex items-center cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Agregar otra opción al menú desplegable
                            </button>
                          </div>
                        </div>
                      )}

                      {q.type === 'SENTENCE_COMPLETION' && (
                        <div className="space-y-4 p-4 bg-paper rounded-card border border-rule">
                          {/* Live preview of Word Bank and Sentence */}
                          <div className="p-3.5 bg-paper-card rounded-btn border border-rule space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-accent" />
                                Vista Previa del Recuadro de Palabras (Así lo verá el estudiante):
                              </span>
                              <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">
                                {q.options.filter((o) => o.content.trim()).length} palabra(s) en el recuadro
                              </span>
                            </div>

                            <div className="p-3 bg-paper rounded border border-rule/70 space-y-2">
                              <p className="text-xs text-ink-muted italic font-medium">
                                Usa las palabras del recuadro para dar sentido y concordancia gramatical a la oración:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {q.options
                                  .filter((o) => o.content.trim())
                                  .map((opt, oIdx) => (
                                    <span
                                      key={oIdx}
                                      className={`px-3 py-1 rounded-btn text-xs font-semibold border transition-colors inline-flex items-center gap-1 ${
                                        opt.isCorrect
                                          ? 'bg-success-soft/30 border-success text-success'
                                          : 'bg-paper-card border-rule text-ink'
                                      }`}
                                    >
                                      <span>{opt.content}</span>
                                      {opt.isCorrect && <Check className="w-3 h-3 text-success" />}
                                    </span>
                                  ))}
                                {q.options.filter((o) => o.content.trim()).length === 0 && (
                                  <span className="text-xs text-ink-muted italic">
                                    Agrega palabras abajo para llenar el recuadro...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Options / Words in the Word Bank */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-ink flex items-center gap-1.5">
                                <span>Palabras del Recuadro (Marca con el botón verde la que completa la oración):</span>
                              </label>
                              <span className="text-[11px] text-ink-muted">
                                1 palabra correcta + distractores
                              </span>
                            </div>

                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`flex items-center space-x-2.5 p-2 rounded-btn border transition-colors ${
                                    opt.isCorrect
                                      ? 'bg-success-soft/20 border-success/60'
                                      : 'bg-paper-card border-rule'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleSelectCorrectOption(qIdx, optIdx)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer transition-colors ${
                                      opt.isCorrect
                                        ? 'bg-success text-white ring-2 ring-success/30'
                                        : 'bg-paper border border-rule text-ink hover:border-rule-strong'
                                    }`}
                                    title={
                                      opt.isCorrect
                                        ? 'Respuesta Correcta por Concordancia'
                                        : 'Hacer esta palabra la correcta'
                                    }
                                  >
                                    {opt.isCorrect ? <Check className="w-3.5 h-3.5" /> : optIdx + 1}
                                  </button>

                                  <input
                                    type="text"
                                    required
                                    value={opt.content}
                                    onChange={(e) => {
                                      const newOpts = [...q.options];
                                      newOpts[optIdx].content = e.target.value;
                                      handleUpdateQuestion(qIdx, { options: newOpts });
                                    }}
                                    className="flex-1 text-xs p-2 rounded-btn border border-rule bg-paper-card text-ink font-semibold focus:border-accent outline-hidden"
                                    placeholder={`Palabra ${optIdx + 1} del recuadro (ej. brincó, preparación, lonchera)...`}
                                  />

                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                                      opt.isCorrect
                                        ? 'bg-success text-white'
                                        : 'bg-paper-muted text-ink-muted border border-rule'
                                    }`}
                                  >
                                    {opt.isCorrect ? 'Correcta' : 'Distractor'}
                                  </span>

                                  {q.options.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(qIdx, optIdx)}
                                      className="p-1 text-ink-muted hover:text-danger rounded cursor-pointer"
                                      title="Quitar palabra"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddOption(qIdx)}
                              className="mt-1 text-xs text-accent hover:underline font-semibold inline-flex items-center cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Agregar otra palabra al recuadro
                            </button>
                          </div>

                          {/* Quick generator for word bank */}
                          <div className="pt-2 border-t border-rule/60">
                            <details className="group">
                              <summary className="text-[11px] font-bold text-accent cursor-pointer hover:underline list-none flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Carga rápida: Escribe varias palabras separadas por comas</span>
                              </summary>
                              <div className="mt-2 p-2.5 bg-paper-card rounded-btn border border-rule space-y-2">
                                <p className="text-[11px] text-ink-muted">
                                  Escribe la lista de palabras separadas por comas (ej: <em>preparación, lonchera, brincó</em> o en inglés <em>lived, living, lives, life</em>):
                                </p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    id={`quick-bank-${qIdx}`}
                                    placeholder="preparación, lonchera, brincó..."
                                    defaultValue={q.options.map((o) => o.content.trim()).filter(Boolean).join(', ')}
                                    className="flex-1 text-xs p-2 rounded-btn border border-rule bg-paper text-ink focus:border-accent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const el = document.getElementById(`quick-bank-${qIdx}`) as HTMLInputElement;
                                      if (el) handleQuickAddWordBank(qIdx, el.value);
                                    }}
                                    className="px-3 py-1.5 bg-accent text-accent-ink text-xs font-bold rounded-btn hover:bg-accent-hover transition-colors cursor-pointer"
                                  >
                                    Cargar en Recuadro
                                  </button>
                                </div>
                              </div>
                            </details>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action buttons footer */}
              <div className="sticky bottom-0 bg-paper-card pt-4 pb-2 border-t border-rule flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setView('LIST')}
                  className="px-4 py-2 border border-rule hover:border-rule-strong text-ink text-xs font-medium rounded-btn cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3.5 py-2 border border-rule hover:border-rule-strong bg-paper text-ink text-xs font-semibold rounded-btn inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Pregunta</span>
                  </button>

                  <button
                    type="submit"
                    disabled={saving || questions.length === 0}
                    className="px-5 py-2 bg-accent text-accent-ink hover:bg-accent-hover text-xs font-semibold rounded-btn flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando examen...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>
                          {editingTemplateId
                            ? 'Guardar Cambios del Examen'
                            : 'Guardar Examen para este Curso'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
