'use client';

import React from 'react';
import { Question } from '../../lib/api';

interface ClozeDropdownQuestionProps {
  question: Question;
  value?: Record<string, string>; // { "1": "optIdA", "2": "optIdB" }
  onChange: (val: Record<string, string>) => void;
}

export const ClozeDropdownQuestion: React.FC<ClozeDropdownQuestionProps> = ({
  question,
  value = {},
  onChange,
}) => {
  // Group options by blankId
  const optionsByBlank = React.useMemo(() => {
    const map = new Map<number, typeof question.options>();
    question.options.forEach((opt) => {
      const bId = opt.blankId || 1;
      if (!map.has(bId)) map.set(bId, []);
      map.get(bId)!.push(opt);
    });
    return map;
  }, [question.options]);

  const handleSelectChange = (blankId: number, optionId: string) => {
    onChange({
      ...value,
      [String(blankId)]: optionId,
    });
  };

  // Parse prompt text and render inline selects
  // Matches tokens like [blank_1], [1], [ _____ ], [blank], or sequences of underscores like ___________
  const renderInlineContent = () => {
    const sourceText =
      question.contextText &&
      (question.contextText.includes('[') || question.contextText.includes('_'))
        ? question.contextText
        : question.prompt;

    const regex = /\[(?:blank_)?(\d+)\]|\[_{2,}\]|\[blank\]|_{3,}/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let blankCounter = 0;

    while ((match = regex.exec(sourceText)) !== null) {
      blankCounter++;
      const precedingText = sourceText.substring(lastIndex, match.index);
      if (precedingText) {
        parts.push(<span key={`text-${lastIndex}`}>{precedingText}</span>);
      }

      const blankIdNum = match[1] ? parseInt(match[1], 10) : blankCounter;
      const blankOptions =
        optionsByBlank.get(blankIdNum) || optionsByBlank.get(1) || question.options || [];
      const currentChoice = value[String(blankIdNum)] || '';

      parts.push(
        <span key={`blank-${blankIdNum}-${lastIndex}`} className="inline-block mx-1.5 my-1">
          <select
            value={currentChoice}
            onChange={(e) => handleSelectChange(blankIdNum, e.target.value)}
            className={`inline-block text-sm font-semibold py-1 px-3 rounded-btn border bg-paper-card text-ink shadow-2xs transition-colors ${
              currentChoice
                ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent'
                : 'border-rule hover:border-rule-strong'
            }`}
          >
            <option value="" disabled>
              (seleccionar)
            </option>
            {blankOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.content}
              </option>
            ))}
          </select>
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    const trailingText = sourceText.substring(lastIndex);
    if (trailingText) {
      parts.push(<span key={`text-end`}>{trailingText}</span>);
    }

    // Fallback if no blanks were matched at all
    if (blankCounter === 0) {
      const defaultOptions = optionsByBlank.get(1) || question.options || [];
      parts.push(
        <span key="blank-fallback" className="inline-block mx-1.5 my-1">
          <select
            value={value['1'] || ''}
            onChange={(e) => handleSelectChange(1, e.target.value)}
            className="inline-block text-sm font-semibold py-1 px-3 rounded-btn border border-rule bg-paper-card text-ink shadow-2xs"
          >
            <option value="" disabled>
              (seleccionar)
            </option>
            {defaultOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.content}
              </option>
            ))}
          </select>
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="space-y-4">
      {/* Short Context if provided */}
      {question.contextText && (
        <div className="p-3 bg-paper-muted border-l-2 border-accent text-sm text-ink-muted leading-relaxed rounded-r-card">
          <p className="italic">{question.contextText}</p>
        </div>
      )}

      {/* Inline Dropdown Sentence Flow */}
      <div className="p-4 bg-paper-card border border-rule rounded-card text-base text-ink leading-loose">
        {renderInlineContent()}
      </div>

      <p className="text-xs text-ink-muted">
        Selecciona la opción correcta en cada uno de los menús desplegables incrustados en la oración.
      </p>
    </div>
  );
};
