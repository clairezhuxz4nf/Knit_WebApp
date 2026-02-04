import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Plus, X, Loader2, Camera, ImagePlus } from "lucide-react";
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
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [familySpaceId, setFamilySpaceId] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<FamilyPhoto | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const categories: AssetCategory[] = [
    { id: "photos", title: "Photos", description: "Family pictures and albums", icon: "📸", count: photos.length, color: "rose" },
    { id: "stories", title: "Stories", description: "Written memories and tales", icon: "📝", count: 6, color: "butter" },
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

      // Get user's family space with cover photo
      const { data: memberData } = await supabase
        .from("people")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberData) {
        setFamilySpaceId(memberData.family_space_id);

        // Fetch family space for cover photo
        const { data: spaceData } = await supabase
          .from("family_spaces")
          .select("cover_photo_url")
          .eq("id", memberData.family_space_id)
          .single();

        if (spaceData?.cover_photo_url) {
          // Generate signed URL for cover photo (stored path, not URL)
          const coverPath = spaceData.cover_photo_url;
          // Check if it's already a full URL (legacy) or a path
          if (coverPath.startsWith('http')) {
            // Legacy: already a full URL - still try to get signed URL from path
            const pathMatch = coverPath.match(/family-gems\/(.+)$/);
            if (pathMatch) {
              const { data: signedData } = await supabase.storage
                .from("family-gems")
                .createSignedUrl(pathMatch[1], 3600);
              if (signedData?.signedUrl) {
                setCoverPhotoUrl(signedData.signedUrl);
              }
            }
          } else {
            // New format: just a path
            const { data: signedData } = await supabase.storage
              .from("family-gems")
              .createSignedUrl(coverPath, 3600);
            if (signedData?.signedUrl) {
              setCoverPhotoUrl(signedData.signedUrl);
            }
          }
        }

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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !familySpaceId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `covers/${familySpaceId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("family-gems")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store the file path (not URL) for signed URL generation
      // Update family space with cover photo path
      const { error: updateError } = await supabase
        .from("family_spaces")
        .update({ cover_photo_url: filePath })
        .eq("id", familySpaceId);

      if (updateError) throw updateError;

      // Generate signed URL for immediate display
      const { data: signedUrlData } = await supabase.storage
        .from("family-gems")
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (signedUrlData?.signedUrl) {
        setCoverPhotoUrl(signedUrlData.signedUrl);
      }
      toast.success("Family photo uploaded!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

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

  const getPhotoUrl = async (filePath: string): Promise<string> => {
    const { data } = await supabase.storage
      .from("family-gems")
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    return data?.signedUrl || "";
  };

  // Load signed URL when a photo is selected
  useEffect(() => {
    const loadSelectedPhotoUrl = async () => {
      if (selectedPhoto) {
        const url = await getPhotoUrl(selectedPhoto.file_path);
        setSelectedPhotoUrl(url);
      } else {
        setSelectedPhotoUrl(null);
      }
    };
    loadSelectedPhotoUrl();
  }, [selectedPhoto]);

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

      {/* Family Cover Photo Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6 mb-6"
      >
        {coverPhotoUrl ? (
          <div 
            className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => coverInputRef.current?.click()}
          >
            <img 
              src={coverPhotoUrl} 
              alt="Family photo" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                <Camera className="w-5 h-5 text-foreground" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
              <p className="text-xs font-medium text-foreground">Tap to change</p>
            </div>
          </div>
        ) : (
          <div 
            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => coverInputRef.current?.click()}
          >
            {uploadingCover ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-yarn-rose/20 flex items-center justify-center mb-3">
                  <ImagePlus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  Add a Family Photo
                </h3>
                <p className="text-sm text-muted-foreground text-center px-4">
                  Upload a photo that represents your family
                </p>
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* Hidden cover file input */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        className="hidden"
      />

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
              <CozyCard 
                className="cursor-pointer hover:shadow-cozy transition-all group"
                onClick={() => {
                  if (category.id === "stories") {
                    navigate("/stories");
                  }
                }}
              >
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
      </div>

      {/* Hidden file input for photos */}
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
          {selectedPhotoUrl ? (
            <img
              src={selectedPhotoUrl}
              alt={selectedPhoto.file_name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          )}
        </motion.div>
      )}

      <BottomNav />
    </MobileLayout>
  );
};

export default Gems;
