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

  const getLanguageFlag = (language: VideoSuggestion["language"]) => {
    switch (language) {
      case "English":
        return "🇬🇧";
      case "Japanese":
        return "🇯🇵";
      case "Korean":
        return "🇰🇷";
      case "Spanish":
        return "🇪🇸";
      default:
        return "🌐";
    }
  };

  // Group videos by language
  const englishVideos = videoSuggestions.filter(
    (v) => v.language === "English"
  );
  const japaneseVideos = videoSuggestions.filter(
    (v) => v.language === "Japanese"
  );
  const otherVideos = videoSuggestions.filter(
    (v) => v.language !== "English" && v.language !== "Japanese"
  );

  const renderVideoGrid = (videos: VideoSuggestion[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
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

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="outline" className="text-sm">
                {getLanguageFlag(video.language)} {video.language}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Suggested Videos</h2>
        <Badge variant="outline" className="ml-auto">
          {videoSuggestions.length} videos
        </Badge>
      </div>

      {/* English Videos Section */}
      {englishVideos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇬🇧</span>
            <h3 className="text-lg font-semibold">English Videos</h3>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              {englishVideos.length} videos
            </Badge>
          </div>
          {renderVideoGrid(englishVideos)}
        </div>
      )}

      {/* Japanese Videos Section */}
      {japaneseVideos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇯🇵</span>
            <h3 className="text-lg font-semibold">Japanese Videos</h3>
            <Badge variant="secondary" className="bg-red-500/20 text-red-400">
              {japaneseVideos.length} videos
            </Badge>
          </div>
          {renderVideoGrid(japaneseVideos)}
        </div>
      )}

      {/* Other Languages Section */}
      {otherVideos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌐</span>
            <h3 className="text-lg font-semibold">Other Languages</h3>
            <Badge
              variant="secondary"
              className="bg-purple-500/20 text-purple-400"
            >
              {otherVideos.length} videos
            </Badge>
          </div>
          {renderVideoGrid(otherVideos)}
        </div>
      )}

      {/* Empty state */}
      {videoSuggestions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No suggested videos available</p>
        </div>
      )}
    </div>
  );
};
