import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (time: number) => void;
  seekTo?: { start: number; end: number } | null;
  onPlaybackComplete?: () => void;
  currentSegment?: { start: number; end: number } | null;
}

export const VideoPlayer = ({
  videoUrl,
  onTimeUpdate,
  seekTo,
  onPlaybackComplete,
  currentSegment,
}: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  const playSegment = useCallback(
    (segment: { start: number; end: number }) => {
      if (!segment || !playerRef.current || !playerRef.current.seekTo) {
        return;
      }

      playerRef.current.seekTo(segment.start, true);
      playerRef.current.playVideo();

      const checkTime = window.setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime >= segment.end) {
            playerRef.current.pauseVideo();
            clearInterval(checkTime);
            onPlaybackComplete?.();
          }
        }
      }, 100);

      return () => clearInterval(checkTime);
    },
    [onPlaybackComplete]
  );

  useEffect(() => {
    const handleCtrlReplay = (event: KeyboardEvent) => {
      if (!currentSegment) {
        return;
      }

      if (event.key === "Control") {
        event.preventDefault();
        playSegment(currentSegment);
      }
    };

    window.addEventListener("keydown", handleCtrlReplay);

    return () => {
      window.removeEventListener("keydown", handleCtrlReplay);
    };
  }, [currentSegment, playSegment]);

  // Load YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      if (iframeRef.current && videoId) {
        playerRef.current = new (window as any).YT.Player(iframeRef.current, {
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
      }
    };
  }, [videoId]);

  const onPlayerReady = () => {
    console.log("Player ready");
  };

  const onPlayerStateChange = (event: any) => {
    const playerState = event.data;
    setIsPlaying(playerState === 1); // 1 = playing

    if (playerState === 0 && onPlaybackComplete) {
      onPlaybackComplete();
    }
  };

  // Handle seeking to specific timestamp
  useEffect(() => {
    if (!seekTo) {
      return;
    }

    return playSegment(seekTo);
  }, [seekTo, playSegment]);

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-video-bg rounded-lg overflow-hidden">
      {videoId ? (
        <div className="aspect-video w-full">
          <iframe
            ref={iframeRef}
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video w-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Enter a valid YouTube URL</p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={togglePlay}
          className="bg-secondary/80 hover:bg-secondary backdrop-blur-sm"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
