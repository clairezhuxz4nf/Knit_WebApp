import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Camera, Mic, Square, Play, Pause, Loader2, ImagePlus,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// --- Types ---
interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

type RecordingState = "idle" | "recording" | "processing" | "done";

// Simulated speakers & sentences for demo
const DEMO_SPEAKERS = ["Speaker 1", "Speaker 2", "Speaker 3"];
const DEMO_SENTENCES = [
  "I remember when we used to go to the lake every summer.",
  "Yeah, and grandma would always make her famous lemonade.",
  "Those were the best days. The whole family together.",
  "Dad would set up the fishing rods at dawn.",
  "And we'd catch nothing but still have the best time!",
  "Mom always said it wasn't about the fish.",
  "It was about being together as a family.",
  "I wish the kids today could experience that.",
  "We should plan a trip like that again soon.",
  "Let's do it. This summer, no excuses.",
];

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const CreateStoryBite = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const coverPhotoUrl = (location.state as any)?.coverPhotoUrl as string | undefined;
  const [imagePreview, setImagePreview] = useState<string | null>(coverPhotoUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // AI result
  const [aiTitle, setAiTitle] = useState("");
  const [aiSummary, setAiSummary] = useState("");

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (simRef.current) clearInterval(simRef.current);
    };
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const startRecording = useCallback(() => {
    setRecordingState("recording");
    setElapsed(0);
    setTranscript([]);
    setAiTitle("");
    setAiSummary("");

    // Timer
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

    // Simulated live transcription
    let idx = 0;
    const addSegment = () => {
      if (idx >= DEMO_SENTENCES.length) {
        idx = 0; // loop
      }
      const speaker = DEMO_SPEAKERS[Math.floor(Math.random() * DEMO_SPEAKERS.length)];
      const now = new Date();
      const ts = `${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      setTranscript((prev) => [
        ...prev,
        { id: `seg-${Date.now()}`, speaker, text: DEMO_SENTENCES[idx], timestamp: ts },
      ]);
      idx++;
    };

    // First segment quickly, then every 2-4s
    setTimeout(addSegment, 1200);
    simRef.current = setInterval(addSegment, 2800);
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (simRef.current) clearInterval(simRef.current);
    timerRef.current = null;
    simRef.current = null;

    setRecordingState("processing");

    // Simulate AI processing
    setTimeout(() => {
      setAiTitle("Summer Days at the Lake");
      setAiSummary(
        "A heartfelt family conversation about cherished summer memories at the lake. The speakers recall grandma's famous lemonade, dad's early-morning fishing trips, and the simple joy of being together as a family. The conversation ends with an enthusiastic plan to recreate those special moments this coming summer."
      );
      setRecordingState("done");
    }, 2500);
  }, []);

  const handleSave = async () => {
    if (!user || !aiTitle) return;
    setSaving(true);

    try {
      // Get user's family space
      const { data: memberData } = await supabase
        .from("people")
        .select("family_space_id, first_name, last_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!memberData) {
        toast.error("You must belong to a family space first");
        setSaving(false);
        return;
      }

      let imageUrl: string | null = null;
      if (imageFile) {
        const filePath = `story-bites/${memberData.family_space_id}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("family-gems")
          .upload(filePath, imageFile);
        if (!uploadError) {
          imageUrl = filePath;
        }
      } else if (imagePreview && coverPhotoUrl) {
        // Cover photo is already a signed URL from storage; store the original path
        // Fetch the original cover_photo_url path from the family space
        const { data: spaceData } = await supabase
          .from("family_spaces")
          .select("cover_photo_url")
          .eq("id", memberData.family_space_id)
          .single();
        if (spaceData?.cover_photo_url) {
          imageUrl = spaceData.cover_photo_url;
        }
      }

      const personName = [memberData.first_name, memberData.last_name].filter(Boolean).join(" ");

      const { error } = await supabase.from("story_bites").insert({
        family_space_id: memberData.family_space_id,
        created_by: user.id,
        title: aiTitle,
        description: aiSummary,
        image_url: imageUrl,
        person_name: personName,
        avatar_url: memberData.avatar_url,
        content_type: "stories",
      });

      if (error) throw error;
      toast.success("Story bite saved!");
      navigate("/gems");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save story bite");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout className="pb-0">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <button onClick={() => navigate("/gems")} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-display text-sm font-semibold text-foreground">New Story Bite</h2>
          {recordingState === "done" ? (
            <button onClick={handleSave} disabled={saving} className="text-sm font-semibold text-primary disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image placeholder */}
          <div
            className="relative aspect-[16/9] bg-muted cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Story cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Add a cover photo</p>
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3.5 h-3.5 text-foreground" />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

          {/* Recording section */}
          <div className="px-5 pt-5 pb-4">
            {recordingState === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <p className="text-sm text-muted-foreground text-center max-w-[260px]">
                  Record a family conversation and we'll turn it into a story bite
                </p>
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  <Mic className="w-8 h-8 text-primary-foreground" />
                </button>
                <span className="text-xs text-muted-foreground">Tap to start recording</span>
              </motion.div>
            )}

            {recordingState === "recording" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Recording indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm font-medium text-foreground">Recording</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{formatTimer(elapsed)}</span>
                </div>

                {/* Waveform visualization */}
                <div className="flex items-center justify-center gap-[2px] h-10">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full bg-primary/60"
                      animate={{
                        height: [4, Math.random() * 30 + 6, 4],
                      }}
                      transition={{
                        duration: 0.6 + Math.random() * 0.6,
                        repeat: Infinity,
                        delay: i * 0.03,
                      }}
                    />
                  ))}
                </div>

                {/* Stop button */}
                <div className="flex justify-center">
                  <button
                    onClick={stopRecording}
                    className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Square className="w-5 h-5 text-destructive-foreground fill-current" />
                  </button>
                </div>

                {/* Live transcript */}
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Live Transcript
                  </h4>
                  <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                    <AnimatePresence>
                      {transcript.map((seg) => (
                        <motion.div
                          key={seg.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-2"
                        >
                          <span className="text-[10px] text-muted-foreground font-mono pt-0.5 shrink-0 w-10">
                            {seg.timestamp}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-primary">{seg.speaker}</span>
                            <p className="text-sm text-foreground leading-relaxed">{seg.text}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              </motion.div>
            )}

            {recordingState === "processing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-12"
              >
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Generating your story bite…</p>
              </motion.div>
            )}

            {recordingState === "done" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{aiTitle}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">{aiSummary}</p>
                </div>

                <div className="h-px bg-border" />

                {/* Full transcript */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Full Transcript
                  </h4>
                  <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                    {transcript.map((seg) => (
                      <div key={seg.id} className="flex gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono pt-0.5 shrink-0 w-10">
                          {seg.timestamp}
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-primary">{seg.speaker}</span>
                          <p className="text-sm text-foreground leading-relaxed">{seg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setRecordingState("idle");
                      setTranscript([]);
                      setElapsed(0);
                    }}
                    className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Record Again
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Save Story Bite
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default CreateStoryBite;
