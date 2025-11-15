import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Save, FolderOpen, Trash2, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getSavedTexts,
  saveTextToStorage,
  loadTextFromStorage,
  deleteTextFromStorage,
  splitIntoSentences,
  SavedText,
} from "@/services/ttsService";

interface CustomTextInputProps {
  text: string;
  onTextChange: (text: string) => void;
  onGenerateAudio?: () => void;
  isGenerating?: boolean;
}

export const CustomTextInput = ({
  text,
  onTextChange,
  onGenerateAudio,
  isGenerating = false,
}: CustomTextInputProps) => {
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [sentencePreview, setSentencePreview] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Load saved texts on mount
  useEffect(() => {
    refreshSavedTexts();
  }, []);

  // Update sentence preview when text changes
  useEffect(() => {
    if (text.trim()) {
      const sentences = splitIntoSentences(text);
      setSentencePreview(sentences);
    } else {
      setSentencePreview([]);
    }
  }, [text]);

  const refreshSavedTexts = () => {
    const texts = getSavedTexts();
    setSavedTexts(texts);
  };

  const handleSave = () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Cannot save empty text",
        variant: "destructive",
      });
      return;
    }

    // If no title provided, use default
    const title = saveTitle.trim() || `Untitled ${new Date().toLocaleDateString()}`;

    try {
      const saved = saveTextToStorage(
        text,
        title,
        selectedTextId || undefined
      );
      toast({
        title: "Saved",
        description: `Text saved as "${saved.title}"`,
      });
      setIsSaveDialogOpen(false);
      setSaveTitle("");
      setSelectedTextId(null);
      refreshSavedTexts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save text",
        variant: "destructive",
      });
    }
  };

  const handleLoad = (id: string) => {
    const loaded = loadTextFromStorage(id);
    if (loaded) {
      onTextChange(loaded.text);
      setSelectedTextId(loaded.id);
      setSaveTitle(loaded.title);
      toast({
        title: "Loaded",
        description: `Loaded "${loaded.title}"`,
      });
      setIsLoadDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to load text",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm("Are you sure you want to delete this text?")) {
      const deleted = deleteTextFromStorage(id);
      if (deleted) {
        toast({
          title: "Deleted",
          description: "Text deleted successfully",
        });
        refreshSavedTexts();
        if (selectedTextId === id) {
          setSelectedTextId(null);
          setSaveTitle("");
        }
      }
    }
  };

  const handleOpenSaveDialog = () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Cannot save empty text",
        variant: "destructive",
      });
      return;
    }
    setIsSaveDialogOpen(true);
  };

  const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const charCount = text.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Text Input Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="custom-text" className="text-base font-semibold">
            Enter your text
          </Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{charCount} characters</span>
            <span>•</span>
            <span>{wordCount} words</span>
            {sentencePreview.length > 0 && (
              <>
                <span>•</span>
                <span>{sentencePreview.length} sentences</span>
              </>
            )}
          </div>
        </div>
        <Textarea
          id="custom-text"
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste or type your text here...&#10;&#10;Example:&#10;This is a sample sentence. It will be converted to audio for dictation practice. Each sentence will be split automatically."
          className="min-h-[200px] text-base resize-y"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleOpenSaveDialog}
          variant="outline"
          disabled={!text.trim() || isGenerating}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Text
        </Button>
        <Button
          onClick={() => setIsLoadDialogOpen(true)}
          variant="outline"
          disabled={isGenerating}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Load Text
        </Button>
        <Button
          onClick={onGenerateAudio}
          disabled={!text.trim() || isGenerating}
          className="ml-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Audio...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Audio
            </>
          )}
        </Button>
      </div>

      {/* Sentence Preview */}
      {sentencePreview.length > 0 && (
        <Card className="p-4 bg-secondary/50">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">
              Sentence Preview ({sentencePreview.length} sentences)
            </Label>
          </div>
          <div className="max-h-[150px] overflow-y-auto space-y-1 text-sm">
            {sentencePreview.slice(0, 10).map((sentence, index) => (
              <div key={index} className="text-muted-foreground">
                <span className="font-medium text-foreground">{index + 1}.</span>{" "}
                {sentence}
              </div>
            ))}
            {sentencePreview.length > 10 && (
              <div className="text-muted-foreground italic">
                ... and {sentencePreview.length - 10} more sentences
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Text</DialogTitle>
            <DialogDescription>
              Enter a title to save this text for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="save-title">Title</Label>
              <Input
                id="save-title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="My text"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Saved Text</DialogTitle>
            <DialogDescription>
              Select a saved text to load it.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {savedTexts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved texts found
              </div>
            ) : (
              <div className="space-y-2">
                {savedTexts.map((saved) => (
                  <Card
                    key={saved.id}
                    className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => handleLoad(saved.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold mb-1">{saved.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {saved.text.substring(0, 150)}
                          {saved.text.length > 150 && "..."}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Modified: {new Date(saved.lastModified).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(saved.id, e)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

