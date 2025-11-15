import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, AlertCircle, RefreshCw } from "lucide-react";
import { fetchPronunciation } from "@/services/pronunciationService";

interface Phonetic {
  text: string;
  audio?: string;
}

interface Definition {
  definition: string;
  example?: string;
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

interface WordData {
  word: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
}

interface PronunciationWordProps {
  word: string;
}

export const PronunciationWord = ({ word }: PronunciationWordProps) => {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiSource, setApiSource] = useState<string>("");

  const fetchWordData = async (forceRefresh = false) => {
    if (!word.trim()) return;

    setIsLoading(true);
    setError(null);
    if (forceRefresh) {
      setWordData(null);
    }

    try {
      const data = await fetchPronunciation(word);
      setWordData(data);
      setApiSource("✅ Data loaded successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to fetch pronunciation";
      setError(errorMessage);
      setApiSource("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = (audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((e) => console.error("Lỗi phát âm thanh:", e));
    }
  };

  const ukPhonetic = wordData?.phonetics.find((p) =>
    p.audio?.includes("-uk.mp3")
  );
  const usPhonetic = wordData?.phonetics.find((p) =>
    p.audio?.includes("-us.mp3")
  );
  const generalPhonetic = wordData?.phonetics.find((p) => p.audio);

  return (
    <Popover onOpenChange={(open) => open && !wordData && fetchWordData()}>
      <PopoverTrigger asChild>
        <span className="inline-block mr-1 border-b-2 border-dotted border-gray-500 cursor-pointer hover:bg-white hover:text-black px-2 py-1 rounded-md transition-colors duration-200">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading...</span>
            </div>
          )}
          {error && (
            <div className="space-y-3">
              <div className="flex items-start text-red-500">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">{error}</p>
                  {/* <p className="text-xs text-muted-foreground mt-1">
                    Multiple APIs tried. Check console for details.
                  </p> */}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchWordData(true)}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          )}
          {wordData && (
            <div>
              <h4 className="font-bold text-lg mb-2">{wordData.word}</h4>
              <div className="flex gap-2 mb-3">
                {ukPhonetic?.audio && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayAudio(ukPhonetic.audio)}
                  >
                    UK <Volume2 className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {usPhonetic?.audio && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayAudio(usPhonetic.audio)}
                  >
                    US <Volume2 className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {!ukPhonetic?.audio &&
                  !usPhonetic?.audio &&
                  generalPhonetic?.audio && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayAudio(generalPhonetic.audio)}
                    >
                      Play <Volume2 className="h-4 w-4 ml-2" />
                    </Button>
                  )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {ukPhonetic?.text && `UK ${ukPhonetic.text}`}
                  {ukPhonetic?.text && usPhonetic?.text && " / "}
                  {usPhonetic?.text && `US ${usPhonetic.text}`}
                  {!ukPhonetic?.text &&
                    !usPhonetic?.text &&
                    wordData.phonetics[0]?.text}
                </p>
              </div>
              {wordData.meanings[0]?.definitions[0] && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-sm font-semibold">
                    {wordData.meanings[0].partOfSpeech}
                  </p>
                  <p className="text-sm">
                    {wordData.meanings[0].definitions[0].definition}
                  </p>
                  {wordData.meanings[0].definitions[0].example && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      "{wordData.meanings[0].definitions[0].example}"
                    </p>
                  )}
                </div>
              )}
              {apiSource && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {apiSource}
                </p>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
