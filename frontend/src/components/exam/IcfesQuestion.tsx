'use client';

import React from 'react';
import { Question } from '../../lib/api';

interface IcfesQuestionProps {
  question: Question;
  value?: string;
  onChange: (optionId: string) => void;
}

export const IcfesQuestion: React.FC<IcfesQuestionProps> = ({
  question,
  value,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Short Context / Dialogue if provided */}
      {question.contextText && (
        <div className="p-3 bg-paper-muted border-l-2 border-accent text-sm text-ink-muted leading-relaxed rounded-r-card">
          <p className="italic">{question.contextText}</p>
        </div>
      )}

      {/* Question Prompt */}
      <h3 className="text-base font-semibold text-ink leading-snug">
        {question.prompt}
      </h3>

      {/* Options List */}
      <div className="grid grid-cols-1 gap-2.5 pt-1">
        {question.options.map((option, idx) => {
          const letter = String.fromCharCode(65 + idx); // A, B, C, D
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`flex items-start text-left p-3.5 rounded-card border ${
                isSelected
                  ? 'border-accent bg-accent-soft text-accent font-medium ring-1 ring-accent'
                  : 'border-rule hover:border-rule-strong bg-paper-card text-ink'
              }`}
            >
              <span
                className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 mr-3 text-xs font-semibold rounded ${
                  isSelected
                    ? 'bg-accent text-accent-ink'
                    : 'bg-paper-muted text-ink-muted'
                }`}
              >
                {letter}
              </span>
              <span className="flex-1 text-sm pt-0.5 leading-relaxed">
                {option.content}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
