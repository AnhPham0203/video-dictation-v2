import { ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PlainTranscriptProps {
  sentences: Array<{ text: string; translation: string; timestamp: string }>;
  currentIndex: number;
}

export const PlainTranscript = ({
  sentences,
  currentIndex,
}: PlainTranscriptProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary/10 px-4 py-3 border-b border-border">
        <h3 className="text-base font-semibold">Plain Transcript</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 max-h-[200px] overflow-y-auto text-sm text-muted-foreground leading-relaxed transcript-scrollbar">
          {sentences.length > 0 ? (
            sentences.map((sentence, index) => (
              <p key={index} className="mb-2 last:mb-0">
                {sentence.text}
              </p>
            ))
          ) : (
            <span className="italic">Load a video to see the transcript</span>
          )}
        </div>
      )}
    </div>
  );
};
