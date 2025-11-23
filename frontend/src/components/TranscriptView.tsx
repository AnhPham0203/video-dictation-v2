import { Card } from "@/components/ui/card";

interface TranscriptViewProps {
  sentences: Array<{
    text: string;
    translation?: string; // Make translation optional
    timestamp?: string;   // Make timestamp optional
  }>;
  currentIndex: number;
  onSentenceClick: (index: number) => void;
}

export const TranscriptView = ({
  sentences,
  currentIndex,
  onSentenceClick,
}: TranscriptViewProps) => {
  return (
    <div className="flex h-full min-h-0 flex-col bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 transcript-scrollbar">
        <div className="space-y-3 py-4">
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
