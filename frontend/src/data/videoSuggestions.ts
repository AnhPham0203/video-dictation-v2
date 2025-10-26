// Suggested videos for dictation practice
export interface VideoSuggestion {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  language: "English" | "Japanese" | "Korean" | "Spanish";
}

export const videoSuggestions: VideoSuggestion[] = [
  // ========== ENGLISH VIDEOS ==========
  {
    id: "BF3bXji-J7I",
    title: "The Fox and The Crow - UK English accent (TheFableCottage.com)",
    description: "Practice English listening and dictation",
    thumbnail: "https://i.ytimg.com/vi/BF3bXji-J7I/mqdefault.jpg",
    duration: "3:18",
    language: "English",
  },
  {
    id: "jKi2SvWOCXc",
    title: "The Bear and the Bee - US English accent (TheFableCottage.com)",
    description: "Practice English listening and dictation",
    thumbnail: "https://i.ytimg.com/vi/jKi2SvWOCXc/mqdefault.jpg",
    duration: "3:38",
    language: "English",
  },
  {
    id: "AUznSKcUHJA",
    title: "Top 60+ Vegetables Name in English",
    description: "Practice English listening and dictation",
    thumbnail: "https://i.ytimg.com/vi/AUznSKcUHJA/mqdefault.jpg",
    duration: "8:52",
    language: "English",
  },
  {
    id: "OOuou1PJMmc",
    title:
      "[VIETSUB] 진호(JINHO) - MAGAZINE HO #02 'When i was your man / Bruno Mars'",
    description: "Practice English listening and dictation",
    thumbnail: "https://i.ytimg.com/vi/OOuou1PJMmc/mqdefault.jpg",
    duration: "3:45",
    language: "English",
  },

  // ========== JAPANESE VIDEOS ==========
  {
    id: "_8b_ERSJ6_Q",
    title:
      "初級日本語げんき 会話ビデオ GENKI Dialogue Videos Lesson 1 あたらしいともだち",
    description: "Practice Japanese listening and dictation",
    thumbnail: "https://i.ytimg.com/vi/_8b_ERSJ6_Q/mqdefault.jpg",
    duration: "1:14",
    language: "Japanese",
  },
  {
    id: "MblKNliC6uc",
    title:
      "♡子供向け♡ いろんなあいさつを学ぶためのビデオ 勉強＆練習 知育ビデオ Let's learn Japanese Greetings!",
    description: "Practice Japanese listening and dictation",
    thumbnail: "https://i.ytimg.com/vi/MblKNliC6uc/mqdefault.jpg",
    duration: "2:24",
    language: "Japanese",
  },
  {
    id: "1oAOTbPzrg4",
    title:
      "At the restaurant｜Japanese conversation#11｜レストランで使う日本語",
    description: "Practice Japanese listening and dictation",
    thumbnail: "https://i.ytimg.com/vi/1oAOTbPzrg4/mqdefault.jpg",
    duration: "4:16",
    language: "Japanese",
  },
  {
    id: "ZqZpkMHmm0Y",
    title:
      "At the Hotel｜Japanese conversation#12｜ホテルで使う日本語",
    description: "Practice Japanese listening and dictation",
    thumbnail: "https://i.ytimg.com/vi/ZqZpkMHmm0Y/mqdefault.jpg",
    duration: "5:31",
    language: "Japanese",
  },

  // ========== DEMO VIDEOS (Optional - you can remove these) ==========
  // {
  //   id: "dQw4w9WgXcQ",
  //   title: "Rick Astley - Never Gonna Give You Up",
  //   description: "Classic song with clear English pronunciation",
  //   thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  //   duration: "3:33",
  //   language: "English",
  // },
];

// Filter functions for future use
export const filterByLanguage = (
  videos: VideoSuggestion[],
  language: VideoSuggestion["language"]
) => videos.filter((v) => v.language === language);
