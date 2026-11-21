import AdmZip from 'adm-zip';
import { QuestionTypeEnum } from './exams.enum';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateOptionDto } from './dto/create-question.dto';

/**
 * Extracts plain text paragraphs in visual reading order from a PowerPoint slide XML string.
 */
export function extractTextFromSlideXml(xml: string): string[] {
  const paragraphs: string[] = [];
  const pRegex = /<a:p[\s>]([\s\S]*?)<\/a:p>/g;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pContent = pMatch[1];
    const tRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
    let tMatch: RegExpExecArray | null;
    let pText = '';

    while ((tMatch = tRegex.exec(pContent)) !== null) {
      pText += tMatch[1];
    }

    const cleanText = pText.trim();
    if (cleanText) {
      paragraphs.push(cleanText);
    }
  }

  return paragraphs;
}

/**
 * Parses lines of text from a slide or text block into a typed CreateQuestionDto.
 */
export function parseSlideLines(lines: string[], orderNumber: number): CreateQuestionDto {
  if (!lines || lines.length === 0) {
    const blockNumber = Math.min(6, Math.floor((orderNumber - 1) / 5) + 1);
    return {
      type: QuestionTypeEnum.ICFES_MULTIPLE_CHOICE,
      prompt: `Pregunta ${orderNumber}`,
      contextText: undefined,
      orderIndex: orderNumber,
      blockNumber,
      points: 1,
      options: [
        { content: 'Opción A', isCorrect: true },
        { content: 'Opción B', isCorrect: false },
        { content: 'Opción C', isCorrect: false },
        { content: 'Opción D', isCorrect: false },
      ],
    };
  }

  const promptLines: string[] = [];
  const optionLines: string[] = [];

  for (const line of lines) {
    const optMatch = line.match(/^(\*?[A-Da-d][\)\.\-]\s*.*)/);
    if (optMatch) {
      optionLines.push(line);
    } else {
      if (optionLines.length === 0) {
        promptLines.push(line);
      } else {
        optionLines.push(line);
      }
    }
  }

  let prompt = promptLines.join(' ').trim();
  // Remove leading numbers like "1. ", "Question 1: ", "Pregunta 1 - "
  prompt = prompt.replace(/^(?:Question|Pregunta)?\s*\d+[\.\:\-\)]\s*/i, '').trim();
  if (!prompt) {
    prompt = `Pregunta ${orderNumber}`;
  }

  const blockNumber = Math.min(6, Math.floor((orderNumber - 1) / 5) + 1);

  // 1. Check if it is ICFES Multiple Choice with options (A, B, C, D)
  if (optionLines.length >= 2) {
    const options: CreateOptionDto[] = [];

    for (const optLine of optionLines) {
      let optRaw = optLine.trim();
      let isCorrect = false;

      if (
        optRaw.startsWith('*') ||
        optRaw.endsWith('*') ||
        optRaw.toLowerCase().includes('(correct)') ||
        optRaw.toLowerCase().includes('(correcta)') ||
        optRaw.toLowerCase().includes('(v)')
      ) {
        isCorrect = true;
        optRaw = optRaw
          .replace(/^\*\s*/, '')
          .replace(/\s*\*$/, '')
          .replace(/\(correct(?:a)?\)/i, '')
          .replace(/\(v\)/i, '')
          .trim();
      }

      // Remove leading letter prefix: A), B., C -, etc.
      const cleanedContent = optRaw.replace(/^[A-Da-d][\)\.\-]\s*/, '').trim();
      if (cleanedContent) {
        options.push({
          content: cleanedContent,
          isCorrect,
        });
      }
    }

    // Default first option to correct if teacher didn't mark any with asterisk
    if (options.length > 0 && !options.some((o) => o.isCorrect)) {
      options[0].isCorrect = true;
    }

    return {
      type: QuestionTypeEnum.ICFES_MULTIPLE_CHOICE,
      prompt,
      contextText: undefined,
      points: 1,
      blockNumber,
      orderIndex: orderNumber,
      options,
    };
  }

  // 2. Check if it is Sentence Scramble (e.g. contains slashes like "yesterday / went / I / home" or keywords)
  if (
    prompt.includes('/') ||
    prompt.toLowerCase().includes('scramble') ||
    prompt.toLowerCase().includes('unscramble') ||
    prompt.toLowerCase().includes('ordenar') ||
    prompt.toLowerCase().includes('order the sentence') ||
    prompt.toLowerCase().includes('order the words')
  ) {
    let cleanPrompt = prompt
      .replace(
        /^(?:Unscramble(?: the sentence)?|Order the (?:words|sentence)|Sentence scramble|Put (?:the words )?in order|Ordenar la oraci[oó]n|Organiza(?:r)? las palabras)[\s\:\-]*/gi,
        '',
      )
      .trim();

    cleanPrompt = cleanPrompt
      .replace(
        /[\s\:\-]*(?:Unscramble|Order the (?:words|sentence)|Sentence scramble)[\s\:\-]*$/gi,
        '',
      )
      .trim();

    // Split on slashes or pipes or spaces around dashes
    const rawTokens = cleanPrompt
      .split(/[\/\|]|\s+-\s+/)
      .map((w) => w.trim())
      .filter((w) => {
        if (!w || w.length === 0) return false;
        // Strip leftover instruction phrases
        if (/^(?:order the|unscramble|scramble|ordenar|organizar)/i.test(w)) return false;
        return true;
      });

    if (rawTokens.length >= 3) {
      const options: CreateOptionDto[] = rawTokens.map((word, idx) => ({
        content: word,
        isCorrect: true,
        correctPosition: idx + 1,
      }));

      return {
        type: QuestionTypeEnum.SENTENCE_SCRAMBLE,
        prompt: 'Ordena sintácticamente las fichas para formar la oración correcta.',
        contextText: undefined,
        points: 1,
        blockNumber,
        orderIndex: orderNumber,
        options,
      };
    }
  }

  // 3. Check if Cloze / Fill in Blank (contains [option1/option2] or blanks ____)
  if (prompt.includes('[') && prompt.includes(']')) {
    // Extract inline dropdown options inside brackets: [went/go/gone]
    const bracketMatch = prompt.match(/\[(.*?)\]/);
    if (bracketMatch) {
      const choices = bracketMatch[1].split(/[\/\,]/).map((c) => c.trim()).filter(Boolean);
      const cleanPrompt = prompt.replace(/\[(.*?)\]/, '_____');
      const options: CreateOptionDto[] = choices.map((c, idx) => ({
        content: c,
        isCorrect: idx === 0, // First choice is correct by default
        blankId: 1,
      }));

      return {
        type: QuestionTypeEnum.FILL_IN_BLANK,
        prompt: cleanPrompt,
        contextText: undefined,
        points: 1,
        blockNumber,
        orderIndex: orderNumber,
        options,
      };
    }
  }

  // 4. Check if it has a Word Bank / Recuadro de Palabras (e.g. "(Palabras: a, b, c)" or "(Words: a, b, c)")
  const wordBankMatch = prompt.match(/\((?:Palabras|Words|Recuadro|Word bank|Opciones)[\s\:\-]+([^\)]+)\)/i);
  if (wordBankMatch) {
    const bankWords = wordBankMatch[1].split(/[\,\/\|]/).map((w) => w.trim()).filter(Boolean);
    if (bankWords.length > 0) {
      const options: CreateOptionDto[] = bankWords.map((word, idx) => ({
        content: word,
        isCorrect: idx === 0, // First option marked as default correct, teacher can adjust
      }));

      return {
        type: QuestionTypeEnum.SENTENCE_COMPLETION,
        prompt,
        contextText: undefined,
        points: 1,
        blockNumber,
        orderIndex: orderNumber,
        options,
      };
    }
  }

  // 5. Default: Sentence completion (text input)
  return {
    type: QuestionTypeEnum.SENTENCE_COMPLETION,
    prompt,
    contextText: undefined,
    points: 1,
    blockNumber,
    orderIndex: orderNumber,
    options: [{ content: 'Respuesta esperada', isCorrect: true }],
  };
}

/**
 * Extracts and parses a .pptx buffer into an array of CreateQuestionDto.
 */
export function parsePptxBuffer(buffer: Buffer): {
  suggestedTitle: string;
  totalQuestions: number;
  questions: CreateQuestionDto[];
} {
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries();
  const slideItems: { slideNumber: number; lines: string[] }[] = [];

  for (const entry of zipEntries) {
    const match = entry.entryName.match(/ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      const slideNumber = parseInt(match[1], 10);
      const xml = entry.getData().toString('utf8');
      const lines = extractTextFromSlideXml(xml);
      if (lines.length > 0) {
        slideItems.push({ slideNumber, lines });
      }
    }
  }

  // Sort slides sequentially (slide 1, slide 2, ..., slide 30)
  slideItems.sort((a, b) => a.slideNumber - b.slideNumber);

  // If slide 1 looks like a title slide (e.g. "MIDTERM EXAM - LEVEL 4A"), use it as suggested title
  let suggestedTitle = 'Examen Personalizado de Curso';
  let startIndex = 0;

  if (slideItems.length > 1) {
    const firstSlideText = slideItems[0].lines.join(' ').toLowerCase();
    const isTitleSlide =
      firstSlideText.includes('exam') ||
      firstSlideText.includes('midterm') ||
      firstSlideText.includes('final') ||
      firstSlideText.includes('test') ||
      firstSlideText.includes('cambridge') ||
      firstSlideText.includes('evaluaci');

    if (isTitleSlide && !slideItems[0].lines.some((l) => l.match(/^[A-Da-d][\)\.\-]/))) {
      suggestedTitle = slideItems[0].lines[0];
      startIndex = 1; // Start questions from slide 2
    }
  }

  const questions: CreateQuestionDto[] = [];
  const questionSlides = slideItems.slice(startIndex);

  for (let i = 0; i < questionSlides.length; i++) {
    const q = parseSlideLines(questionSlides[i].lines, i + 1);
    questions.push(q);
  }

  return {
    suggestedTitle,
    totalQuestions: questions.length,
    questions,
  };
}

/**
 * Parses raw text (e.g. pasted from PPT notes or documents) into CreateQuestionDto array.
 */
export function parseRawTextToQuestions(text: string): {
  suggestedTitle: string;
  totalQuestions: number;
  questions: CreateQuestionDto[];
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      suggestedTitle: 'Examen Personalizado',
      totalQuestions: 0,
      questions: [],
    };
  }

  // Split by double line break or question headers like "1.", "Pregunta 1", "Question 1"
  const rawBlocks = trimmed
    .split(/\n\s*\n|(?=(?:^|\n)\s*(?:Pregunta|Question|\d+)[\.\:\-\)])/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const questions: CreateQuestionDto[] = [];
  let order = 1;

  for (const block of rawBlocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 0) {
      questions.push(parseSlideLines(lines, order));
      order++;
    }
  }

  return {
    suggestedTitle: 'Examen Importado desde Diapositivas',
    totalQuestions: questions.length,
    questions,
  };
}
