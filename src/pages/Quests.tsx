import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Star, Gift, Lock, CheckCircle2 } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import { useAuth } from "@/contexts/AuthContext";

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  locked: boolean;
  icon: string;
}

const mockQuests: Quest[] = [
  {
    id: "1",
    title: "Family Starter",
    description: "Invite your first family member",
    reward: "🎉 Family Badge",
    progress: 0,
    maxProgress: 1,
    completed: false,
    locked: false,
    icon: "👨‍👩‍👧",
  },
  {
    id: "2",
    title: "Memory Keeper",
    description: "Create your first project",
    reward: "📸 Memory Frame",
    progress: 0,
    maxProgress: 1,
    completed: false,
    locked: false,
    icon: "📖",
  },
  {
    id: "3",
    title: "Story Weaver",
    description: "Add 5 stories to your chronicle",
    reward: "🧶 Golden Yarn",
    progress: 0,
    maxProgress: 5,
    completed: false,
    locked: false,
    icon: "✍️",
  },
  {
    id: "4",
    title: "Event Planner",
    description: "Add 3 family birthdays",
    reward: "🎂 Party Hat",
    progress: 0,
    maxProgress: 3,
    completed: false,
    locked: true,
    icon: "🗓️",
  },
  {
    id: "5",
    title: "Growing Tree",
    description: "Have 10 family members join",
    reward: "🌳 Family Tree Badge",
    progress: 0,
    maxProgress: 10,
    completed: false,
    locked: true,
    icon: "🌱",
  },
];

const Quests = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [quests] = useState<Quest[]>(mockQuests);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const completedCount = quests.filter((q) => q.completed).length;
  const totalQuests = quests.length;

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
      <div className="px-6 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl font-bold text-foreground">
            Family Quests
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete quests to unlock rewards
          </p>
        </motion.div>
      </div>

      {/* Progress overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6 mb-6"
      >
        <CozyCard>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent/30 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Your Progress</p>
              <p className="font-display text-xl font-bold text-foreground">
                {completedCount} / {totalQuests} Quests
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(completedCount / totalQuests) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CozyCard>
      </motion.div>

      {/* Active quests */}
      <div className="px-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Active Quests
        </h2>
        <div className="space-y-3">
          {quests
            .filter((q) => !q.locked)
            .map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <CozyCard
                  className={`cursor-pointer hover:shadow-cozy transition-all ${
                    quest.completed ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center text-2xl">
                      {quest.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {quest.title}
                        </h3>
                        {quest.completed && (
                          <CheckCircle2 className="w-4 h-4 text-secondary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {quest.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Gift className="w-3.5 h-3.5 text-accent-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {quest.reward}
                        </span>
                      </div>
                      {!quest.completed && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>
                              {quest.progress}/{quest.maxProgress}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full transition-all"
                              style={{
                                width: `${(quest.progress / quest.maxProgress) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CozyCard>
              </motion.div>
            ))}
        </div>

        {/* Locked quests */}
        <h2 className="font-display text-lg font-semibold text-foreground mb-3 mt-6">
          Locked Quests
        </h2>
        <div className="space-y-3 pb-6">
          {quests
            .filter((q) => q.locked)
            .map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.4 }}
              >
                <CozyCard className="opacity-60">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-muted-foreground">
                        {quest.title}
                      </h3>
                      <p className="text-sm text-muted-foreground/70">
                        {quest.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground/70">
                          Complete more quests to unlock
                        </span>
                      </div>
                    </div>
                  </div>
                </CozyCard>
              </motion.div>
            ))}
        </div>
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default Quests;
