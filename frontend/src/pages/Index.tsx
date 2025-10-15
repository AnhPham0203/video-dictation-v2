import { useState, useEffect, useRef, useCallback } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { DictationPanel } from "@/components/DictationPanel";
import { TranscriptView } from "@/components/TranscriptView";
import { TypingPanel } from "@/components/TypingPanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Link as LinkIcon, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Sentence {
  text: string;
  translation: string;
  timestamp: string;
  start: number;
  end: number;
}

interface ApiSentence {
  text: string;
  translation?: string;
  timestamp?: string;
  start: string | number;
  end?: string | number;
  duration?: string | number;
}

const SEGMENT_END_PADDING = 0.5; // Tăng khoảng đệm để ngắt sớm hơn

const getSegmentBounds = (sentence: Sentence) => {
  const adjustedEnd = Math.max(
    sentence.start,
    sentence.end - SEGMENT_END_PADDING
  );

  return {
    start: sentence.start,
    end: adjustedEnd,
  };
};

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
  const [dictationMode, setDictationMode] = useState<number>(1);
  const [isVideoCovered, setIsVideoCovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [seekTo, setSeekTo] = useState<{ start: number; end: number } | null>(
    null
  );
  const [repeatCount, setRepeatCount] = useState(3);
  const [remainingRepeats, setRemainingRepeats] = useState(0);
  const lastSegmentRef = useRef<{ start: number; end: number } | null>(null);
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
        const processedSentences = data.sentences.map(
          (sentence: ApiSentence, index: number) => {
            const startTime = Number(sentence.start) || 0;
            const startTimeInSeconds = Math.max(startTime, 0);
            const timestamp =
              sentence.timestamp ||
              new Date(startTimeInSeconds * 1000)
                .toISOString()
                .substring(11, 19);

            let endTimeInSeconds;
            const nextSentence = data.sentences[index + 1];

            if (nextSentence) {
              // Lấy thời gian bắt đầu của câu tiếp theo làm thời gian kết thúc
              endTimeInSeconds = Number(nextSentence.start);
            } else {
              // Đối với câu cuối cùng, sử dụng logic cũ hoặc cộng thêm một khoảng thời gian dài hơn
              endTimeInSeconds =
                Number(sentence.end) ||
                startTimeInSeconds + Number(sentence.duration) ||
                startTimeInSeconds + 5; // Tăng lên 5 giây cho chắc chắn
            }

            return {
              text: sentence.text,
              translation: sentence.translation || "Chưa có bản dịch",
              timestamp,
              start: startTimeInSeconds,
              end: endTimeInSeconds,
            };
          }
        );

        setSentences(processedSentences);
        setCurrentSentenceIndex(0);
        setCompletedSentences(new Set());
        toast({
          title: "Đã tải phụ đề",
          description: `Tìm thấy ${data.sentences.length} câu`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error fetching captions:", error);
      toast({
        title: "Lỗi tải phụ đề",
        description: message,
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
    const nextIndex = currentSentenceIndex + dictationMode;

    if (dictationMode === 2 && nextIndex >= sentences.length) {
      setCurrentSentenceIndex(sentences.length - 1);
      playCurrentSentence(sentences.length - 1);
      return;
    }

    if (nextIndex < sentences.length) {
      setCurrentSentenceIndex(nextIndex);
      playCurrentSentence(nextIndex);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentSentenceIndex - dictationMode;
    if (prevIndex >= 0) {
      setCurrentSentenceIndex(prevIndex);
      playCurrentSentence(prevIndex);
    }
  };

  const handleCheck = (userInput: string) => {
    if (userInput.trim()) {
      setCompletedSentences((previouslyCompleted) => {
        const newCompleted = new Set(previouslyCompleted);
        newCompleted.add(currentSentenceIndex);
        if (
          dictationMode === 2 &&
          currentSentenceIndex + 1 < sentences.length
        ) {
          newCompleted.add(currentSentenceIndex + 1);
        }
        return newCompleted;
      });
    }
  };

  const handleSentenceClick = (index: number) => {
    setCurrentSentenceIndex(index);
    setCurrentTab("dictation");
    playCurrentSentence(index);
  };

  const playCurrentSentence = (index?: number) => {
    const sentenceIndex = index !== undefined ? index : currentSentenceIndex;
    const sentence1 = sentences[sentenceIndex];
    if (!sentence1) return;

    const sentence2 =
      dictationMode === 2 && sentenceIndex + 1 < sentences.length
        ? sentences[sentenceIndex + 1]
        : null;

    const segmentEnd = sentence2 ? sentence2.end : sentence1.end;

    const segment = {
      start: sentence1.start,
      end: Math.max(sentence1.start, segmentEnd - SEGMENT_END_PADDING),
    };

    lastSegmentRef.current = segment;
    setRemainingRepeats(Math.max(repeatCount - 1, 0));
    setSeekTo(segment);
  };

  const handlePlaybackComplete = useCallback(() => {
    if (remainingRepeats > 0 && lastSegmentRef.current) {
      setRemainingRepeats((prev) => Math.max(prev - 1, 0));
      setSeekTo({ ...lastSegmentRef.current });
    } else {
      setSeekTo(null);
      setRemainingRepeats(0);
    }
  }, [remainingRepeats]);

  const progressPercentage =
    sentences.length > 0
      ? (completedSentences.size / sentences.length) * 100
      : 0;

  const currentSentenceData = sentences[currentSentenceIndex];
  const nextSentenceData =
    dictationMode === 2 && currentSentenceIndex + 1 < sentences.length
      ? sentences[currentSentenceIndex + 1]
      : null;

  const dictationText =
    currentSentenceData && nextSentenceData
      ? `${currentSentenceData.text} ${nextSentenceData.text}`
      : currentSentenceData?.text || "";

  const dictationTranslation =
    currentSentenceData && nextSentenceData
      ? `${currentSentenceData.translation}\n${nextSentenceData.translation}`
      : currentSentenceData?.translation || "";

  const dictationSegment = currentSentenceData
    ? {
        start: currentSentenceData.start,
        end: nextSentenceData ? nextSentenceData.end : currentSentenceData.end,
      }
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">
                VideoDictation
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
          <div className="relative flex flex-col gap-4">
            <VideoPlayer
              videoUrl={videoUrl}
              seekTo={seekTo}
              onPlaybackComplete={handlePlaybackComplete}
              currentSegment={dictationSegment}
              onReplayRequest={() => playCurrentSentence()}
            />
            <div
              className={`absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center transition-opacity ${
                isVideoCovered ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <p className="text-muted-foreground">Video is covered</p>
            </div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TabsList className="bg-card border border-border">
                    <TabsTrigger
                      value="dictation"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Dictation
                    </TabsTrigger>
                    <TabsTrigger
                      value="typing"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Typing
                    </TabsTrigger>
                    <TabsTrigger
                      value="transcript"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Full Transcript
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsVideoCovered(!isVideoCovered)}
                    className="border"
                  >
                    {isVideoCovered ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <ToggleGroup
                  type="single"
                  value={String(dictationMode)}
                  onValueChange={(value) => {
                    if (value) setDictationMode(Number(value));
                  }}
                  className="bg-card p-1 rounded-md border"
                >
                  <ToggleGroupItem
                    value="1"
                    className="px-3 py-1 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    1 Sentence
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="2"
                    className="px-3 py-1 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    2 Sentences
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <TabsContent value="dictation" className="flex-1 mt-4">
                {sentences.length > 0 ? (
                  <DictationPanel
                    currentSentence={dictationText}
                    sentenceIndex={currentSentenceIndex}
                    totalSentences={sentences.length}
                    translation={dictationTranslation}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onCheck={handleCheck}
                    onPlaySentence={() => playCurrentSentence()}
                    dictationMode={dictationMode}
                    repeatCount={repeatCount}
                    onRepeatCountChange={(value) => setRepeatCount(Math.max(1, value))}
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

              <TabsContent value="typing" className="flex-1 mt-4">
                {sentences.length > 0 ? (
                  <TypingPanel
                    textToType={dictationText}
                    onComplete={handleNext}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    sentenceIndex={currentSentenceIndex}
                    totalSentences={sentences.length}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      Load a YouTube video to start typing practice
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
