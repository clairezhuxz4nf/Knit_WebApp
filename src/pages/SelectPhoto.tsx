import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Photo {
  id: string;
  file_path: string;
  file_name: string;
  signedUrl?: string;
}

const SelectPhoto = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storyBiteId = searchParams.get("storyBiteId");
  const { user, loading } = useAuth();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: memberData } = await supabase
        .from("people")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!memberData) { setLoadingPhotos(false); return; }

      // Fetch all family photos
      const { data: photosData } = await supabase
        .from("family_photos")
        .select("id, file_path, file_name")
        .eq("family_space_id", memberData.family_space_id)
        .order("created_at", { ascending: false });

      if (photosData && photosData.length > 0) {
        const withUrls = await Promise.all(
          photosData.map(async (p) => {
            const { data } = await supabase.storage
              .from("family-gems")
              .createSignedUrl(p.file_path, 3600);
            return { ...p, signedUrl: data?.signedUrl || undefined };
          })
        );
        setPhotos(withUrls);
      }

      // Pre-select already linked photos
      if (storyBiteId) {
        const { data: linked } = await supabase
          .from("story_bite_photos")
          .select("photo_id")
          .eq("story_bite_id", storyBiteId);
        if (linked) {
          setSelectedIds(new Set(linked.map((l) => l.photo_id)));
        }
      }

      setLoadingPhotos(false);
    };
    fetch();
  }, [user]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDone = async () => {
    if (!storyBiteId) return;
    setSaving(true);
    try {
      // Remove old links
      await supabase
        .from("story_bite_photos")
        .delete()
        .eq("story_bite_id", storyBiteId);

      // Insert new links
      if (selectedIds.size > 0) {
        const rows = Array.from(selectedIds).map((photoId, i) => ({
          story_bite_id: storyBiteId,
          photo_id: photoId,
          sort_order: i,
        }));
        const { error } = await supabase
          .from("story_bite_photos")
          .insert(rows);
        if (error) throw error;
      }

      toast.success("Photos updated");
      navigate(`/gems?openStoryBite=${storyBiteId}`, { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingPhotos) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="pb-6">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(`/gems?openStoryBite=${storyBiteId}`, { replace: true })}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">Select Photos</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {selectedIds.size} selected
          </p>
        </div>
        <button
          onClick={handleDone}
          disabled={saving}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Done"}
        </button>
      </div>

      {/* Photo Grid */}
      <div className="px-4">
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No photos in the collection yet</p>
            <button
              onClick={() => navigate("/photo-repository")}
              className="text-primary text-sm font-medium mt-2"
            >
              Go to Photo Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((photo, index) => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => toggleSelect(photo.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-primary ring-offset-1" : ""
                  }`}
                >
                  {photo.signedUrl ? (
                    <img
                      src={photo.signedUrl}
                      alt={photo.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    </div>
                  )}
                  {/* Checkbox overlay */}
                  <div className="absolute top-1.5 right-1.5">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-background/70 border-muted-foreground/50 backdrop-blur-sm"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default SelectPhoto;
