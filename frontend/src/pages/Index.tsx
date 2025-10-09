import { useState, useEffect } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { DictationPanel } from "@/components/DictationPanel";
import { TranscriptView } from "@/components/TranscriptView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Sentence {
  text: string;
  translation: string;
  timestamp: string;
  start: number;
  end: number;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Index = () => {
  const [videoUrl, setVideoUrl] = useState(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  );
  const [inputUrl, setInputUrl] = useState("");
  const [currentTab, setCurrentTab] = useState("dictation");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [seekTo, setSeekTo] = useState<{ start: number; end: number } | null>(
    null
  );
  const [completedSentences, setCompletedSentences] = useState<Set<number>>(
    new Set()
  );
  const { toast } = useToast();

  const getYouTubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const fetchCaptions = async (videoId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/captions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        throw new Error(`Yêu cầu thất bại với mã ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      if (data.error) {
        toast({
          title: "Không tìm thấy phụ đề",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data.sentences && data.sentences.length > 0) {
        const sentencesWithFallback = data.sentences.map((sentence: any) => {
          const startTime = Number(sentence.start) || 0;
          const startTimeInSeconds = Math.max(startTime, 0);
          const timestamp =
            sentence.timestamp ||
            new Date(startTimeInSeconds * 1000).toISOString().substring(11, 19);

          return {
            text: sentence.text,
            translation: sentence.translation || "Chưa có bản dịch",
            timestamp,
            start: startTimeInSeconds,
            end:
              Number(sentence.end) ||
              startTimeInSeconds + Number(sentence.duration) ||
              startTimeInSeconds + 3,
          };
        });

        setSentences(sentencesWithFallback);
        setCurrentSentenceIndex(0);
        setCompletedSentences(new Set());
        toast({
          title: "Đã tải phụ đề",
          description: `Tìm thấy ${data.sentences.length} câu`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching captions:", error);
      toast({
        title: "Lỗi tải phụ đề",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadVideo = async () => {
    if (inputUrl.trim()) {
      const videoId = getYouTubeId(inputUrl);
      if (videoId) {
        setVideoUrl(inputUrl);
        await fetchCaptions(videoId);
      } else {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid YouTube URL",
          variant: "destructive",
        });
      }
    }
  };

  const handleNext = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      const nextIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIndex);
      playCurrentSentence(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentSentenceIndex > 0) {
      const prevIndex = currentSentenceIndex - 1;
      setCurrentSentenceIndex(prevIndex);
      playCurrentSentence(prevIndex);
    }
  };

  const handleCheck = (userInput: string) => {
    if (userInput.trim()) {
      setCompletedSentences((previouslyCompleted) =>
        new Set(previouslyCompleted).add(currentSentenceIndex)
      );
    }
  };

  const handleSentenceClick = (index: number) => {
    setCurrentSentenceIndex(index);
    setCurrentTab("dictation");
    playCurrentSentence(index);
  };

  const playCurrentSentence = (index?: number) => {
    const sentenceIndex = index !== undefined ? index : currentSentenceIndex;
    if (sentences[sentenceIndex]) {
      setSeekTo({
        start: sentences[sentenceIndex].start,
        end: sentences[sentenceIndex].end,
      });
    }
  };

  const progressPercentage =
    sentences.length > 0
      ? (completedSentences.size / sentences.length) * 100
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">
                DailyDictation
              </h1>
              <div className="flex-1 flex gap-2 max-w-2xl">
                <Input
                  placeholder="Paste YouTube URL here..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLoadVideo()}
                  className="bg-background border-input"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleLoadVideo}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4 mr-2" />
                  )}
                  Load
                </Button>
              </div>
            </div>
            {sentences.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground min-w-fit">
                  Progress: {completedSentences.size}/{sentences.length}
                </span>
                <Progress
                  value={progressPercentage}
                  className="flex-1 max-w-md"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Left: Video Player */}
          <div className="flex flex-col gap-4">
            <VideoPlayer
              videoUrl={videoUrl}
              seekTo={seekTo}
              onPlaybackComplete={() => setSeekTo(null)}
              currentSegment={
                sentences[currentSentenceIndex]
                  ? {
                      start: sentences[currentSentenceIndex].start,
                      end: sentences[currentSentenceIndex].end,
                    }
                  : null
              }
            />
            {/* {sentences.length > 0 && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <h2 className="text-lg font-semibold mb-2">
                  {sentences[currentSentenceIndex]?.text}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sentence {currentSentenceIndex + 1} of {sentences.length}
                </p>
              </div>
            )} */}
          </div>

          {/* Right: Dictation/Transcript Panel */}
          <div className="flex flex-col">
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="flex-1 flex flex-col"
            >
              <TabsList className="bg-card border border-border">
                <TabsTrigger
                  value="dictation"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Dictation
                </TabsTrigger>
                <TabsTrigger
                  value="transcript"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Full Transcript
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dictation" className="flex-1 mt-4">
                {sentences.length > 0 ? (
                  <DictationPanel
                    currentSentence={sentences[currentSentenceIndex].text}
                    sentenceIndex={currentSentenceIndex}
                    totalSentences={sentences.length}
                    translation={sentences[currentSentenceIndex].translation}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onCheck={handleCheck}
                    onPlaySentence={() => playCurrentSentence()}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      Load a YouTube video to start dictation
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transcript" className="flex-1 mt-4">
                <TranscriptView
                  sentences={sentences}
                  currentIndex={currentSentenceIndex}
                  onSentenceClick={handleSentenceClick}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
