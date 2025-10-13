import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CARET_HEIGHT = 30;
const CARET_TOP_OFFSET = 5;

interface TypingPanelProps {
  textToType: string;
  onComplete: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  sentenceIndex?: number;
  totalSentences?: number;
}

const sanitizeSpecialSymbols = (value: string) => {
  if (!value) return "";

  const replacements: Array<[RegExp, string]> = [
    [/\u2018|\u2019|\u201A|\u201B|\u2032|\u2035/g, "'"],
    [/\u201C|\u201D|\u201E|\u201F|\u2033|\u2036/g, '"'],
    [/\u2010|\u2011|\u2012|\u2013|\u2014|\u2015|\u2212/g, "-"],
    [/\u2026/g, "..."],
    [/\u2022|\u2023|\u2043|\u2219|\u00B7/g, "-"],
    [/\u2044/g, "/"],
    [/\u02C6/g, "^"],
    [/\u02DC/g, "~"],
    [/\u00B0/g, "deg"],
    [/\u00A9/g, "(c)"],
    [/\u00AE/g, "(r)"],
    [/\u2122/g, "TM"],
    [/\u00A0|[\u2000-\u200B]|\u202F|\u205F|\u3000/g, " "],
  ];

  return replacements.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value
  );
};

const normalizeForComparison = (value: string) =>
  sanitizeSpecialSymbols(value)
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const TypingPanel = ({
  textToType,
  onComplete,
  onNext,
  onPrevious,
  sentenceIndex,
  totalSentences,
}: TypingPanelProps) => {
  const [typed, setTyped] = useState("");
  const [caretPos, setCaretPos] = useState(0);
  const [showCompletionHint, setShowCompletionHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTyped("");
    setCaretPos(0);
    setShowCompletionHint(false);
    inputRef.current?.focus();
  }, [textToType]);

  const sanitizedTarget = useMemo(
    () => sanitizeSpecialSymbols(textToType),
    [textToType]
  );
  const normalizedTarget = useMemo(
    () => normalizeForComparison(textToType),
    [textToType]
  );
  const normalizedTyped = useMemo(
    () => normalizeForComparison(typed),
    [typed]
  );
  const progressLabel =
    typeof sentenceIndex === "number" && typeof totalSentences === "number"
      ? `${Math.min(sentenceIndex + 1, totalSentences)} / ${totalSentences}`
      : null;
  const characters = useMemo(
    () => sanitizedTarget.split(""),
    [sanitizedTarget]
  );
  const hasCompleted =
    normalizedTarget.length > 0 &&
    normalizedTyped.length === normalizedTarget.length &&
    normalizedTyped === normalizedTarget;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const caret = caretRef.current;
    if (!container || !caret) return;

    const computed = window.getComputedStyle(container);
    const fallbackLineHeight =
      parseFloat(computed.lineHeight) ||
      parseFloat(computed.fontSize) * 1.1 ||
      24;
    const containerRect = container.getBoundingClientRect();

    if (characters.length === 0) {
      caret.style.left = "0px";
      caret.style.top = `${CARET_TOP_OFFSET}px`;
      caret.style.height = `${CARET_HEIGHT}px`;
      return;
    }

    const getRectForIndex = (index: number): DOMRect | null => {
      if (index < 0 || index >= characters.length) return null;
      const element = container.querySelector<HTMLElement>(
        `[data-char-index="${index}"]`
      );
      return element ? element.getBoundingClientRect() : null;
    };

    const clamp = (value: number, min: number, max: number) => {
      if (max < min) return min;
      return Math.min(Math.max(value, min), max);
    };

    const applyCaret = (rect: DOMRect, alignRight = false) => {
      const left = alignRight ? rect.right : rect.left;
      caret.style.left = `${left - containerRect.left}px`;
      caret.style.top = `${rect.top - containerRect.top + CARET_TOP_OFFSET}px`;
      caret.style.height = `${CARET_HEIGHT}px`;
    };

    const targetIndex = clamp(caretPos, 0, characters.length);

    // Position before the character we still need to type
    if (targetIndex < characters.length && characters[targetIndex] !== "\n") {
      const targetRect = getRectForIndex(targetIndex);
      if (targetRect) {
        applyCaret(targetRect);
        return;
      }
    }

    // Handle newline: seek the next printable character on the new line
    if (targetIndex < characters.length && characters[targetIndex] === "\n") {
      for (let i = targetIndex + 1; i < characters.length; i++) {
        if (characters[i] !== "\n") {
          const nextRect = getRectForIndex(i);
          if (nextRect) {
            applyCaret(nextRect);
            return;
          }
        }
      }
    }

    // Otherwise, align to the end of the previous character
    const previousIndex = clamp(targetIndex - 1, 0, characters.length - 1);
    const previousRect = getRectForIndex(previousIndex);
    if (previousRect) {
      if (characters[previousIndex] === "\n") {
        const prevPrintableRect = getRectForIndex(previousIndex - 1);
        const topBase = prevPrintableRect
          ? prevPrintableRect.bottom - containerRect.top
          : previousRect.top - containerRect.top + fallbackLineHeight;
        caret.style.left = "0px";
        caret.style.top = `${topBase + CARET_TOP_OFFSET}px`;
        caret.style.height = `${CARET_HEIGHT}px`;
        return;
      }
      applyCaret(previousRect, true);
      return;
    }

    caret.style.left = "0px";
    caret.style.top = `${CARET_TOP_OFFSET}px`;
    caret.style.height = `${CARET_HEIGHT}px`;
  }, [caretPos, characters, sanitizedTarget]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const sanitizedNewValue = sanitizeSpecialSymbols(rawValue);

    if (sanitizedNewValue.length > sanitizedTarget.length) return;

    setTyped(sanitizedNewValue);
    setCaretPos(sanitizedNewValue.length);
  };

  const handlePreviousClick = useCallback(() => {
    if (!onPrevious) return;
    setTyped("");
    setCaretPos(0);
    setShowCompletionHint(false);
    onPrevious();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [onPrevious]);

  const handleNextClick = useCallback(() => {
    if (!onNext) return;
    setTyped("");
    setCaretPos(0);
    setShowCompletionHint(false);
    onNext();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [onNext]);

  useEffect(() => {
    setShowCompletionHint(hasCompleted);
  }, [hasCompleted]);

  useEffect(() => {
    if (!hasCompleted) {
      return;
    }

    const handleEnter = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        setShowCompletionHint(false);
        onComplete();
      }
    };

    window.addEventListener("keydown", handleEnter, true);

    return () => {
      window.removeEventListener("keydown", handleEnter, true);
    };
  }, [hasCompleted, onComplete]);

  return (
    <div
      className="relative p-6 bg-gray-800 rounded-lg font-mono text-2xl leading-relaxed text-left"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        value={typed}
        onChange={handleChange}
        className="absolute inset-0 opacity-0"
        autoFocus
      />
      <div
        ref={containerRef}
        className="relative whitespace-pre-wrap select-none"
      >
        {characters.map((char, index) => {
          const typedChar = typed[index];
          const isTyped = index < typed.length;
          const isCorrect = typedChar === char;
          const baseCharClass =
            char === "\n" ? "block w-full h-0" : "inline-block";
          const displayChar =
            char === " " ? "\u00A0" : char === "\n" ? "\u200B" : char;

          return (
            <span
              key={index}
              data-char-index={index}
              className={`char ${baseCharClass} ${
                isTyped
                  ? isCorrect
                    ? "text-white"
                    : "text-red-400"
                  : "text-gray-500"
              }`}
            >
              {displayChar}
            </span>
          );
        })}

        <div
          ref={caretRef}
          className="typing-panel-caret absolute w-[3px] rounded bg-amber-400 transition-all duration-75"
          style={{ left: 0, top: CARET_TOP_OFFSET, height: CARET_HEIGHT }}
        />
      </div>
      {showCompletionHint && (
        <p className="mt-3 text-base text-amber-300 font-medium">
          Perfect! Press Enter to jump to the next sentence.
        </p>
      )}
      {(onPrevious || onNext || progressLabel) && (
        <div className="absolute -bottom-14 left-1/2 flex -translate-x-1/2 items-center gap-4 text-base text-muted-foreground">
          <button
            type="button"
            onClick={handlePreviousClick}
            disabled={!onPrevious}
            className="rounded-full border border-border px-3 py-1 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            &lt;
          </button>
          {progressLabel && <span>{progressLabel}</span>}
          <button
            type="button"
            onClick={handleNextClick}
            disabled={!onNext}
            className="rounded-full border border-border px-3 py-1 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};
