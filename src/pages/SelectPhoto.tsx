import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  id: string;
  file_path: string;
  file_name: string;
  signedUrl?: string;
}

const SelectPhoto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!user) return;
      const { data: memberData } = await supabase
        .from("people")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!memberData) {
        setLoadingPhotos(false);
        return;
      }

      const { data: photosData } = await supabase
        .from("family_photos")
        .select("*")
        .eq("family_space_id", memberData.family_space_id)
        .order("created_at", { ascending: false });

      if (photosData && photosData.length > 0) {
        const withUrls = await Promise.all(
          photosData.map(async (p) => {
            const { data } = await supabase.storage
              .from("family-gems")
              .createSignedUrl(p.file_path, 3600);
            return { id: p.id, file_path: p.file_path, file_name: p.file_name, signedUrl: data?.signedUrl };
          })
        );
        setPhotos(withUrls);
      }
      setLoadingPhotos(false);
    };
    fetchPhotos();
  }, [user]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDone = () => {
    const selected = photos.filter((p) => selectedIds.has(p.id));
    const selectedUrls = selected.map((p) => p.signedUrl).filter(Boolean) as string[];
    // Navigate back with selected photos in state
    navigate(-1);
    // Use a small timeout so the previous page is mounted before we dispatch
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("photos-selected-from-repo", { detail: { urls: selectedUrls } })
      );
    }, 100);
  };

  if (loading || loadingPhotos) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="pb-6 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">Select Photos</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {selectedIds.size > 0
              ? `${selectedIds.size} photo${selectedIds.size > 1 ? "s" : ""} selected`
              : "Tap to select photos"}
          </p>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="px-4 flex-1 overflow-y-auto">
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No photos in your collection yet</p>
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
                  transition={{ delay: index * 0.03 }}
                  onClick={() => toggleSelect(photo.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer ${
                    isSelected ? "ring-2 ring-primary" : ""
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
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-background/70 border-border backdrop-blur-sm"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Done button */}
      {selectedIds.size > 0 && (
        <div className="px-6 pt-4 pb-2">
          <button
            onClick={handleDone}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Done ({selectedIds.size})
          </button>
        </div>
      )}
    </MobileLayout>
  );
};

export default SelectPhoto;
