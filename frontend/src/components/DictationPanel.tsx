import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Mic,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { PronunciationWord } from "./PronunciationWord";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DictationPanelProps {
  currentSentence: string;
  sentenceIndex: number;
  totalSentences: number;
  translation?: string;
  fallbackTranslation?: string;
  isTranslationLoading?: boolean;
  translationError?: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onCheck: (userInput: string) => void;
  onPlaySentence: () => void;
  dictationMode: number;
  repeatCount: number;
  onRepeatCountChange: (value: number) => void;
}

export const DictationPanel = ({
  currentSentence,
  sentenceIndex,
  totalSentences,
  translation,
  fallbackTranslation,
  isTranslationLoading = false,
  translationError = null,
  onNext,
  onPrevious,
  onCheck,
  onPlaySentence,
  dictationMode,
  repeatCount,
  onRepeatCountChange,
}: DictationPanelProps) => {
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect" | "partial";
    message: string;
    accuracy: number;
    breakdown: Array<{
      expected: string;
      maskedExpected: string;
      user?: string | null;
      status: "correct" | "incorrect" | "missing";
    }>;
    extraWords: Array<{ word: string; masked: string }>;
  } | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setUserInput("");
    setFeedback(null);
    setAwaitingConfirm(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentSentence]);

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
      [/[\u200C-\u200D]|\uFEFF/g, ""],
      [/♪/g, ""],
    ];

    return replacements.reduce(
      (text, [pattern, replacement]) => text.replace(pattern, replacement),
      value
    );
  };

  const normalizeWord = (word: string | null | undefined) => {
    if (!word) return "";
    return sanitizeSpecialSymbols(word)
      .toLowerCase()
      .replace(/[-.,!?;:'"()[\]{}]/g, "")
      .trim();
  };

  const maskWord = (word: string) => "*".repeat(word.length || 1);

  const handleCheck = () => {
    const sanitizedInput = sanitizeSpecialSymbols(userInput);
    const trimmedInput = sanitizedInput.trim();
    const sanitizedSentence = sanitizeSpecialSymbols(currentSentence);
    const expectedNormalized = sanitizedSentence.trim();

    if (awaitingConfirm && trimmedInput === expectedNormalized) {
      handleNextSentence();
      return;
    }

    if (!trimmedInput) {
      return;
    }

    const expectedWords = sanitizedSentence.trim().split(/\s+/).filter(Boolean);
    const inputWords = sanitizedInput.trim().split(/\s+/).filter(Boolean);

    let correctCount = 0;

    const breakdown = expectedWords.map((expectedWord, index) => {
      const userWord = inputWords[index] ?? null;
      const maskedExpected = maskWord(expectedWord);
      const normalizedExpected = normalizeWord(expectedWord);
      const normalizedInput = normalizeWord(userWord);

      if (!userWord) {
        return {
          expected: expectedWord,
          maskedExpected,
          user: null,
          status: "missing" as const,
        };
      }

      if (normalizedExpected === normalizedInput) {
        correctCount += 1;
        return {
          expected: expectedWord,
          maskedExpected,
          user: userWord,
          status: "correct" as const,
        };
      }

      return {
        expected: expectedWord,
        maskedExpected,
        user: userWord,
        status: "incorrect" as const,
      };
    });

    const extraWords = inputWords.slice(expectedWords.length).map((word) => ({
      word,
      masked: maskWord(word),
    }));

    const accuracy = expectedWords.length
      ? Math.round((correctCount / expectedWords.length) * 100)
      : 0;

    const isPerfect =
      accuracy === 100 &&
      extraWords.length === 0 &&
      breakdown.every((item) => item.status === "correct");

    const hasAnyCorrect = breakdown.some((item) => item.status === "correct");

    setFeedback({
      type: isPerfect ? "correct" : hasAnyCorrect ? "partial" : "incorrect",
      message: isPerfect
        ? awaitingConfirm
          ? "✔ Chính xác! Tuyệt vời!"
          : "✔ Chính xác! Nhấn Enter lần nữa để sang câu mới."
        : hasAnyCorrect
        ? "Một số từ đã đúng, tiếp tục chỉnh sửa nhé."
        : "Chưa chính xác, hãy xem lại các từ được tô đỏ.",
      accuracy,
      breakdown,
      extraWords,
    });

    onCheck(userInput);

    if (isPerfect) {
      setAwaitingConfirm(true);
      setUserInput(currentSentence);
      return;
    }

    setAwaitingConfirm(false);
  };

  const handleNextSentence = () => {
    setUserInput("");
    setFeedback(null);
    onNext();
  };

  const handlePreviousSentence = () => {
    setUserInput("");
    setFeedback(null);
    onPrevious();
  };

  const getPronunciation = (text: string) => {
    // Tách câu thành các từ, nhưng giữ lại khoảng trắng
    const wordsAndSpaces = text.split(/(\s+)/);
    return wordsAndSpaces.map((part, idx) => {
      if (part.trim() === "") {
        // Nếu là khoảng trắng, chỉ cần render nó
        return <span key={idx}>{part}</span>;
      }
      // Nếu là một từ, render component PronunciationWord
      return <PronunciationWord key={idx} word={part} />;
    });
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-panel-bg rounded-lg">
      {/* Progress and Navigation */}
      <div className="flex items-center justify-between">
        <Button
          size="icon"
          variant="ghost"
          onClick={handlePreviousSentence}
          disabled={sentenceIndex < dictationMode}
          className="hover:bg-secondary"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="default"
            className="bg-primary hover:bg-primary/90"
            onClick={onPlaySentence}
          >
            <Play className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Repeat
            </span>
            <Select
              value={String(repeatCount)}
              onValueChange={(value) => onRepeatCountChange(Number(value))}
            >
              <SelectTrigger className="h-9 w-[88px]">
                <SelectValue placeholder="Repeat" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {sentenceIndex + 1} / {totalSentences}
          </span>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={handleNextSentence}
          disabled={sentenceIndex >= totalSentences - dictationMode}
          className="hover:bg-secondary"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Input Area */}
      <div className="flex-1 flex flex-col gap-4">
        <Textarea
          ref={textareaRef}
          placeholder="Type what you hear..."
          value={userInput}
          onChange={(e) => {
            setUserInput(sanitizeSpecialSymbols(e.target.value));
            if (feedback) {
              setFeedback(null);
            }
            if (awaitingConfirm) {
              setAwaitingConfirm(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (userInput.trim()) {
                handleCheck();
              }
            }
          }}
          className="min-h-[120px] bg-background border-input focus:border-input-focus focus:ring-input-focus resize-none text-lg"
        />

        {feedback && (
          <div className="rounded-md border border-border bg-card/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p
                className={`font-semibold ${
                  feedback.type === "correct" ? "text-correct" : "text-error"
                }`}
              >
                {feedback.message}
              </p>
              <span className="text-sm font-medium text-muted-foreground">
                Độ chính xác: {feedback.accuracy}%
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-lg">
              {feedback.breakdown.map((item, index) => {
                const isCorrect = item.status === "correct";
                const isMissing = item.status === "missing";
                const displayText = isCorrect
                  ? item.expected
                  : isMissing
                  ? item.maskedExpected
                  : item.maskedExpected;

                return (
                  <span
                    key={`${item.expected}-${index}`}
                    className={`rounded px-2 py-1 ${
                      isCorrect
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {displayText}
                    {!isCorrect && !isMissing && (
                      <span className="ml-1  italic text-red-800">
                        → {item.expected}
                      </span>
                    )}
                  </span>
                );
              })}

              {feedback.extraWords.map((extra, index) => (
                <span
                  key={`extra-${extra.word}-${index}`}
                  className="rounded bg-yellow-100 px-2 py-1 text-yellow-800"
                >
                  {extra.masked}
                  <span className="ml-1 italic text-yellow-700">(thừa)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleCheck}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Check
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setUserInput("")}
            className="hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-secondary">
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        {/* Translation */}
        {(translation ||
          fallbackTranslation ||
          isTranslationLoading ||
          translationError) && (
          <Card className="p-4 bg-secondary space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                AI Translation (vi)
              </p>
              {isTranslationLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {translationError ? (
              <div className="space-y-1">
                <p className="text-sm text-red-400">{translationError}</p>
                {fallbackTranslation && (
                  <p className="text-foreground whitespace-pre-wrap">
                    {fallbackTranslation}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-foreground whitespace-pre-wrap">
                {translation || fallbackTranslation || "Translation unavailable."}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Powered by Google Cloud Translation
            </p>
          </Card>
        )}

        {/* Pronunciation Guide */}
        {awaitingConfirm && (
          <Card className="p-4 bg-secondary">
            <p className="text-sm text-muted-foreground mb-2">Pronunciation:</p>
            <div className="text-lg leading-relaxed">
              {getPronunciation(currentSentence)}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
