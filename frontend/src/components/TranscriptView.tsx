import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <ScrollArea className="h-full">
      <div className="space-y-3 p-6">
        {sentences.map((sentence, index) => (
          <Card
            key={index}
            className={`p-4 cursor-pointer transition-all ${
              index === currentIndex
                ? "bg-primary/20 border-primary"
                : "bg-card hover:bg-card/80"
            }`}
            onClick={() => onSentenceClick(index)}
          >
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted-foreground font-mono min-w-[60px]">
                {sentence.timestamp}
              </span>
              <div className="flex-1">
                <p className="text-foreground mb-2">{sentence.text}</p>
                <p className="text-sm text-muted-foreground italic">
                  {sentence.translation}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
