import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Image, BookOpen, FileText, ChevronRight } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import { useAuth } from "@/contexts/AuthContext";

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
  const [categories] = useState<AssetCategory[]>([
    { id: "photos", title: "Photos", description: "Family pictures and albums", icon: "📸", count: 0, color: "rose" },
    { id: "stories", title: "Stories", description: "Written memories and tales", icon: "📝", count: 0, color: "butter" },
    { id: "storybooks", title: "Storybooks", description: "Compiled family books", icon: "📚", count: 0, color: "sage" },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
              <p className="text-sm text-muted-foreground">
                Capture moments and stories to fill your treasure chest
              </p>
            </CozyCard>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default Gems;
