import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Calendar, FolderOpen, Trophy, User, Gem } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    path: "/family",
    label: "Family",
    icon: Users,
  },
  {
    path: "/event-chronicle",
    label: "Chronicle",
    icon: Calendar,
  },
  {
    path: "/working-projects",
    label: "Projects",
    icon: FolderOpen,
  },
  {
    path: "/quests",
    label: "Quests",
    icon: Trophy,
  },
  {
    path: "/gems",
    label: "Gems",
    icon: Gem,
  },
  {
    path: "/profile",
    label: "Profile",
    icon: User,
  },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 py-1.5 px-0.5 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                  className="absolute inset-0.5 rounded-xl bg-yarn-cream"
                />
              )}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                className="relative z-10"
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? "bg-primary/20 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </motion.div>
              <span
                className={`relative z-10 text-[10px] mt-0.5 font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;