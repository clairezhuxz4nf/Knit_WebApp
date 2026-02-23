import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Send, Mic, MicOff, Camera, Volume2, Play, MessageCircle, BookOpen, Pause, ChevronLeft, ChevronRight, Trash2, Pencil, Check, Upload, Image } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger } from
"@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
const nameStoryComic = "/comics/name-story-comic.png";

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
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: {description: string;}) => void;
}

const COMIC_STORY_TITLE = "The Name That Followed Them";


const AudioBubble = ({ duration, isPlaying, onPlay }: {duration: string;isPlaying: boolean;onPlay: () => void;}) =>
<button
  onClick={onPlay}
  className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-2.5 min-w-[120px] hover:bg-muted/80 transition-colors">

    {isPlaying ? <Volume2 className="w-4 h-4 text-primary shrink-0" /> : <Play className="w-4 h-4 text-muted-foreground shrink-0" />}
    <div className="flex gap-[2px] items-center h-4">
      {[3, 5, 8, 4, 7, 10, 6, 9, 5, 7, 4, 8, 6, 3].map((h, i) =>
    <div
      key={i}
      className={`w-[3px] rounded-full transition-colors ${isPlaying ? "bg-primary" : "bg-muted-foreground/50"}`}
      style={{ height: `${h * 1.5}px` }} />

    )}
    </div>
    <span className="text-xs text-muted-foreground ml-1">{duration}</span>
  </button>;


const GemDetailModal = ({ item, onClose, onToggleLike, onDelete, onUpdate }: GemDetailProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(item.description);
  const [saving, setSaving] = useState(false);

  // Media overlay state
  const [showAudioBar, setShowAudioBar] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [photos, setPhotos] = useState<{url: string;photoId?: string;isOriginal?: boolean;}[]>(
    item.imageUrl ? [{ url: item.imageUrl, isOriginal: true }] : []
  );
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera menu state
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  // Storybook state
  const [hasStorybook, setHasStorybook] = useState(false);
  const hasComic = item.title === COMIC_STORY_TITLE;

  // Check if this story bite has a storybook
  useEffect(() => {
    const checkStorybook = async () => {
      const { data } = await supabase
        .from("storybooks")
        .select("id")
        .eq("story_bite_id", item.id)
        .maybeSingle();
      setHasStorybook(!!data || hasComic);
    };
    checkStorybook();
  }, [item.id, hasComic]);

  // Fetch comments from database
  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("story_bite_comments")
      .select("*")
      .eq("story_bite_id", item.id)
      .order("created_at", { ascending: true });

    if (data) {
      // Resolve person names from people table
      const mapped: Comment[] = await Promise.all(data.map(async (c) => {
        let personName = "Family";
        let avatarUrl = "";
        const { data: person } = await supabase
          .from("people")
          .select("first_name, avatar_url")
          .eq("user_id", c.created_by)
          .maybeSingle();
        if (person) {
          personName = person.first_name || "Family";
          if (person.avatar_url) {
            if (person.avatar_url.startsWith("http")) {
              avatarUrl = person.avatar_url;
            } else {
              const { data: signed } = await supabase.storage
                .from("avatars")
                .createSignedUrl(person.avatar_url, 3600);
              avatarUrl = signed?.signedUrl || "";
            }
          }
        }
        // Check if this is the current user
        if (c.created_by === user?.id) personName = "Me";

        return {
          id: c.id,
          personName,
          avatarUrl,
          text: c.text || undefined,
          isAudio: c.is_audio,
          audioTranscript: c.audio_transcript || undefined,
          audioDuration: c.audio_duration || undefined,
          timestamp: formatDistanceToNow(new Date(c.created_at), { addSuffix: true }),
          likes: 0,
          liked: false,
        };
      }));
      setComments(mapped);
    }
    setLoadingComments(false);
  }, [item.id, user?.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Load linked photos from junction table
  useEffect(() => {
    const loadLinkedPhotos = async () => {
      const { data: links } = await supabase.
      from("story_bite_photos").
      select("photo_id, sort_order, family_photos(file_path)").
      eq("story_bite_id", item.id).
      order("sort_order", { ascending: true });

      if (links && links.length > 0) {
        const linkedPhotos = await Promise.all(
          links.map(async (link: any) => {
            const filePath = link.family_photos?.file_path;
            if (!filePath) return null;
            const { data } = await supabase.storage.
            from("family-gems").
            createSignedUrl(filePath, 3600);
            return data?.signedUrl ? { url: data.signedUrl, photoId: link.photo_id } : null;
          })
        );
        const valid = linkedPhotos.filter(Boolean) as {url: string;photoId: string;}[];
        if (valid.length > 0) {
          const base = item.imageUrl ? [{ url: item.imageUrl, isOriginal: true }] : [];
          setPhotos([...base, ...valid]);
        }
      }
    };
    loadLinkedPhotos();
  }, [item.id]);

  const handleRemovePhoto = async (index: number) => {
    const photo = photos[index];
    if (photo.photoId) {
      const { error } = await supabase.
      from("story_bite_photos").
      delete().
      eq("story_bite_id", item.id).
      eq("photo_id", photo.photoId);
      if (error) {
        toast.error("Failed to remove photo");
        return;
      }
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (currentPhotoIndex >= photos.length - 1 && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
    toast.success("Photo removed");
  };

  const audioDuration = 185;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const handleAudioSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setAudioProgress(pct * audioDuration);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newItems = Array.from(files).map((f) => ({ url: URL.createObjectURL(f) }));
    setPhotos((prev) => [...prev, ...newItems]);
  };

  const handleSwipe = (dir: "left" | "right") => {
    if (dir === "left" && currentPhotoIndex < photos.length - 1) setCurrentPhotoIndex((i) => i + 1);
    if (dir === "right" && currentPhotoIndex > 0) setCurrentPhotoIndex((i) => i - 1);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const { error } = await supabase.
    from("story_bites").
    update({ description: editedContent }).
    eq("id", item.id);
    if (error) {
      toast.error("Failed to save changes");
    } else {
      toast.success("Story updated");
      setIsEditing(false);
      onUpdate?.(item.id, { description: editedContent });
    }
    setSaving(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !user) return;
    // We need the family_space_id from the story bite
    const { data: sb } = await supabase
      .from("story_bites")
      .select("family_space_id")
      .eq("id", item.id)
      .single();
    if (!sb) { toast.error("Could not find story bite"); return; }

    const { error } = await supabase
      .from("story_bite_comments")
      .insert({
        story_bite_id: item.id,
        family_space_id: sb.family_space_id,
        created_by: user.id,
        text: newComment.trim(),
      });
    if (error) {
      toast.error("Failed to send comment");
      return;
    }
    setNewComment("");
    fetchComments();
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // TODO: implement actual audio recording and persist to DB
      toast.info("Audio recording not yet implemented");
    } else {
      setIsRecording(true);
    }
  };

  const toggleCommentLike = (commentId: string) => {
    setComments((prev) =>
    prev.map((c) =>
    c.id === commentId ?
    { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } :
    c
    )
    );
  };

  const handleOpenStorybook = () => {
    navigate(`/storybook-preview?storyBiteId=${item.id}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-background flex flex-col items-center">

        <div className="w-full max-w-md flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-display text-sm font-semibold text-foreground truncate mx-3">Story Bite</h2>
          <div className="flex items-center gap-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this story bite?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{item.title}" for all family members. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async (e) => {
                        e.preventDefault();
                        setDeleting(true);
                        try {
                          // Delete related records first
                          await supabase.from("storybooks").delete().eq("story_bite_id", item.id);
                          await supabase.from("story_bite_comments").delete().eq("story_bite_id", item.id);
                          await supabase.from("story_bite_likes").delete().eq("story_bite_id", item.id);
                          await supabase.from("story_bite_photos").delete().eq("story_bite_id", item.id);
                          const { error } = await supabase.from("story_bites").delete().eq("id", item.id);
                          if (error) throw error;
                          toast.success("Story bite deleted for all family members");
                          onDelete?.(item.id);
                          onClose();
                        } catch (err) {
                          console.error("Delete failed:", err);
                          toast.error("Failed to delete story bite");
                          setDeleting(false);
                        }
                      }}>

                    {deleting ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <button
                onClick={() => onToggleLike(item.id)}
                className="flex items-center gap-1 p-1.5 rounded-full hover:bg-muted transition-colors">

              <Heart className={`w-4 h-4 ${item.liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground">{item.likes}</span>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Picture with overlay icons */}
          <div className="relative">
            <div
                className="relative aspect-[16/9] bg-muted overflow-hidden"
                onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (touchStartX === null || photos.length <= 1) return;
                  const diff = e.changedTouches[0].clientX - touchStartX;
                  if (Math.abs(diff) > 50) handleSwipe(diff < 0 ? "left" : "right");
                  setTouchStartX(null);
                }}>

              {photos.length > 0 ?
                <img src={photos[currentPhotoIndex].url} alt={item.title} className="w-full h-full object-cover" /> :

                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-3xl">
                    {item.type === "stories" ? "📝" : item.type === "podcasts" ? "🎙️" : item.type === "storybooks" ? "📚" : "📸"}
                  </span>
                </div>
                }

              {/* Carousel arrows */}
              {photos.length > 1 && currentPhotoIndex > 0 &&
                <button onClick={() => handleSwipe("right")} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm rounded-full p-1 hover:bg-background/90 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                }
              {photos.length > 1 && currentPhotoIndex < photos.length - 1 &&
                <button onClick={() => handleSwipe("left")} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm rounded-full p-1 hover:bg-background/90 transition-colors">
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
                }

              {/* Remove photo button — only for linked (non-original) photos */}
              {photos.length > 0 && !photos[currentPhotoIndex].isOriginal &&
                <button
                  onClick={() => handleRemovePhoto(currentPhotoIndex)}
                  className="absolute top-2 left-2 bg-destructive/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-destructive transition-colors opacity-60"
                  title="Remove photo">

                  <X className="w-3.5 h-3.5 text-destructive-foreground" />
                </button>
                }

              {/* Dot indicators */}
              {photos.length > 1 &&
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) =>
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentPhotoIndex ? "bg-primary-foreground" : "bg-primary-foreground/40"}`} />
                  )}
                </div>
                }

              {/* Three overlay icons — bottom right */}
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                <button
                    onClick={() => setShowAudioBar(!showAudioBar)}
                    className={`p-1.5 rounded-full backdrop-blur-sm transition-colors ${showAudioBar ? "bg-primary text-primary-foreground" : "bg-background/70 hover:bg-background/90 text-foreground"}`}>

                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <div className="relative">
                  <button
                      onClick={() => setShowCameraMenu(!showCameraMenu)}
                      className="bg-background/70 backdrop-blur-sm rounded-full p-1.5 hover:bg-background/90 transition-colors text-foreground">

                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  {showCameraMenu &&
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCameraMenu(false)} />
                      <div className="absolute bottom-full right-0 mb-1.5 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden whitespace-nowrap">
                        <button
                          onClick={() => {
                            setShowCameraMenu(false);
                            navigate(`/select-photo?storyBiteId=${item.id}`);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">

                          <Image className="w-4 h-4 text-muted-foreground" />
                          Choose from collection
                        </button>
                        <div className="h-px bg-border" />
                        <button
                          onClick={() => {
                            setShowCameraMenu(false);
                            fileInputRef.current?.click();
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">

                          <Upload className="w-4 h-4 text-muted-foreground" />
                          Upload new
                        </button>
                      </div>
                    </>
                    }
                </div>
                <button
                    onClick={() => hasStorybook && handleOpenStorybook()}
                    className={`backdrop-blur-sm rounded-full p-1.5 transition-colors ${hasStorybook ? "bg-background/70 hover:bg-background/90 text-foreground" : "bg-background/40 text-muted-foreground/50 cursor-default"}`}>

                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
            </div>

            {/* Audio bar */}
            {showAudioBar &&
              <div className="bg-muted px-3 py-2 flex items-center gap-2">
                <button onClick={() => setAudioPlaying(!audioPlaying)} className="shrink-0 text-foreground">
                  {audioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{formatTime(audioProgress)}</span>
                <div className="flex-1 h-6 flex items-center cursor-pointer group" onClick={handleAudioSeek}>
                  <div className="w-full h-1 bg-border rounded-full relative">
                    <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: `${audioProgress / audioDuration * 100}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${audioProgress / audioDuration * 100}% - 5px)` }} />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground w-8 shrink-0">{formatTime(audioDuration)}</span>
              </div>
              }
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 px-5 pt-3 pb-1.5">
            <div className="w-6 h-6 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {item.avatarUrl ?
                <img src={item.avatarUrl} alt={item.personName} className="w-full h-full object-cover" /> :

                <span className="text-[10px] font-semibold text-muted-foreground">{item.personName[0]}</span>
                }
            </div>
            <span className="text-xs font-medium text-muted-foreground">{item.personName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {item.type === "storybooks" ? "storybook" : item.type.slice(0, -1)}
            </span>
          </div>

          {/* Story content */}
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-base font-bold text-foreground">{item.title}</h3>
              {!isEditing ?
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  aria-label="Edit story">

                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button> :

                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors text-primary"
                  aria-label="Save changes">

                  <Check className="w-4 h-4" />
                </button>
                }
            </div>
            {isEditing ?
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full text-sm text-foreground leading-relaxed bg-muted rounded-xl p-3 min-h-[160px] focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none" /> :


              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{editedContent}</p>
              }
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-5" />

          {/* Comments */}
          <div className="px-5 pt-3 pb-16">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-foreground">
                {comments.length} Comments
              </h4>
            </div>
            <div className="space-y-5">
              {comments.map((c) =>
                <div key={c.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground overflow-hidden">
                    {c.avatarUrl ?
                    <img src={c.avatarUrl} alt={c.personName} className="w-full h-full object-cover" /> :

                    c.personName[0]
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{c.personName}</span>

                    {/* Audio bubble */}
                    {c.isAudio &&
                    <div className="mt-1.5">
                        <AudioBubble
                        duration={c.audioDuration || "0\""}
                        isPlaying={playingAudioId === c.id}
                        onPlay={() => setPlayingAudioId(playingAudioId === c.id ? null : c.id)} />

                      </div>
                    }

                    {/* Audio transcript as text bubble */}
                    {c.isAudio && c.audioTranscript &&
                    <div className="mt-1.5 bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
                        <p className="text-sm text-foreground leading-relaxed">{c.audioTranscript}</p>
                      </div>
                    }

                    {/* Text comment */}
                    {c.text && !c.isAudio &&
                    <p className="text-sm text-foreground/90 mt-1 leading-relaxed">{c.text}</p>
                    }

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">{c.timestamp}</span>
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Reply</button>
                    </div>
                  </div>
                </div>
                )}
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
              className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50" />

          <button
              onClick={toggleRecording}
              className={`p-2.5 rounded-full transition-colors ${
              isRecording ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-foreground"}`
              }>

            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          {newComment.trim() &&
            <button
              onClick={handleSendComment}
              className="p-2.5 rounded-full bg-primary text-primary-foreground transition-colors">

              <Send className="w-4 h-4" />
            </button>
            }
        </div>
        </div>
      </motion.div>
    </AnimatePresence>);

};

export default GemDetailModal;