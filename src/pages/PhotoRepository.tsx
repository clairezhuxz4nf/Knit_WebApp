import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Loader2, Star } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Photo {
  id: string;
  file_path: string;
  file_name: string;
  caption: string | null;
  created_at: string;
  uploaded_by: string;
  signedUrl?: string;
}

const PhotoRepository = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [familySpaceId, setFamilySpaceId] = useState<string | null>(null);
  const [settingCover, setSettingCover] = useState<string | null>(null);

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

      setFamilySpaceId(memberData.family_space_id);

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
            return { ...p, signedUrl: data?.signedUrl || undefined };
          })
        );
        setPhotos(withUrls);
      }
      setLoadingPhotos(false);
    };
    fetchPhotos();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !familySpaceId) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const fileExt = file.name.split(".").pop();
        const filePath = `photos/${familySpaceId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("family-gems")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("family_photos").insert({
          family_space_id: familySpaceId,
          uploaded_by: user.id,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
        });
        if (dbError) throw dbError;

        const { data: signedData } = await supabase.storage
          .from("family-gems")
          .createSignedUrl(filePath, 3600);

        setPhotos((prev) => [
          {
            id: crypto.randomUUID(),
            file_path: filePath,
            file_name: file.name,
            caption: null,
            created_at: new Date().toISOString(),
            uploaded_by: user.id,
            signedUrl: signedData?.signedUrl,
          },
          ...prev,
        ]);
      }
      toast.success("Photos uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setAsPictureOfTheWeek = async (photo: Photo) => {
    if (!familySpaceId) return;
    setSettingCover(photo.id);
    try {
      const { error } = await supabase
        .from("family_spaces")
        .update({ cover_photo_url: photo.file_path })
        .eq("id", familySpaceId);
      if (error) throw error;
      toast.success("Picture of the Week updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to set picture");
    } finally {
      setSettingCover(null);
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
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">Photo Repository</h1>
          <p className="text-muted-foreground text-xs mt-0.5">All family photos in one place</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
          ) : (
            <Plus className="w-5 h-5 text-primary-foreground" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      {/* Photo Grid */}
      <div className="px-4">
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm mb-3">No photos yet</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-primary text-sm font-medium"
            >
              Upload your first photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="relative aspect-square rounded-lg overflow-hidden group"
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
                {/* Set as Picture of the Week button */}
                <button
                  onClick={() => setAsPictureOfTheWeek(photo)}
                  disabled={settingCover === photo.id}
                  className="absolute bottom-1.5 right-1.5 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity active:opacity-100"
                  title="Set as Picture of the Week"
                >
                  {settingCover === photo.id ? (
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  ) : (
                    <Star className="w-3.5 h-3.5 text-primary" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default PhotoRepository;
