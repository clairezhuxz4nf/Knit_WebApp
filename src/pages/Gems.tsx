import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Plus, X, Loader2 } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FamilyPhoto {
  id: string;
  file_path: string;
  file_name: string;
  caption: string | null;
  created_at: string;
}

interface AssetCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  count: number;
  color: "rose" | "butter" | "sage";
}

const Gems = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [familySpaceId, setFamilySpaceId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<FamilyPhoto | null>(null);

  const categories: AssetCategory[] = [
    { id: "photos", title: "Photos", description: "Family pictures and albums", icon: "📸", count: photos.length, color: "rose" },
    { id: "stories", title: "Stories", description: "Written memories and tales", icon: "📝", count: 0, color: "butter" },
    { id: "storybooks", title: "Storybooks", description: "Compiled family books", icon: "📚", count: 0, color: "sage" },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Get user's family space
      const { data: memberData } = await supabase
        .from("family_members")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberData) {
        setFamilySpaceId(memberData.family_space_id);

        // Fetch photos
        const { data: photosData } = await supabase
          .from("family_photos")
          .select("*")
          .eq("family_space_id", memberData.family_space_id)
          .order("created_at", { ascending: false });

        if (photosData) {
          setPhotos(photosData);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !familySpaceId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("family-gems")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("family_photos")
        .insert({
          family_space_id: familySpaceId,
          uploaded_by: user.id,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      // Refresh photos
      const { data: photosData } = await supabase
        .from("family_photos")
        .select("*")
        .eq("family_space_id", familySpaceId)
        .order("created_at", { ascending: false });

      if (photosData) {
        setPhotos(photosData);
      }

      toast.success("Photo uploaded!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getPhotoUrl = (filePath: string) => {
    const { data } = supabase.storage.from("family-gems").getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
      </MobileLayout>
    );
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <MobileLayout className="pb-20">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl font-bold text-foreground">
            Family Gems
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your precious memories and stories
          </p>
        </motion.div>
      </div>

      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6 mb-6"
      >
        <CozyCard>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-yarn-butter/30 flex items-center justify-center text-2xl">
              💎
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total Treasures</p>
              <p className="font-display text-xl font-bold text-foreground">
                {totalItems} Items
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {categories.length} collections
              </p>
            </div>
          </div>
        </CozyCard>
      </motion.div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Recent Photos
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={getPhotoUrl(photo.file_path)}
                  alt={photo.file_name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="px-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Collections
        </h2>
        <div className="space-y-3 pb-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <CozyCard className="cursor-pointer hover:shadow-cozy transition-all group">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      category.color === "rose"
                        ? "bg-yarn-rose/20"
                        : category.color === "butter"
                        ? "bg-yarn-butter/20"
                        : "bg-yarn-sage/20"
                    }`}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.count} items
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CozyCard>
            </motion.div>
          ))}
        </div>

        {/* Empty state hint */}
        {totalItems === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <CozyCard className="text-center py-8">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Start Your Collection
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Capture moments and stories to fill your treasure chest
              </p>
              <CozyButton
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={!familySpaceId}
              >
                Upload First Photo
              </CozyButton>
            </CozyCard>
          </motion.div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {/* Floating Action Button */}
      {familySpaceId && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute right-6 bottom-0 pointer-events-auto"
          >
            <CozyButton
              variant="primary"
              className="w-9 h-9 rounded-full shadow-lifted p-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </CozyButton>
          </motion.div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={getPhotoUrl(selectedPhoto.file_path)}
            alt={selectedPhoto.file_name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </motion.div>
      )}

      <BottomNav />
    </MobileLayout>
  );
};

export default Gems;
