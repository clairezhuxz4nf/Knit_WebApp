import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Users, Clock } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import YarnDecoration from "@/components/ui/YarnDecoration";

const projectTypes = {
  "culture-story": { label: "Culture Story", icon: "🌍", color: "sage" },
  "food-family": { label: "Food at Family", icon: "🍳", color: "butter" },
  "member-story": { label: "Member Story", icon: "👤", color: "rose" },
  "traditions": { label: "Traditions", icon: "🎋", color: "teal" },
};

const WorkingProjects = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "mine" | "invited">("all");

  const projects = [
    {
      id: "1",
      title: "Grandma's Recipe Collection",
      type: "food-family" as keyof typeof projectTypes,
      progress: 65,
      contributors: ["Mom", "Aunt Lisa", "You"],
      lastUpdated: "2 hours ago",
      isAdmin: true,
    },
    {
      id: "2",
      title: "Dad's Childhood Stories",
      type: "member-story" as keyof typeof projectTypes,
      progress: 30,
      contributors: ["Dad", "You"],
      lastUpdated: "Yesterday",
      isAdmin: false,
    },
    {
      id: "3",
      title: "Spring Festival Traditions",
      type: "culture-story" as keyof typeof projectTypes,
      progress: 80,
      contributors: ["Grandpa", "Mom", "Dad", "You"],
      lastUpdated: "3 days ago",
      isAdmin: true,
    },
    {
      id: "4",
      title: "Thanksgiving 2024 Memories",
      type: "traditions" as keyof typeof projectTypes,
      progress: 15,
      contributors: ["You", "Sister"],
      lastUpdated: "1 week ago",
      isAdmin: true,
    },
  ];

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    if (filter === "mine") return p.isAdmin;
    return !p.isAdmin;
  });

  return (
    <MobileLayout className="pb-20">
      <Header title="Working Projects" />

      {/* Filter Tabs */}
      <div className="px-6 py-4">
        <div className="flex gap-2">
          {[
            { value: "all", label: "All" },
            { value: "mine", label: "My Projects" },
            { value: "invited", label: "Invited" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as typeof filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        <div className="space-y-3">
          {filteredProjects.map((project, index) => {
            const typeInfo = projectTypes[project.type];

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <CozyCard
                  variant="elevated"
                  className="cursor-pointer hover:shadow-cozy transition-all group"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        typeInfo.color === "rose"
                          ? "bg-yarn-rose/20"
                          : typeInfo.color === "sage"
                          ? "bg-yarn-sage/20"
                          : typeInfo.color === "butter"
                          ? "bg-yarn-butter/20"
                          : "bg-yarn-teal/20"
                      }`}
                    >
                      {typeInfo.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground truncate">
                            {project.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {typeInfo.label}
                          </p>
                        </div>
                        {project.isAdmin && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                            Admin
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            {project.progress}% complete
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              typeInfo.color === "rose"
                                ? "bg-yarn-rose"
                                : typeInfo.color === "sage"
                                ? "bg-yarn-sage"
                                : typeInfo.color === "butter"
                                ? "bg-yarn-butter"
                                : "bg-yarn-teal"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                          />
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {project.contributors.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {project.lastUpdated}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                </CozyCard>
              </motion.div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CozyCard className="text-center py-12">
              <YarnDecoration
                variant="ball"
                color="rose"
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                No Projects Found
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                {filter === "invited"
                  ? "You haven't been invited to any projects yet"
                  : "Start creating stories with your family"}
              </p>
              <CozyButton
                variant="primary"
                onClick={() => navigate("/create-project")}
              >
                Create Project
              </CozyButton>
            </CozyCard>
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="absolute right-6 bottom-0 pointer-events-auto"
        >
          <CozyButton
            variant="primary"
            className="w-7 h-7 rounded-full shadow-lifted p-0"
            onClick={() => navigate("/create-project")}
          >
            <span className="text-sm">+</span>
          </CozyButton>
        </motion.div>
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default WorkingProjects;