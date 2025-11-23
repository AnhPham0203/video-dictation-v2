import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

interface AudioPlayerProps {
  audioUrl: string | null;
  onTimeUpdate?: (time: number) => void;
  seekTo?: { start: number; end: number | null } | null; // Allow end to be null
  onPlaybackComplete?: () => void;
  currentSegment?: { start: number; end: number | null } | null; // Allow end to be null
  onReplayRequest?: () => void;
}

export const AudioPlayer = ({
  audioUrl,
  onTimeUpdate,
  seekTo,
  onPlaybackComplete,
  currentSegment,
  onReplayRequest,
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isReady, setIsReady] = useState(false); // New state to track if audio can be played
  const segmentIntervalRef = useRef<number | null>(null);
  const lastSegmentRef = useRef<{ start: number; end: number } | null>(null);

  // Reset state when audioUrl changes
  useEffect(() => {
    setIsLoading(true);
    setIsReady(false); // Can't be ready if the source is changing
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioUrl]);

  // Play segment functionality
  const playSegment = useCallback(
    (segment: { start: number; end: number | null }) => {
      const audio = audioRef.current;
      // Do not play if the audio element is not ready
      if (!audio || !isReady) {
        console.warn("playSegment called before audio is ready.");
        return;
      }
      lastSegmentRef.current = segment;

      // Clear any existing interval
      if (segmentIntervalRef.current) {
        clearInterval(segmentIntervalRef.current);
      }

      // Seek to start
      audio.currentTime = segment.start;

      // Play audio
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });

      // If segment.end is null, it means play to the end of the track.
      // So, we only set an interval if segment.end is a valid number.
      if (typeof segment.end === "number") {
        const checkTime = window.setInterval(() => {
          if (audio.currentTime >= segment.end!) {
            audio.pause();
            clearInterval(checkTime);
            segmentIntervalRef.current = null;
            onPlaybackComplete?.();
          }
        }, 50);
        segmentIntervalRef.current = checkTime;
      }
    },
    [isReady, onPlaybackComplete]
  );

  // Handle seeking to specific timestamp
  useEffect(() => {
    // Only play segment if seekTo is defined and audio is ready to be played
    if (seekTo && audioRef.current && isReady) {
      playSegment(seekTo);
    }
  }, [seekTo, playSegment, isReady]);

  // Keyboard shortcut: Control key for replay
  useEffect(() => {
    const handleCtrlReplay = (event: KeyboardEvent) => {
      if (!currentSegment) {
        return;
      }

      if (event.key === "Control") {
        event.preventDefault();
        if (onReplayRequest) {
          onReplayRequest();
        } else if (lastSegmentRef.current) {
          playSegment(lastSegmentRef.current);
        }
      }
    };

    window.addEventListener("keydown", handleCtrlReplay);

    return () => {
      window.removeEventListener("keydown", handleCtrlReplay);
    };
  }, [currentSegment, onReplayRequest, playSegment]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (segmentIntervalRef.current) {
        clearInterval(segmentIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || !isReady) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      if (segmentIntervalRef.current) {
        clearInterval(segmentIntervalRef.current);
        segmentIntervalRef.current = null;
      }
    } else {
      if (currentSegment && !seekTo) {
        // If there's a current segment, play that segment
        playSegment(currentSegment);
      } else {
        // Otherwise, resume from current time
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) {
      return;
    }

    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Event Handlers for the <audio> element
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onPlaybackComplete?.();
  };

  return (
    <div className="relative w-full bg-video-bg rounded-lg overflow-hidden border border-border">
      {/* Use a declarative audio element, controlled by React state */}
      <audio
        ref={audioRef}
        src={audioUrl || ""}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => {
          setIsLoading(false);
          setIsReady(true);
        }}
        onError={(e) => {
          console.error("Audio element error:", e);
          setIsReady(false);
          setIsLoading(false);
        }}
        className="hidden"
      />

      {audioUrl ? (
        <div className="flex flex-col gap-4 p-6">
          {/* Audio Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              disabled={!audioUrl || isLoading || !isReady}
              className="rounded-full"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              size="lg"
              variant="default"
              onClick={togglePlay}
              disabled={!audioUrl || isLoading || !isReady}
              className="rounded-full w-16 h-16"
            >
              {isLoading ? (
                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col gap-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={!audioUrl || isLoading || !isReady}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Segment Info */}
          {currentSegment && (
            <div className="text-xs text-muted-foreground text-center">
              Segment: {formatTime(currentSegment.start)} -{" "}
              {formatTime(currentSegment.end)}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video w-full flex items-center justify-center bg-muted min-h-[200px]">
          <p className="text-muted-foreground">
            No audio available. Generate audio from text first.
          </p>
        </div>
      )}
    </div>
  );
};
