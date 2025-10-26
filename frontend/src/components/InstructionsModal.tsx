import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, Youtube, MousePointer2, Type, Play } from "lucide-react";

export const InstructionsModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="How to use">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            How to Use Video Dictation
          </DialogTitle>
          <DialogDescription>
            Learn how to practice your listening and writing skills
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                1
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-lg">Paste a YouTube URL</h3>
              </div>
              <p className="text-muted-foreground">
                Copy any YouTube video URL and paste it into the input field at
                the top. The video must have English subtitles for this to work.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                2
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Watch the Video</h3>
              </div>
              <p className="text-muted-foreground">
                The video player will load automatically. You can watch the full
                video or use the controls to navigate. The transcript appears
                below the player.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                3
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer2 className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-lg">
                  Choose Your Practice Mode
                </h3>
              </div>
              <p className="text-muted-foreground mb-2">
                Select one of three practice modes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>
                  <strong>Dictation:</strong> Listen to a sentence and write
                  what you hear
                </li>
                <li>
                  <strong>Typing:</strong> Type the shown sentence to practice
                  speed and accuracy
                </li>
                <li>
                  <strong>Full Transcript:</strong> View all sentences with
                  timestamps and translations
                </li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                4
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Type className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-lg">Practice & Check</h3>
              </div>
              <p className="text-muted-foreground">
                Write or type what you hear, then click "Check" to see if you
                got it right. Use the pronunciation tool to listen to individual
                words, and hover over words to see translations.
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 border-l-4 border-primary p-4 rounded-r-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Pro Tips
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  Start with shorter videos and work your way up to longer ones
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  Click on any sentence in the Full Transcript tab to jump to
                  that part of the video
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  Use the "Cover Video" button to hide subtitles and focus on
                  listening
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  Try different practice modes to strengthen different skills
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Start */}
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-primary">🚀 Quick Start</h3>
            <p className="text-sm text-muted-foreground">
              Just starting? Click any video below to load it instantly, or
              paste your own YouTube URL above to begin practicing immediately!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
