import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Check, X, Mail } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const projectTypes = {
  "culture-story": { label: "Culture Story", icon: "🌍", color: "sage" },
  "food-family": { label: "Food at Family", icon: "🍳", color: "butter" },
  "member-story": { label: "Member Story", icon: "👤", color: "rose" },
  "traditions": { label: "Traditions", icon: "🎋", color: "teal" },
  "milestone": { label: "Milestone", icon: "🎉", color: "rose" },
  "travel": { label: "Travel Memories", icon: "✈️", color: "sage" },
  "default": { label: "Project", icon: "📁", color: "sage" },
};

interface Project {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: string;
  created_by: string;
  updated_at: string;
  event_id: string | null;
  event?: {
    id: string;
    title: string;
    event_date: string;
  } | null;
}

interface PendingInvitation {
  id: string;
  project_id: string;
  invited_at: string;
  project: {
    id: string;
    title: string;
    description: string | null;
  };
  inviter_person?: {
    first_name: string;
    last_name: string | null;
  } | null;
}

const WorkingProjects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "mine" | "invited">("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user's person record to find their invitations
      const { data: personData } = await supabase
        .from("people")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch projects and pending invitations in parallel
      const [projectsResult, invitationsResult] = await Promise.all([
        supabase
          .from("projects")
          .select(`
            id,
            title,
            description,
            progress,
            status,
            created_by,
            updated_at,
            event_id,
            event:events(id, title, event_date)
          `)
          .order("updated_at", { ascending: false }),
        personData ? supabase
          .from("project_contributors")
          .select(`
            id,
            project_id,
            invited_at,
            project:projects(id, title, description)
          `)
          .eq("person_id", personData.id)
          .eq("status", "pending") : Promise.resolve({ data: [], error: null })
      ]);

      if (projectsResult.error) throw projectsResult.error;
      setProjects(projectsResult.data || []);

      if (!invitationsResult.error && invitationsResult.data) {
        setPendingInvitations(invitationsResult.data as unknown as PendingInvitation[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRespondToInvitation = async (invitationId: string, accept: boolean) => {
    setRespondingTo(invitationId);
    try {
      const { error } = await supabase
        .from("project_contributors")
        .update({
          status: accept ? "accepted" : "declined",
          responded_at: new Date().toISOString(),
          user_id: accept ? user?.id : null,
        })
        .eq("id", invitationId);

      if (error) throw error;

      toast.success(accept ? "Invitation accepted! You can now contribute to this project." : "Invitation declined.");
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error responding to invitation:", error);
      toast.error(error.message || "Failed to respond to invitation");
    } finally {
      setRespondingTo(null);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    if (filter === "mine") return p.created_by === user?.id;
    return p.created_by !== user?.id;
  });

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  };

  const getProjectType = (description: string | null) => {
    if (!description) return projectTypes.default;
    const key = Object.keys(projectTypes).find(k => 
      description.toLowerCase().includes(k.replace("-", " "))
    );
    return key ? projectTypes[key as keyof typeof projectTypes] : projectTypes.default;
  };

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

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="px-6 pb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CozyCard variant="elevated" className="border-2 border-primary/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {invitation.project?.title || "Unknown Project"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        You've been invited to collaborate
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRespondToInvitation(invitation.id, false)}
                        disabled={respondingTo === invitation.id}
                        className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleRespondToInvitation(invitation.id, true)}
                        disabled={respondingTo === invitation.id}
                        className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
                      >
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </button>
                    </div>
                  </div>
                </CozyCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project, index) => {
              const typeInfo = getProjectType(project.description);
              const isAdmin = project.created_by === user?.id;

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
                              {project.event ? project.event.title : typeInfo.label}
                            </p>
                          </div>
                          {isAdmin && (
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
                          {project.event?.event_date ? (
                            <>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(project.event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              {(() => {
                                const daysLeft = Math.ceil((new Date(project.event.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                if (daysLeft < 0) return <span className="text-muted-foreground">Past due</span>;
                                if (daysLeft === 0) return <span className="text-destructive font-medium">Due today</span>;
                                if (daysLeft <= 7) return <span className="text-destructive font-medium">{daysLeft} day{daysLeft > 1 ? 's' : ''} left</span>;
                                return <span className="text-primary">{daysLeft} days left</span>;
                              })()}
                            </>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getRelativeTime(project.updated_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>
                  </CozyCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
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
            className="w-9 h-9 rounded-full shadow-lifted p-0"
            onClick={() => navigate("/create-project")}
          >
            <span className="text-base">+</span>
          </CozyButton>
        </motion.div>
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default WorkingProjects;