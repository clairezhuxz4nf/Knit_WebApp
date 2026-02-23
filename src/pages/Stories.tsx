import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Story {
  id: string;
  title: string;
  preview: string;
  personName: string;
  avatarUrl: string;
  createdAt: string;
}

const Stories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      if (!user) return;
      const { data: memberData } = await supabase
        .from("people")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberData) {
        const { data } = await supabase
          .from("story_bites")
          .select("*")
          .eq("family_space_id", memberData.family_space_id)
          .eq("content_type", "stories")
          .order("created_at", { ascending: false });

        if (data) {
          setStories(data.map((sb) => ({
            id: sb.id,
            title: sb.title,
            preview: sb.description || "",
            personName: sb.person_name || "Family",
            avatarUrl: sb.avatar_url || "",
            createdAt: sb.created_at,
          })));
        }
      }
      setLoading(false);
    };
    fetchStories();
  }, [user]);

  return (
    <MobileLayout className="pb-20">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => navigate("/gems")}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Stories
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Written memories and tales
            </p>
          </div>
        </motion.div>
      </div>

      {/* Stories Grid */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-muted-foreground text-sm">No stories yet</p>
            <p className="text-muted-foreground text-xs mt-1">Create your first story bite from the Gems page</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-card border border-border/50 rounded-xl p-3 shadow-soft cursor-pointer hover:shadow-cozy transition-all"
              >
                <Avatar className="absolute top-2 right-2 w-7 h-7 border-2 border-background shadow-sm">
                  <AvatarImage src={story.avatarUrl} alt={story.personName} />
                  <AvatarFallback className="text-xs bg-yarn-rose/20">
                    {story.personName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="pr-8">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1">
                    {story.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                  {story.preview}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-2">
                  {story.personName}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default Stories;
