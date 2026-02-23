import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ImagePlus, Loader2, Plus, LayoutGrid } from "lucide-react";
import GemDetailModal from "@/components/gems/GemDetailModal";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ContentType = "stories" | "photos" | "podcasts" | "storybooks";

interface FeedItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  imageUrl?: string;
  personName: string;
  avatarUrl: string;
  likes: number;
  liked: boolean;
}


const Gems = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [familySpaceId, setFamilySpaceId] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Auto-open story bite from query param (e.g. returning from /select-photo)
  useEffect(() => {
    const openId = searchParams.get("openStoryBite");
    if (openId && feed.length > 0 && !selectedItem) {
      const match = feed.find((f) => f.id === openId);
      if (match) {
        setSelectedItem(match);
        setSearchParams({}, { replace: true });
      }
    }
  }, [feed, searchParams]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: memberData } = await supabase
        .from("people")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberData) {
        setFamilySpaceId(memberData.family_space_id);
        
        // Fetch cover photo
        const { data: spaceData } = await supabase
          .from("family_spaces")
          .select("cover_photo_url")
          .eq("id", memberData.family_space_id)
          .single();

        if (spaceData?.cover_photo_url) {
          const coverPath = spaceData.cover_photo_url;
          const pathForSigning = coverPath.startsWith("http")
            ? coverPath.match(/family-gems\/(.+)$/)?.[1] || coverPath
            : coverPath;
          if (!coverPath.startsWith("http") || pathForSigning !== coverPath) {
            const { data: signedData } = await supabase.storage
              .from("family-gems")
              .createSignedUrl(pathForSigning, 3600);
            if (signedData?.signedUrl) setCoverPhotoUrl(signedData.signedUrl);
          }
        }

        // Fetch story bites for this family
        const { data: storyBites } = await supabase
          .from("story_bites")
          .select("*")
          .eq("family_space_id", memberData.family_space_id)
          .order("created_at", { ascending: false });

        if (storyBites) {
          // Sign image URLs for private bucket
          const feedItems: FeedItem[] = await Promise.all(storyBites.map(async (sb) => {
            let imageUrl: string | undefined;

            // First try linked photos from story_bite_photos
            if (!imageUrl) {
              const { data: linkedPhotos } = await supabase
                .from("story_bite_photos")
                .select("family_photos(file_path)")
                .eq("story_bite_id", sb.id)
                .order("sort_order", { ascending: true })
                .limit(1);

              const firstLinkedPath = (linkedPhotos as any)?.[0]?.family_photos?.file_path;
              if (firstLinkedPath) {
                const { data: signedData } = await supabase.storage
                  .from("family-gems")
                  .createSignedUrl(firstLinkedPath, 3600);
                imageUrl = signedData?.signedUrl || undefined;
              }
            }

            // Fallback to story bite's own image
            if (!imageUrl && sb.image_url) {
              if (sb.image_url.startsWith("http")) {
                imageUrl = sb.image_url;
              } else {
                const { data: signedData } = await supabase.storage
                  .from("family-gems")
                  .createSignedUrl(sb.image_url, 3600);
                imageUrl = signedData?.signedUrl || undefined;
              }
            }

            // Resolve avatar from people table
            let avatarUrl = sb.avatar_url || "";
            let personName = sb.person_name || "Family";
            if (!avatarUrl) {
              const { data: personData } = await supabase
                .from("people")
                .select("avatar_url, first_name")
                .eq("user_id", sb.created_by)
                .eq("family_space_id", memberData.family_space_id)
                .maybeSingle();
              if (personData?.avatar_url) {
                // Sign if it's a storage path
                if (personData.avatar_url.startsWith("http")) {
                  avatarUrl = personData.avatar_url;
                } else {
                  const { data: signedAvatar } = await supabase.storage
                    .from("avatars")
                    .createSignedUrl(personData.avatar_url, 3600);
                  avatarUrl = signedAvatar?.signedUrl || "";
                }
              }
              if (!personName || personName === "Family") {
                personName = personData?.first_name || "Family";
              }
            }

            return {
              id: sb.id,
              type: (sb.content_type || "stories") as ContentType,
              title: sb.title,
              description: sb.description || "",
              imageUrl,
              personName,
              avatarUrl,
              likes: sb.likes || 0,
              liked: false,
            };
          }));
          setFeed(feedItems);
        }
      }
      setLoadingFeed(false);
    };
    fetchData();
  }, [user]);


  const toggleLike = (id: string) => {
    setFeed((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
  };

  const filteredFeed = feed;

  if (loading) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="pb-20">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex items-start justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Family Gems</h1>
          <p className="text-muted-foreground text-sm mt-1">Your precious memories and stories</p>
        </motion.div>
        <button
          onClick={() => navigate("/create-story-bite")}
          className="mt-1 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform shrink-0"
          aria-label="Add story bite"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {/* Picture of the Week */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-6 mb-5">
        <h2 className="font-display text-base font-semibold text-foreground mb-2">📷 Picture of the Week</h2>
        {coverPhotoUrl ? (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
            <img src={coverPhotoUrl} alt="Picture of the week" className="w-full h-full object-cover" />
            <button
              onClick={() => navigate("/photo-repository")}
              className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:scale-105 active:scale-95 transition-transform shadow-sm"
              aria-label="View all photos"
            >
              <LayoutGrid className="w-4 h-4 text-foreground" />
            </button>
          </div>
        ) : (
          <div
            className="aspect-[16/9] rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate("/photo-repository")}
          >
            <div className="w-14 h-14 rounded-full bg-yarn-rose/20 flex items-center justify-center mb-2">
              <ImagePlus className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-sm font-semibold text-foreground">Add Picture of the Week</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Browse the photo repository</p>
          </div>
        )}
      </motion.div>

      


      {/* Feed Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {filteredFeed.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-soft cursor-pointer active:scale-[0.97] transition-transform"
            >
              {/* Card image */}
              <div className="aspect-square relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yarn-rose/30 via-yarn-butter/20 to-yarn-sage/30 flex items-center justify-center">
                    <span className="text-3xl">
                      {item.type === "stories" ? "📝" : item.type === "podcasts" ? "🎙️" : item.type === "storybooks" ? "📚" : "📸"}
                    </span>
                  </div>
                )}
                {/* Like button overlay */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(item.id); }}
                  className="absolute top-1.5 right-1.5 bg-background/70 backdrop-blur-sm rounded-full p-1 flex items-center gap-0.5"
                >
                  <Heart className={`w-3 h-3 ${item.liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  <span className="text-[10px] text-muted-foreground pr-0.5">{item.likes}</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-2.5">
                <h3 className="font-display font-semibold text-xs text-foreground line-clamp-1">{item.title}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">{item.description}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt={item.personName} className="w-4 h-4 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center">
                      <span className="text-[7px] font-semibold text-muted-foreground">{item.personName[0]}</span>
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground">{item.personName}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!loadingFeed && filteredFeed.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-muted-foreground text-sm">No story bites yet</p>
            <p className="text-muted-foreground text-xs mt-1">Tap + to create your first one</p>
          </div>
        )}
        {loadingFeed && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
      </div>

      {selectedItem && (
        <GemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onToggleLike={(id) => {
            toggleLike(id);
            setSelectedItem((prev) =>
              prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : null
            );
          }}
          onDelete={(id) => {
            setFeed((prev) => prev.filter((item) => item.id !== id));
            setSelectedItem(null);
          }}
          onUpdate={(id, updates) => {
            setFeed((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
            setSelectedItem((prev) => prev ? { ...prev, ...updates } : null);
          }}
        />
      )}

      <BottomNav />
    </MobileLayout>
  );
};

export default Gems;
