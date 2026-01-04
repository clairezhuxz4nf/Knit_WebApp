import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Image, BookOpen, FileText, Sparkles } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyCard from "@/components/ui/CozyCard";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AssetCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  count: number;
  color: string;
}

const Gems = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<AssetCategory[]>([
    { id: "photos", title: "Photos", icon: Image, count: 0, color: "bg-rose-100 text-rose-600" },
    { id: "stories", title: "Stories", icon: FileText, count: 0, color: "bg-amber-100 text-amber-600" },
    { id: "storybooks", title: "Storybooks", icon: BookOpen, count: 0, color: "bg-emerald-100 text-emerald-600" },
  ]);

  useEffect(() => {
    // Simulate loading - in future, fetch actual asset counts
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <YarnDecoration variant="ball" color="rose" className="w-12 h-12 animate-pulse-soft" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <Header title="Family Gems" />

      <div className="flex-1 px-6 py-4 overflow-y-auto pb-24 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 to-rose-200 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            Your Family Treasures
          </h2>
          <p className="text-sm text-muted-foreground">
            Precious memories and stories collected over time
          </p>
        </motion.div>

        {/* Asset Categories */}
        <div className="space-y-3">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CozyCard className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className={`p-3 rounded-xl ${category.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.count} items
                    </p>
                  </div>
                  <div className="text-muted-foreground">→</div>
                </CozyCard>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-8"
        >
          <p className="text-sm text-muted-foreground">
            Start capturing moments and stories to fill your treasure chest!
          </p>
        </motion.div>

        {/* Decorative Element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center pt-4"
        >
          <YarnDecoration variant="wave" color="butter" className="w-32" />
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default Gems;
