import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Import avatar images
import grandmaAvatar from "@/assets/avatars/grandma.png";
import momAvatar from "@/assets/avatars/mom.png";
import dadAvatar from "@/assets/avatars/dad.png";
import grandpaAvatar from "@/assets/avatars/grandpa.png";
import daughterAvatar from "@/assets/avatars/daughter.png";

interface Story {
  id: string;
  title: string;
  preview: string;
  personName: string;
  avatarUrl: string;
  createdAt: string;
}

const sampleStories: Story[] = [
  {
    id: "1",
    title: "Learning to Read",
    preview: "Grandma, like many Chinese women of her generation, was illiterate. Fortunately, working at a local bookstore, she had the liberty to read. She started by self-studying the dictionary. At the age of 50, she published her first poem.",
    personName: "Grandma",
    avatarUrl: grandmaAvatar,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Small Town Dreams",
    preview: "Parents never went to college. Aiming to leave the small town they lived in, they voraciously sought resources and eventually made their business succeed.",
    personName: "Mom & Dad",
    avatarUrl: momAvatar,
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    title: "Paper & Poetry",
    preview: "Grandma saved every scrap of paper—old calendars, flyers, the backs of envelopes. That's what she practiced writing on at night after work. She said words shouldn't be wasted just because paper was expensive. To this day, she writes grocery lists like they're poems.",
    personName: "Grandma",
    avatarUrl: grandmaAvatar,
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    title: "The Radio Engineer",
    preview: "Grandpa built his first radio from scratch when he was just 14. He saved up coins for months to buy the components, trading chores with neighbors. That radio still sits on his shelf, a reminder that curiosity has no price.",
    personName: "Grandpa",
    avatarUrl: grandpaAvatar,
    createdAt: "2024-04-05",
  },
  {
    id: "5",
    title: "Sunday Dumplings",
    preview: "Every Sunday morning, Dad would wake up early to make dumplings from scratch. He learned the recipe from his grandmother but added his own twist—a little ginger, a dash of sesame. Those mornings taught me that love is often measured in small folds of dough.",
    personName: "Dad",
    avatarUrl: dadAvatar,
    createdAt: "2024-05-12",
  },
  {
    id: "6",
    title: "First Piano Recital",
    preview: "I was terrified before my first piano recital. Mom held my hands and said, 'The notes already know where to go. You just have to let your fingers follow.' I played the whole piece without a mistake that day.",
    personName: "Me",
    avatarUrl: daughterAvatar,
    createdAt: "2024-06-01",
  },
];

const Stories = () => {
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
        <div className="grid grid-cols-2 gap-3">
          {sampleStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-card border border-border/50 rounded-xl p-3 shadow-soft cursor-pointer hover:shadow-cozy transition-all"
            >
              {/* Avatar in top right */}
              <Avatar className="absolute top-2 right-2 w-7 h-7 border-2 border-background shadow-sm">
                <AvatarImage src={story.avatarUrl} alt={story.personName} />
                <AvatarFallback className="text-xs bg-yarn-rose/20">
                  {story.personName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Story content */}
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
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default Stories;
