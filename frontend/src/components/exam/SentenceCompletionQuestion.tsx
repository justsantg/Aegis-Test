'use client';

import React from 'react';
import { Question } from '../../lib/api';
import { Sparkles, Check } from 'lucide-react';

interface SentenceCompletionQuestionProps {
  question: Question;
  value?: string;
  onChange: (text: string) => void;
}

export const SentenceCompletionQuestion: React.FC<SentenceCompletionQuestionProps> = ({
  question,
  value = '',
  onChange,
}) => {
  const options = question.options || [];

  return (
    <div className="space-y-4">
      {/* Short Context if provided */}
      {question.contextText && (
        <div className="p-3 bg-paper-muted border-l-2 border-accent text-sm text-ink-muted leading-relaxed rounded-r-card">
          <p className="italic">{question.contextText}</p>
        </div>
      )}

      {/* Question Prompt / Sentence */}
      <div className="p-4 bg-paper-card border border-rule rounded-card space-y-2">
        <h3 className="text-base font-semibold text-ink leading-relaxed">
          {question.prompt}
        </h3>
      </div>

      {/* Recuadro de Palabras / Word Bank (Concordancia Gramatical) */}
      {options.length > 0 && (
        <div className="p-3.5 bg-paper rounded-card border-2 border-dashed border-rule space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Recuadro de Palabras (Usa una para completar con concordancia):</span>
            </span>
            <span className="text-[10px] text-ink-muted">Toca una palabra para completar</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {options.map((opt) => {
              const isSelected = value.trim().toLowerCase() === opt.content.trim().toLowerCase();
              return (
                <button
                  key={opt.id || opt.content}
                  type="button"
                  onClick={() => onChange(opt.content)}
                  className={`px-3.5 py-1.5 rounded-btn text-sm font-semibold border transition-[color,background-color,border-color,transform] cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? 'bg-accent text-accent-ink border-accent ring-2 ring-accent/30 scale-102'
                      : 'bg-paper-card text-ink border-rule hover:border-accent hover:bg-paper-muted'
                  }`}
                >
                  <span>{opt.content}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Text Input */}
      <div>
        <label className="block text-xs font-bold text-ink mb-1.5">
          Tu respuesta (escribe o toca una palabra del recuadro):
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe aquí la palabra que completa la oración..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full text-base font-semibold p-3 rounded-card border-2 border-rule hover:border-rule-strong bg-paper-card text-ink placeholder:text-ink-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-hidden shadow-2xs"
          />
        </div>
        <p className="text-xs text-ink-muted mt-1.5">
          Asegúrate de escribir la palabra respetando la concordancia gramatical, tiempo verbal y ortografía.
        </p>
      </div>
    </div>
  );
};
