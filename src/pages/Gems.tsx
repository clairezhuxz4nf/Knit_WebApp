import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ImagePlus, Loader2, Plus, LayoutGrid } from "lucide-react";
import GemDetailModal from "@/components/gems/GemDetailModal";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import avatar images for sample data
import grandmaAvatar from "@/assets/avatars/grandma.png";

// Import family photos
import familyDinner from "@/assets/family/family-dinner.jpg";
import mountains from "@/assets/family/mountains.jpg";
import grandparentsPhoto from "@/assets/family/grandparents.jpg";
import momAvatar from "@/assets/avatars/mom.png";
import dadAvatar from "@/assets/avatars/dad.png";
import grandpaAvatar from "@/assets/avatars/grandpa.png";
import daughterAvatar from "@/assets/avatars/daughter.png";

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

const sampleFeed: FeedItem[] = [
  {
    id: "s1", type: "stories", title: "Learning to Read",
    description: "Grandma self-studied the dictionary and published her first poem at 50.",
    imageUrl: grandparentsPhoto, personName: "Grandma", avatarUrl: grandmaAvatar, likes: 4, liked: false,
  },
  {
    id: "p1", type: "podcasts", title: "Sunday Dumplings",
    description: "Dad shares his secret dumpling recipe passed down from his grandmother.",
    imageUrl: familyDinner, personName: "Dad", avatarUrl: dadAvatar, likes: 7, liked: true,
  },
  {
    id: "s2", type: "stories", title: "The Radio Engineer",
    description: "Grandpa built his first radio at 14. It still sits on his shelf today.",
    imageUrl: mountains, personName: "Grandpa", avatarUrl: grandpaAvatar, likes: 3, liked: false,
  },
  {
    id: "s3", type: "stories", title: "Paper & Poetry",
    description: "Grandma saved every scrap of paper to practice writing on at night.",
    imageUrl: grandparentsPhoto, personName: "Grandma", avatarUrl: grandmaAvatar, likes: 5, liked: false,
  },
  {
    id: "p2", type: "podcasts", title: "Small Town Dreams",
    description: "Mom and Dad built a business from nothing to leave their small town.",
    imageUrl: mountains, personName: "Mom", avatarUrl: momAvatar, likes: 9, liked: true,
  },
  {
    id: "s4", type: "stories", title: "First Piano Recital",
    description: "Mom said 'The notes already know where to go.' I played perfectly.",
    imageUrl: familyDinner, personName: "Me", avatarUrl: daughterAvatar, likes: 6, liked: false,
  },
  {
    id: "sb1", type: "storybooks", title: "Our Family Recipes",
    description: "A collection of recipes from grandma's noodle soup to dad's dumplings.",
    imageUrl: familyDinner, personName: "Family", avatarUrl: momAvatar, likes: 12, liked: true,
  },
];


const Gems = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [familySpaceId, setFamilySpaceId] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  
  const [feed, setFeed] = useState<FeedItem[]>(sampleFeed);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

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
                  <img src={item.avatarUrl} alt={item.personName} className="w-4 h-4 rounded-full object-cover border border-border" />
                  <span className="text-[10px] text-muted-foreground">{item.personName}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredFeed.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No items in this category yet</p>
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
        />
      )}

      <BottomNav />
    </MobileLayout>
  );
};

export default Gems;
