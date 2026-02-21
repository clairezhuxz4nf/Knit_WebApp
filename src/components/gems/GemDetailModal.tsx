import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Send, Mic, MicOff, Camera } from "lucide-react";

interface Comment {
  id: string;
  personName: string;
  avatarUrl: string;
  text: string;
  isAudio?: boolean;
  timestamp: string;
}

interface GemDetailProps {
  item: {
    id: string;
    type: string;
    title: string;
    description: string;
    imageUrl?: string;
    personName: string;
    avatarUrl: string;
    likes: number;
    liked: boolean;
  };
  onClose: () => void;
  onToggleLike: (id: string) => void;
}

// Sample comments
const sampleComments: Comment[] = [
  { id: "c1", personName: "Mom", avatarUrl: "", text: "I remember this so well! 💕", timestamp: "2h ago" },
  { id: "c2", personName: "Dad", avatarUrl: "", text: "One of my favorite memories.", timestamp: "1h ago" },
];

const GemDetailModal = ({ item, onClose, onToggleLike }: GemDetailProps) => {
  const storyFullText = `${item.description}\n\nThis is one of those memories that stays with you — the kind that shapes who you are. Every family has these moments, quiet but powerful, that echo through the generations.\n\nIt reminds us that the most meaningful stories aren't always the loudest ones. Sometimes they live in the small choices, the everyday acts of courage and love that we carry forward.`;
  const [comments, setComments] = useState<Comment[]>(sampleComments);
  const [newComment, setNewComment] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        personName: "Me",
        avatarUrl: "",
        text: newComment,
        timestamp: "Just now",
      },
    ]);
    setNewComment("");
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setComments((prev) => [
        ...prev,
        {
          id: `c${Date.now()}`,
          personName: "Me",
          avatarUrl: "",
          text: "🎤 Voice message",
          isAudio: true,
          timestamp: "Just now",
        },
      ]);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center"
      >
        <div className="w-full max-w-md flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-display text-sm font-semibold text-foreground truncate mx-3">Story Bite</h2>
          <button
            onClick={() => onToggleLike(item.id)}
            className="flex items-center gap-1 p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <Heart className={`w-4 h-4 ${item.liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            <span className="text-xs text-muted-foreground">{item.likes}</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Picture — compact */}
          <div className="relative aspect-[16/9] bg-muted">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-3xl">
                  {item.type === "stories" ? "📝" : item.type === "podcasts" ? "🎙️" : item.type === "storybooks" ? "📚" : "📸"}
                </span>
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 cursor-pointer hover:bg-background/90 transition-colors">
              <Camera className="w-3.5 h-3.5 text-foreground" />
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 px-5 pt-3 pb-1.5">
            <img src={item.avatarUrl} alt={item.personName} className="w-6 h-6 rounded-full object-cover border border-border" />
            <span className="text-xs font-medium text-muted-foreground">{item.personName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {item.type === "storybooks" ? "storybook" : item.type.slice(0, -1)}
            </span>
          </div>

          {/* Story content — focus area */}
          <div className="px-5 pb-4">
            <h3 className="font-display text-base font-bold text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{storyFullText}</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-5" />

          {/* Comments */}
          <div className="px-5 pt-3 pb-24">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Comments ({comments.length})
            </h4>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground">
                    {c.personName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-foreground">{c.personName}</span>
                      <span className="text-[10px] text-muted-foreground">{c.timestamp}</span>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-0.5 ${c.isAudio ? "italic" : ""}`}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comment input bar */}
        <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border px-4 py-3 flex items-center gap-2">
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
            placeholder={isRecording ? "Recording..." : "Write a comment..."}
            disabled={isRecording}
            className="flex-1 bg-muted rounded-full px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={handleSendComment}
            disabled={!newComment.trim()}
            className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GemDetailModal;
