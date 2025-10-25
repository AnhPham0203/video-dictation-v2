import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, TrendingUp } from "lucide-react";
import { videoSuggestions, VideoSuggestion } from "@/data/videoSuggestions";

interface SuggestedVideosProps {
  onVideoSelect: (videoId: string) => void;
  isLoading?: boolean;
}

export const SuggestedVideos = ({
  onVideoSelect,
  isLoading = false,
}: SuggestedVideosProps) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const handleVideoClick = (video: VideoSuggestion) => {
    setSelectedVideoId(video.id);
    onVideoSelect(video.id);
  };

  const getLevelColor = (level: VideoSuggestion["level"]) => {
    switch (level) {
      case "Beginner":
        return "bg-green-500/20 text-green-400 hover:bg-green-500/30";
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30";
      case "Advanced":
        return "bg-red-500/20 text-red-400 hover:bg-red-500/30";
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Suggested Videos</h2>
        <Badge variant="outline" className="ml-auto">
          {videoSuggestions.length} videos
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videoSuggestions.map((video) => (
          <Card
            key={video.id}
            className={`group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden ${
              selectedVideoId === video.id
                ? "ring-2 ring-primary"
                : "hover:border-primary/50"
            } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => handleVideoClick(video)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="h-12 w-12 text-white" />
              </div>

              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {video.duration}
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                {video.title}
              </h3>

              <p className="text-xs text-muted-foreground line-clamp-2">
                {video.description}
              </p>

              <div className="flex items-center gap-2 pt-2">
                <Badge
                  variant="secondary"
                  className={getLevelColor(video.level)}
                >
                  {video.level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {video.category}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state (for when you want to add more videos later) */}
      {videoSuggestions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No suggested videos available</p>
        </div>
      )}
    </div>
  );
};
