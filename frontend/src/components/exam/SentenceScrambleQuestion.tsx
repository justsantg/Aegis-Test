'use client';

import React from 'react';
import { Question } from '../../lib/api';
import { RotateCcw } from 'lucide-react';

interface SentenceScrambleQuestionProps {
  question: Question;
  value?: string[]; // Ordered array of option IDs
  onChange: (orderedIds: string[]) => void;
}

export const SentenceScrambleQuestion: React.FC<SentenceScrambleQuestionProps> = ({
  question,
  value = [],
  onChange,
}) => {
  const optionsMap = React.useMemo(() => {
    return new Map(question.options.map((opt) => [opt.id, opt]));
  }, [question.options]);

  // Available options are those options not yet picked in `value`
  const availableOptions = React.useMemo(() => {
    const chosenSet = new Set(value);
    return question.options.filter((opt) => !chosenSet.has(opt.id));
  }, [question.options, value]);

  const handlePickWord = (optionId: string) => {
    onChange([...value, optionId]);
  };

  const handleRemoveWord = (indexToRemove: number) => {
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleReset = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Question Prompt */}
      <div>
        <h3 className="text-base font-semibold text-ink leading-snug">
          {question.prompt}
        </h3>
        <p className="text-xs text-ink-muted mt-1">
          Toca las palabras para formar la oración correcta. Toca una palabra de la oración para removerla.
        </p>
      </div>

      {/* Sentence Construction Zone */}
      <div className="p-3.5 min-h-[70px] rounded-card border-2 border-dashed border-rule bg-paper-card flex flex-wrap items-center gap-2">
        {value.length === 0 ? (
          <span className="text-xs text-ink-muted italic select-none">
            La oración aparecerá aquí conforme selecciones las palabras...
          </span>
        ) : (
          value.map((optId, idx) => {
            const opt = optionsMap.get(optId);
            if (!opt) return null;

            return (
              <button
                key={`${optId}-${idx}`}
                type="button"
                onClick={() => handleRemoveWord(idx)}
                className="inline-flex items-center px-3 py-1.5 rounded-btn bg-accent text-accent-ink text-sm font-medium shadow-sm hover:bg-accent-hover cursor-pointer"
                title="Toca para remover"
              >
                {opt.content}
              </button>
            );
          })
        )}
      </div>

      {/* Controls & Reset */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-medium text-ink-muted">
          Banco de palabras disponibles:
        </span>
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center text-xs text-ink-muted hover:text-ink font-medium px-2 py-1 rounded border border-rule hover:border-rule-strong"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reiniciar
          </button>
        )}
      </div>

      {/* Available Word Chips Bank */}
      <div className="p-3 bg-paper-muted rounded-card border border-rule flex flex-wrap gap-2">
        {availableOptions.length === 0 ? (
          <span className="text-xs text-ink-muted italic py-1">
            Has ordenado todas las fichas. Si deseas cambiar el orden, toca una ficha de arriba para devolverla.
          </span>
        ) : (
          availableOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePickWord(opt.id)}
              className="px-3 py-1.5 rounded-btn bg-paper-card text-ink text-sm font-medium border border-rule hover:border-rule-strong shadow-sm hover:bg-paper-card/80 cursor-pointer"
            >
              {opt.content}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
