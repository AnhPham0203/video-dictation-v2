import { Card } from "@/components/ui/card";

interface TranscriptViewProps {
  sentences: Array<{ text: string; translation: string; timestamp: string }>;
  currentIndex: number;
  onSentenceClick: (index: number) => void;
}

export const TranscriptView = ({
  sentences,
  currentIndex,
  onSentenceClick,
}: TranscriptViewProps) => {
  return (
    <div className="h-full min-h-0">
      <div className="h-full overflow-y-auto pr-2 transcript-scrollbar">
        <div className="space-y-3 p-6">
          {sentences.map((sentence, index) => (
            <Card
              key={index}
              className={`cursor-pointer p-4 transition-all ${
                index === currentIndex
                  ? "border-primary bg-primary/20"
                  : "bg-card hover:bg-card/80"
              }`}
              onClick={() => onSentenceClick(index)}
            >
              <div className="flex items-start gap-3">
                <span className="min-w-[60px] font-mono text-xs text-muted-foreground">
                  {sentence.timestamp}
                </span>
                <div className="flex-1">
                  <p className="mb-2 text-foreground">{sentence.text}</p>
                  <p className="text-sm italic text-muted-foreground">
                    {sentence.translation}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
