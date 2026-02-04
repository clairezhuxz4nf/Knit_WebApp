import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, Headphones } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import grandmaAvatar from "@/assets/avatars/grandma.png";
import grandpaAvatar from "@/assets/avatars/grandpa.png";
import momAvatar from "@/assets/avatars/mom.png";
import dadAvatar from "@/assets/avatars/dad.png";

interface Podcast {
  id: string;
  title: string;
  description: string;
  duration: string;
  personName: string;
  avatarUrl: string;
  plays: number;
  date: string;
}

const samplePodcasts: Podcast[] = [
  {
    id: "1",
    title: "Grandma's Journey to Literacy",
    description: "The inspiring story of how grandma taught herself to read and became a published poet at 50.",
    duration: "12:34",
    personName: "Grandma",
    avatarUrl: grandmaAvatar,
    plays: 24,
    date: "2 days ago",
  },
  {
    id: "2",
    title: "The Small Town Escape",
    description: "Mom and Dad share how they built their business from scratch to leave their hometown.",
    duration: "18:22",
    personName: "Mom & Dad",
    avatarUrl: momAvatar,
    plays: 18,
    date: "1 week ago",
  },
  {
    id: "3",
    title: "Grandpa's War Stories",
    description: "Grandpa recalls his experiences during the war and the lessons that shaped his life.",
    duration: "25:10",
    personName: "Grandpa",
    avatarUrl: grandpaAvatar,
    plays: 31,
    date: "2 weeks ago",
  },
  {
    id: "4",
    title: "The Recipe Box Secrets",
    description: "Grandma reveals the stories behind her most treasured family recipes.",
    duration: "15:45",
    personName: "Grandma",
    avatarUrl: grandmaAvatar,
    plays: 42,
    date: "3 weeks ago",
  },
  {
    id: "5",
    title: "Dad's First Job",
    description: "Dad shares humorous stories from his first job and the valuable lessons learned.",
    duration: "9:18",
    personName: "Dad",
    avatarUrl: dadAvatar,
    plays: 15,
    date: "1 month ago",
  },
];

const Podcasts = () => {
  const navigate = useNavigate();

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
              Family Podcasts
            </h1>
            <p className="text-muted-foreground text-sm">
              Audio stories from your loved ones
            </p>
          </div>
        </motion.div>
      </div>

      {/* Podcast List */}
      <div className="px-6 space-y-4 pb-6">
        {samplePodcasts.map((podcast, index) => (
          <motion.div
            key={podcast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CozyCard className="cursor-pointer hover:shadow-cozy transition-all">
              <div className="flex gap-4">
                {/* Play Button & Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-yarn-rose/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary fill-primary" />
                  </div>
                  <Avatar className="absolute -bottom-1 -right-1 w-7 h-7 border-2 border-background">
                    <AvatarImage src={podcast.avatarUrl} alt={podcast.personName} />
                    <AvatarFallback className="text-xs">{podcast.personName[0]}</AvatarFallback>
                  </Avatar>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {podcast.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {podcast.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {podcast.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      {podcast.plays} plays
                    </span>
                    <span>{podcast.date}</span>
                  </div>
                </div>
              </div>
            </CozyCard>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default Podcasts;
