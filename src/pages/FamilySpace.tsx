import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, FolderOpen, Plus, ChevronRight, LogOut } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface FamilyMember {
  id: string;
  display_name: string | null;
  birthday: string | null;
}

interface FamilySpaceData {
  id: string;
  name: string;
  family_code: string;
}

const FamilySpace = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [familySpace, setFamilySpace] = useState<FamilySpaceData | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeTab, setActiveTab] = useState<"chronicle" | "projects">("chronicle");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchFamilyData();
    }
  }, [user, loading, navigate]);

  const fetchFamilyData = async () => {
    if (!user) return;

    try {
      // Get family space the user belongs to
      const { data: memberData, error: memberError } = await supabase
        .from("family_members")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        // User is not in any family space
        navigate("/welcome-page");
        return;
      }

      // Get family space details
      const { data: spaceData, error: spaceError } = await supabase
        .from("family_spaces")
        .select("*")
        .eq("id", memberData.family_space_id)
        .single();

      if (spaceError) throw spaceError;
      setFamilySpace(spaceData);

      // Get all family members
      const { data: membersData, error: membersError } = await supabase
        .from("family_members")
        .select("id, display_name, birthday")
        .eq("family_space_id", memberData.family_space_id);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error("Error fetching family data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const getUpcomingEvents = () => {
    const events = [];
    const today = new Date();
    const year = today.getFullYear();

    // Add member birthdays
    members.forEach((member) => {
      if (member.birthday) {
        const bday = new Date(member.birthday);
        const thisYearBday = new Date(year, bday.getMonth(), bday.getDate());
        if (thisYearBday < today) {
          thisYearBday.setFullYear(year + 1);
        }
        events.push({
          id: `bday-${member.id}`,
          title: `${member.display_name || "Family Member"}'s Birthday`,
          date: thisYearBday,
          type: "birthday",
          icon: "🎂",
        });
      }
    });

    // Add Christmas
    const christmas = new Date(year, 11, 25);
    if (christmas < today) christmas.setFullYear(year + 1);
    events.push({
      id: "christmas",
      title: "Christmas",
      date: christmas,
      type: "holiday",
      icon: "🎄",
    });

    // Add Lunar New Year
    const lunar = new Date(year + 1, 0, 29);
    events.push({
      id: "lunar",
      title: "Chinese Lunar New Year",
      date: lunar,
      type: "holiday",
      icon: "🧧",
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  };

  const workingProjects = [
    {
      id: "1",
      title: "Grandma's Recipe Collection",
      type: "Food at Family",
      progress: 65,
      contributors: 3,
    },
    {
      id: "2",
      title: "Dad's Childhood Stories",
      type: "Member Story",
      progress: 30,
      contributors: 2,
    },
  ];

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading || dataLoading) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <YarnDecoration variant="ball" color="rose" className="w-12 h-12 animate-pulse-soft" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <Header
        showSettings
        onSettingsClick={() => navigate("/family-settings")}
        rightElement={
          <div className="flex items-center gap-2">
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
            <img src={logo} alt="Knit" className="w-8 h-8 object-contain" />
          </div>
        }
      />

      {/* Welcome Section */}
      <div className="px-6 pt-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl font-bold text-foreground">
            {familySpace?.name || "Your Family"} Space
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Weaving memories together
          </p>
        </motion.div>
      </div>

      {/* Tab Switcher */}
      <div className="px-6 mb-4">
        <div className="bg-muted p-1 rounded-xl flex">
          <button
            onClick={() => setActiveTab("chronicle")}
            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              activeTab === "chronicle"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Chronicle
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              activeTab === "projects"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Projects
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        {activeTab === "chronicle" ? (
          <motion.div
            key="chronicle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Upcoming Milestones
              </h2>
              <button
                onClick={() => navigate("/event-chronicle")}
                className="text-sm text-primary font-medium"
              >
                View All
              </button>
            </div>

            {/* Yarn Timeline */}
            <div className="yarn-timeline space-y-4">
              {getUpcomingEvents().map((event, index) => {
                const daysUntil = getDaysUntil(event.date);
                const colorClass =
                  index % 3 === 0 ? "" : index % 3 === 1 ? "sage" : "butter";

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`yarn-node ${colorClass}`}
                  >
                    <CozyCard
                      className="cursor-pointer hover:shadow-cozy transition-all"
                      onClick={() =>
                        navigate("/create-project", {
                          state: { event: event.title, date: event.date },
                        })
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{event.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {event.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.date)} •{" "}
                            {daysUntil === 0
                              ? "Today!"
                              : daysUntil === 1
                              ? "Tomorrow"
                              : `In ${daysUntil} days`}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CozyCard>
                  </motion.div>
                );
              })}
            </div>

            {getUpcomingEvents().length === 0 && (
              <CozyCard className="text-center py-8">
                <YarnDecoration
                  variant="ball"
                  color="sage"
                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                />
                <p className="text-muted-foreground">
                  No upcoming events yet. Add birthdays in family settings!
                </p>
              </CozyCard>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="projects"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Working Projects
              </h2>
              <button
                onClick={() => navigate("/working-projects")}
                className="text-sm text-primary font-medium"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {workingProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CozyCard
                    className="cursor-pointer hover:shadow-cozy transition-all"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center">
                        <YarnDecoration
                          variant="ball"
                          color={index % 2 === 0 ? "rose" : "sage"}
                          className="w-6 h-6"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {project.type} • {project.contributors} contributors
                        </p>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground mt-2" />
                    </div>
                  </CozyCard>
                </motion.div>
              ))}
            </div>

            {workingProjects.length === 0 && (
              <CozyCard className="text-center py-8">
                <YarnDecoration
                  variant="heart"
                  color="rose"
                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                />
                <p className="text-muted-foreground">
                  No projects yet. Start your first story!
                </p>
              </CozyCard>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="fixed bottom-6 right-6"
      >
        <CozyButton
          variant="primary"
          className="w-14 h-14 rounded-full shadow-lifted p-0"
          onClick={() => navigate("/create-project")}
        >
          <Plus className="w-6 h-6" />
        </CozyButton>
      </motion.div>
    </MobileLayout>
  );
};

export default FamilySpace;
