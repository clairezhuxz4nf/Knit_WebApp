import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Send, Mic, MicOff, Camera, Volume2, Play, MessageCircle } from "lucide-react";

interface Comment {
  id: string;
  personName: string;
  avatarUrl: string;
  text?: string;
  isAudio?: boolean;
  audioTranscript?: string;
  audioDuration?: string;
  timestamp: string;
  likes: number;
  liked: boolean;
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

// Sample comments matching the reference style
const sampleComments: Comment[] = [
  {
    id: "c1",
    personName: "Mom",
    avatarUrl: "",
    isAudio: true,
    audioDuration: "9\"",
    audioTranscript: "I feel so proud of my mom every time I hear this story. When I first went to Shenzhen to start my own company, this was what kept me going.",
    timestamp: "2h ago",
    likes: 84,
    liked: false,
  },
  {
    id: "c2",
    personName: "Dad",
    avatarUrl: "",
    text: "One of my favorite memories. Every time I think about it, it reminds me why family is so important to all of us 💕",
    timestamp: "1h ago",
    likes: 12,
    liked: true,
  },
  {
    id: "c3",
    personName: "Grandma",
    avatarUrl: "",
    text: "I remember this so well! Those were beautiful days.",
    timestamp: "45m ago",
    likes: 7,
    liked: false,
  },
];

const AudioBubble = ({ duration, isPlaying, onPlay }: { duration: string; isPlaying: boolean; onPlay: () => void }) => (
  <button
    onClick={onPlay}
    className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2.5 min-w-[120px] hover:bg-muted/80 transition-colors"
  >
    {isPlaying ? <Volume2 className="w-4 h-4 text-primary shrink-0" /> : <Play className="w-4 h-4 text-muted-foreground shrink-0" />}
    <div className="flex gap-[2px] items-center h-4">
      {[3, 5, 8, 4, 7, 10, 6, 9, 5, 7, 4, 8, 6, 3].map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-colors ${isPlaying ? "bg-primary" : "bg-muted-foreground/50"}`}
          style={{ height: `${h * 1.5}px` }}
        />
      ))}
    </div>
    <span className="text-xs text-muted-foreground ml-1">{duration}</span>
  </button>
);

const GemDetailModal = ({ item, onClose, onToggleLike }: GemDetailProps) => {
  const storyFullText = `${item.description}\n\nThis is one of those memories that stays with you — the kind that shapes who you are. Every family has these moments, quiet but powerful, that echo through the generations.\n\nIt reminds us that the most meaningful stories aren't always the loudest ones. Sometimes they live in the small choices, the everyday acts of courage and love that we carry forward.`;
  const [comments, setComments] = useState<Comment[]>(sampleComments);
  const [newComment, setNewComment] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
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
        likes: 0,
        liked: false,
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
          isAudio: true,
          audioDuration: "5\"",
          audioTranscript: "I feel so proud of my mom every time I hear this story. When I first went to Shenzhen to start my own company, this was what kept me going.",
          timestamp: "Just now",
          likes: 0,
          liked: false,
        },
      ]);
    } else {
      setIsRecording(true);
    }
  };

  const toggleCommentLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
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
          <div className="px-5 pt-3 pb-28">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-foreground">
                {comments.length} Comments
              </h4>
            </div>
            <div className="space-y-5">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground overflow-hidden">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.personName} className="w-full h-full object-cover" />
                    ) : (
                      c.personName[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{c.personName}</span>

                    {/* Audio bubble */}
                    {c.isAudio && (
                      <div className="mt-1.5">
                        <AudioBubble
                          duration={c.audioDuration || "0\""}
                          isPlaying={playingAudioId === c.id}
                          onPlay={() => setPlayingAudioId(playingAudioId === c.id ? null : c.id)}
                        />
                      </div>
                    )}

                    {/* Audio transcript as text bubble */}
                    {c.isAudio && c.audioTranscript && (
                      <div className="mt-1.5 bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
                        <p className="text-sm text-foreground leading-relaxed">{c.audioTranscript}</p>
                      </div>
                    )}

                    {/* Text comment */}
                    {c.text && !c.isAudio && (
                      <p className="text-sm text-foreground/90 mt-1 leading-relaxed">{c.text}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">{c.timestamp}</span>
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Reply</button>
                      <button
                        onClick={() => toggleCommentLike(c.id)}
                        className="flex items-center gap-1 ml-auto"
                      >
                        <Heart className={`w-3.5 h-3.5 ${c.liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        {c.likes > 0 && <span className="text-xs text-muted-foreground">{c.likes}</span>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comment input bar */}
        <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border px-4 py-2.5 flex items-center gap-2">
          <input
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
            placeholder={isRecording ? "Recording..." : "Share your thoughts..."}
            disabled={isRecording}
            className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={toggleRecording}
            className={`p-2.5 rounded-full transition-colors ${
              isRecording ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          {newComment.trim() && (
            <button
              onClick={handleSendComment}
              className="p-2.5 rounded-full bg-primary text-primary-foreground transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GemDetailModal;
