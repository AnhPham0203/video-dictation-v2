import { useState, useEffect, useRef, useCallback } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { CustomTextInput } from "@/components/CustomTextInput";
import { DictationPanel } from "@/components/DictationPanel";
import { TypingPanel } from "@/components/TypingPanel";
import { TranscriptView } from "@/components/TranscriptView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  generateAudio,
  createSentencesFromText,
  generateAudioWithWebSpeechAPI,
  stopWebSpeechAPI,
  type TTSResponse,
} from "@/services/ttsService";
import { useNavigate } from "react-router-dom";

interface Sentence {
  text: string;
  translation?: string;
  timestamp: string;
  start: number;
  end: number;
}

const SEGMENT_END_PADDING = 0.1; // Slightly trims the end so playback doesn't stop early.

const CustomText = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentTab, setCurrentTab] = useState("dictation");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [sentenceSessionId, setSentenceSessionId] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [dictationMode, setDictationMode] = useState<number>(1);
  const [seekTo, setSeekTo] = useState<{ start: number; end: number } | null>(
    null
  );
  const [repeatCount, setRepeatCount] = useState(3);
  const [remainingRepeats, setRemainingRepeats] = useState(0);
  const [completedSentences, setCompletedSentences] = useState<Set<number>>(
    new Set()
  );
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [useWebSpeechAPI, setUseWebSpeechAPI] = useState(false);
  const lastSegmentRef = useRef<{ start: number; end: number } | null>(null);
  const { toast } = useToast();

  // Update sentences when text changes (preview only, don't generate audio yet)
  useEffect(() => {
    if (text.trim()) {
      const newSentences = createSentencesFromText(text);
      setSentences(newSentences);
      // Reset to first sentence
      if (newSentences.length > 0) {
        setCurrentSentenceIndex(0);
        setSentenceSessionId((prev) => prev + 1);
        setCompletedSentences(new Set());
      }
    } else {
      setSentences([]);
      setCurrentSentenceIndex(0);
      setAudioUrl(null);
    }
  }, [text]);

  // Generate audio from text
  const handleGenerateAudio = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(true);
    setTtsError(null);

    try {
      const response: TTSResponse = await generateAudio(text);

      if (response.success && response.audio) {
        setAudioUrl(response.audio);
        toast({
          title: "Success",
          description: "Audio generated successfully",
        });
      } else if (response.error === "TTS_API_KEY_NOT_CONFIGURED") {
        // Offer Web Speech API as fallback
        setTtsError(response.message || "TTS API key not configured");
        toast({
          title: "TTS API Not Available",
          description:
            "OpenAI API key is not configured. You can use Web Speech API as a free alternative.",
          variant: "destructive",
        });
      } else {
        const errorMessage = response.message || "Failed to generate audio";
        setTtsError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate audio";
      setTtsError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Use Web Speech API as fallback
  const handleUseWebSpeechAPI = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text first",
        variant: "destructive",
      });
      return;
    }

    setUseWebSpeechAPI(true);
    setTtsError(null);

    // For Web Speech API, we can't get an audio URL
    // Instead, we'll play it directly when needed
    toast({
      title: "Web Speech API Enabled",
      description:
        "Using browser's built-in text-to-speech. Audio will play directly.",
    });
  };

  const handleNext = () => {
    const nextIndex = currentSentenceIndex + dictationMode;
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

    // If using Web Speech API, play the sentence directly
    if (useWebSpeechAPI && !audioUrl) {
      const textToPlay =
        sentence1.text + (sentence2 ? " " + sentence2.text : "");
      stopWebSpeechAPI();
      generateAudioWithWebSpeechAPI(textToPlay).catch((error) => {
        console.error("Web Speech API error:", error);
        toast({
          title: "Error",
          description: "Failed to play audio with Web Speech API",
          variant: "destructive",
        });
      });
    }
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

  const dictationSegment = currentSentenceData
    ? {
        start: currentSentenceData.start,
        end:
          dictationMode === 2 && nextSentenceData
            ? nextSentenceData.end - SEGMENT_END_PADDING
            : currentSentenceData.end - SEGMENT_END_PADDING,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-secondary"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Custom Text Dictation</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your text and practice dictation with AI-generated audio
                </p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Text Input + Audio Player */}
          <div className="relative flex flex-col gap-4">
            {/* Custom Text Input */}
            <CustomTextInput
              text={text}
              onTextChange={setText}
              onGenerateAudio={handleGenerateAudio}
              isGenerating={isGeneratingAudio}
            />

            {/* TTS Error / Web Speech API Option */}
            {ttsError && !audioUrl && (
              <div className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                  {ttsError}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseWebSpeechAPI}
                  className="w-full"
                >
                  Use Web Speech API (Free Alternative)
                </Button>
              </div>
            )}

            {/* Audio Player */}
            <div>
              <h3 className="text-base font-semibold mb-2">Audio Player</h3>
              <AudioPlayer
                audioUrl={audioUrl}
                seekTo={seekTo}
                onPlaybackComplete={handlePlaybackComplete}
                currentSegment={dictationSegment}
                onReplayRequest={() => playCurrentSentence()}
              />
            </div>
          </div>

          {/* Right: Dictation/Typing Panel */}
          <div className="flex flex-col min-h-0">
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-4">
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

              <TabsContent value="dictation" className="mt-4 lg:flex-1">
                {sentences.length > 0 ? (
                  <DictationPanel
                    currentSentence={dictationText}
                    sentenceIndex={currentSentenceIndex}
                    totalSentences={sentences.length}
                    sentenceSessionId={sentenceSessionId}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onCheck={handleCheck}
                    onPlaySentence={() => playCurrentSentence()}
                    dictationMode={dictationMode}
                    repeatCount={repeatCount}
                    onRepeatCountChange={(value) =>
                      setRepeatCount(Math.max(1, value))
                    }
                  />
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <p className="text-muted-foreground">
                      Enter text and generate audio to start dictation
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="transcript"
                className="mt-4 h-[calc(100%-80px)] data-[state=active]:flex data-[state=active]:flex-col"
              >
                {sentences.length > 0 ? (
                  <TranscriptView
                    sentences={sentences}
                    currentIndex={currentSentenceIndex}
                    onSentenceClick={handleSentenceClick}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No transcript available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="typing" className="mt-4 lg:flex-1">
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
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <p className="text-muted-foreground">
                      Enter text and generate audio to start typing practice
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

export default CustomText;

