import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Camera, ImagePlus, Loader2, Filter } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import avatar images for sample data
import grandmaAvatar from "@/assets/avatars/grandma.png";
import momAvatar from "@/assets/avatars/mom.png";
import dadAvatar from "@/assets/avatars/dad.png";
import grandpaAvatar from "@/assets/avatars/grandpa.png";
import daughterAvatar from "@/assets/avatars/daughter.png";

type ContentType = "all" | "stories" | "photos" | "podcasts" | "storybooks";

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

const sampleFeed: FeedItem[] = [
  {
    id: "s1",
    type: "stories",
    title: "Learning to Read",
    description: "Grandma was illiterate until she worked at a bookstore. She self-studied the dictionary and published her first poem at 50.",
    personName: "Grandma",
    avatarUrl: grandmaAvatar,
    likes: 4,
    liked: false,
  },
  {
    id: "p1",
    type: "podcasts",
    title: "Sunday Dumplings",
    description: "Dad shares the story behind his secret dumpling recipe — a tradition passed down from his grandmother with a twist of ginger.",
    personName: "Dad",
    avatarUrl: dadAvatar,
    likes: 7,
    liked: true,
  },
  {
    id: "s2",
    type: "stories",
    title: "The Radio Engineer",
    description: "Grandpa built his first radio from scratch at 14, saving coins for months. That radio still sits on his shelf today.",
    personName: "Grandpa",
    avatarUrl: grandpaAvatar,
    likes: 3,
    liked: false,
  },
  {
    id: "s3",
    type: "stories",
    title: "Paper & Poetry",
    description: "Grandma saved every scrap of paper to practice writing. She said words shouldn't be wasted just because paper was expensive.",
    personName: "Grandma",
    avatarUrl: grandmaAvatar,
    likes: 5,
    liked: false,
  },
  {
    id: "p2",
    type: "podcasts",
    title: "Small Town Dreams",
    description: "Mom and Dad never went to college but built a business from nothing. This episode tells the story of leaving their small town.",
    personName: "Mom",
    avatarUrl: momAvatar,
    likes: 9,
    liked: true,
  },
  {
    id: "s4",
    type: "stories",
    title: "First Piano Recital",
    description: "Mom held my hands and said 'The notes already know where to go.' I played without a mistake that day.",
    personName: "Me",
    avatarUrl: daughterAvatar,
    likes: 6,
    liked: false,
  },
  {
    id: "sb1",
    type: "storybooks",
    title: "Our Family Recipes",
    description: "A compiled collection of recipes passed down through generations — from grandma's noodle soup to dad's famous dumplings.",
    personName: "Family",
    avatarUrl: momAvatar,
    likes: 12,
    liked: true,
  },
];

const filterOptions: { value: ContentType; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "✨" },
  { value: "stories", label: "Stories", icon: "📝" },
  { value: "photos", label: "Photos", icon: "📸" },
  { value: "podcasts", label: "Podcasts", icon: "🎙️" },
  { value: "storybooks", label: "Storybooks", icon: "📚" },
];

const Gems = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [familySpaceId, setFamilySpaceId] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ContentType>("all");
  const [feed, setFeed] = useState<FeedItem[]>(sampleFeed);

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
      }
    };
    fetchData();
  }, [user]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !familySpaceId) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `covers/${familySpaceId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("family-gems").upload(filePath, file);
      if (uploadError) throw uploadError;
      await supabase.from("family_spaces").update({ cover_photo_url: filePath }).eq("id", familySpaceId);
      const { data: signedUrlData } = await supabase.storage.from("family-gems").createSignedUrl(filePath, 3600);
      if (signedUrlData?.signedUrl) setCoverPhotoUrl(signedUrlData.signedUrl);
      toast.success("Photo of the week updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const toggleLike = (id: string) => {
    setFeed((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
  };

  const filteredFeed = activeFilter === "all" ? feed : feed.filter((item) => item.type === activeFilter);

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
      <div className="px-6 pt-6 pb-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Family Gems</h1>
          <p className="text-muted-foreground text-sm mt-1">Your precious memories and stories</p>
        </motion.div>
      </div>

      {/* Picture of the Week */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-6 mb-5">
        <h2 className="font-display text-base font-semibold text-foreground mb-2">📷 Picture of the Week</h2>
        {coverPhotoUrl ? (
          <div
            className="relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => coverInputRef.current?.click()}
          >
            <img src={coverPhotoUrl} alt="Picture of the week" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-3">
                <Camera className="w-5 h-5 text-foreground" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
              <p className="text-xs font-medium text-foreground">Tap to change</p>
            </div>
          </div>
        ) : (
          <div
            className="aspect-[16/9] rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => coverInputRef.current?.click()}
          >
            {uploadingCover ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-yarn-rose/20 flex items-center justify-center mb-2">
                  <ImagePlus className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-sm font-semibold text-foreground">Add Picture of the Week</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Upload a family highlight</p>
              </>
            )}
          </div>
        )}
      </motion.div>

      <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />

      {/* Filter Chips */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="px-6 pb-6 space-y-5">
        {filteredFeed.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-soft"
          >
            {/* Card image area — placeholder gradient */}
            <div className="aspect-[16/10] bg-gradient-to-br from-yarn-rose/30 via-yarn-butter/20 to-yarn-sage/30 flex items-center justify-center">
              <span className="text-5xl">
                {item.type === "stories" ? "📝" : item.type === "podcasts" ? "🎙️" : item.type === "storybooks" ? "📚" : "📸"}
              </span>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <img src={item.avatarUrl} alt={item.personName} className="w-6 h-6 rounded-full object-cover border border-border" />
                  <span className="text-xs text-muted-foreground font-medium">{item.personName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                    {item.type === "storybooks" ? "storybook" : item.type.slice(0, -1)}
                  </span>
                </div>
                <button
                  onClick={() => toggleLike(item.id)}
                  className="flex items-center gap-1 group/like"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      item.liked ? "fill-primary text-primary" : "text-muted-foreground group-hover/like:text-primary"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">{item.likes}</span>
                </button>
              </div>
              <h3 className="font-display font-semibold text-sm text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.description}</p>
            </div>
          </motion.div>
        ))}

        {filteredFeed.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No items in this category yet</p>
          </div>
        )}
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default Gems;
