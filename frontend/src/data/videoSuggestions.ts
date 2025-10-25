// Suggested videos for dictation practice
export interface VideoSuggestion {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: "News" | "Education" | "Entertainment" | "Technology" | "Business";
}

export const videoSuggestions: VideoSuggestion[] = [
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    description: "Classic song with clear English pronunciation",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    duration: "3:33",
    level: "Beginner",
    category: "Entertainment",
  },
  {
    id: "jNQXAC9IVRw",
    title: "Me at the zoo",
    description: "The first YouTube video ever - simple and short",
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg",
    duration: "0:19",
    level: "Beginner",
    category: "Entertainment",
  },
  {
    id: "9bZkp7q19f0",
    title: "PSY - Gangnam Style",
    description: "Popular K-pop song with English subtitles",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg",
    duration: "4:13",
    level: "Beginner",
    category: "Entertainment",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    description: "Global hit with clear pronunciation",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg",
    duration: "4:42",
    level: "Beginner",
    category: "Entertainment",
  },
  {
    id: "OPf0YbXqDm0",
    title: "Mark Ronson - Uptown Funk ft. Bruno Mars",
    description: "Energetic song with clear lyrics",
    thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg",
    duration: "4:30",
    level: "Intermediate",
    category: "Entertainment",
  },
  {
    id: "RgKAFK5djSk",
    title: "Wiz Khalifa - See You Again ft. Charlie Puth",
    description: "Emotional song with clear English",
    thumbnail: "https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg",
    duration: "3:49",
    level: "Intermediate",
    category: "Entertainment",
  },
];

// Filter functions for future use
export const filterByLevel = (
  videos: VideoSuggestion[],
  level: VideoSuggestion["level"]
) => videos.filter((v) => v.level === level);

export const filterByCategory = (
  videos: VideoSuggestion[],
  category: VideoSuggestion["category"]
) => videos.filter((v) => v.category === category);
