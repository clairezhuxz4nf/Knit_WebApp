import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const StorybookPreview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const storyBiteId = searchParams.get("storyBiteId");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("storybook.png");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchStorybook = async () => {
      if (!storyBiteId) return;

      const { data } = await supabase
        .from("storybooks")
        .select("file_path, file_name")
        .eq("story_bite_id", storyBiteId)
        .maybeSingle();

      if (data) {
        setFileName(data.file_name);
        // If it's a public path (starts with /), use directly
        if (data.file_path.startsWith("/")) {
          setImageUrl(data.file_path);
        } else {
          const { data: signedData } = await supabase.storage
            .from("family-gems")
            .createSignedUrl(data.file_path, 3600);
          if (signedData?.signedUrl) setImageUrl(signedData.signedUrl);
        }
      }
      setLoading(false);
    };
    fetchStorybook();
  }, [storyBiteId]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch {
      toast.error("Failed to download");
    }
  };

  const handleBack = () => {
    if (storyBiteId) {
      navigate(`/gems?openStoryBite=${storyBiteId}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  if (authLoading || loading) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={handleBack} className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-display text-sm font-semibold text-foreground">Storybook</h2>
        <button
          onClick={handleDownload}
          disabled={!imageUrl}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Storybook content */}
      <div className="flex-1 overflow-y-auto">
        {imageUrl ? (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={imageUrl}
            alt="Storybook"
            className="w-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <span className="text-4xl mb-3">📚</span>
            <p className="text-muted-foreground text-sm">No storybook attached yet</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default StorybookPreview;
