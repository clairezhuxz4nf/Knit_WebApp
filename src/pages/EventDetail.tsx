import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Calendar, ChevronRight, Settings2, Image as ImageIcon } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventData {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  event_category: string;
  icon: string | null;
  is_recurring: boolean;
  family_space_id: string;
  person_id: string | null;
  description: string | null;
}

interface ProjectWithAssets {
  id: string;
  title: string;
  progress: number;
  status: string;
  emoji: string | null;
  created_at: string;
  cover_image_url: string | null;
}

interface AssetFile {
  name: string;
  url: string;
  created_at: string;
}

const EventDetail = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [projects, setProjects] = useState<ProjectWithAssets[]>([]);
  const [assets, setAssets] = useState<Record<string, AssetFile[]>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editingIcon, setEditingIcon] = useState(false);
  const [editIcon, setEditIcon] = useState("");

  const primaryEvent = events[0];
  const allEventIds = events.map((e) => e.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user && eventId) {
      fetchData();
    }
  }, [user, loading, eventId]);

  const fetchData = async () => {
    if (!user || !eventId) return;
    try {
      // First get this event to find its title, then get all events with same title
      const { data: mainEvent, error: mainErr } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();

      if (mainErr) throw mainErr;
      if (!mainEvent) {
        toast.error("Event not found");
        navigate("/event-chronicle");
        return;
      }

      // Get all events with same title (deduped group)
      const { data: allEvents, error: allErr } = await supabase
        .from("events")
        .select("*")
        .eq("family_space_id", mainEvent.family_space_id)
        .eq("title", mainEvent.title);

      if (allErr) throw allErr;
      setEvents(allEvents || [mainEvent]);

      const eventIds = (allEvents || [mainEvent]).map((e: EventData) => e.id);

      // Get all projects linked to these events
      const { data: projectsData, error: projErr } = await supabase
        .from("projects")
        .select("id, title, progress, status, emoji, created_at, cover_image_url")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });

      if (projErr) throw projErr;
      setProjects(projectsData || []);

      // Fetch assets for each project from storage
      const assetMap: Record<string, AssetFile[]> = {};
      for (const proj of projectsData || []) {
        const { data: files } = await supabase.storage
          .from("project-assets")
          .list(proj.id, { limit: 20 });

        if (files && files.length > 0) {
          assetMap[proj.id] = files.map((f) => {
            const { data: urlData } = supabase.storage
              .from("project-assets")
              .getPublicUrl(`${proj.id}/${f.name}`);
            return {
              name: f.name,
              url: urlData.publicUrl,
              created_at: f.created_at || "",
            };
          });
        }
      }
      setAssets(assetMap);
    } catch (error) {
      console.error("Error fetching event detail:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleUpdateEvent = async (updates: Partial<EventData>) => {
    if (!primaryEvent) return;
    try {
      const { error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", primaryEvent.id);
      if (error) throw error;
      toast.success("Event updated");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    }
  };

  const getDisplayDate = () => {
    if (!primaryEvent) return "";
    const d = new Date(primaryEvent.event_date);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  const projectsByYear = projects.reduce<Record<number, ProjectWithAssets[]>>((acc, p) => {
    const year = new Date(p.created_at).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(p);
    return acc;
  }, {});

  const sortedYears = Object.keys(projectsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  const currentYear = new Date().getFullYear();
  const hasCurrentYearProject = sortedYears.includes(currentYear);

  if (loading || dataLoading) {
    return (
      <MobileLayout className="flex items-center justify-center" showPattern>
        <YarnDecoration variant="ball" color="rose" className="w-12 h-12 animate-pulse-soft" />
      </MobileLayout>
    );
  }

  if (!primaryEvent) return null;

  return (
    <MobileLayout showPattern className="pb-20">
      <Header title="Event Detail" showBack />

      <div className="flex-1 px-6 py-4 overflow-y-auto pb-24">
        {/* Event Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <CozyCard variant="elevated" className="text-center">
            <button
              onClick={() => {
                setEditIcon(primaryEvent.icon || "📅");
                setEditingIcon(true);
              }}
              className="text-4xl mb-2 hover:scale-110 transition-transform inline-block"
            >
              {primaryEvent.icon || "📅"}
            </button>
            {editingIcon && (
              <div className="flex items-center gap-2 justify-center mb-2">
                <input
                  type="text"
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  className="w-16 text-center text-2xl bg-muted rounded-lg p-1"
                  maxLength={2}
                  autoFocus
                />
                <CozyButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleUpdateEvent({ icon: editIcon });
                    setEditingIcon(false);
                  }}
                >
                  Save
                </CozyButton>
                <CozyButton variant="ghost" size="sm" onClick={() => setEditingIcon(false)}>
                  Cancel
                </CozyButton>
              </div>
            )}

            {editingTitle ? (
              <div className="flex items-center gap-2 justify-center mb-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-display font-bold text-center bg-muted rounded-lg px-3 py-1"
                  autoFocus
                />
                <CozyButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleUpdateEvent({ title: editTitle });
                    setEditingTitle(false);
                  }}
                >
                  Save
                </CozyButton>
                <CozyButton variant="ghost" size="sm" onClick={() => setEditingTitle(false)}>
                  Cancel
                </CozyButton>
              </div>
            ) : (
              <h1
                className="font-display text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                  setEditTitle(primaryEvent.title);
                  setEditingTitle(true);
                }}
              >
                {primaryEvent.title}
              </h1>
            )}

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="w-4 h-4" />
              <span>{getDisplayDate()}</span>
              {primaryEvent.is_recurring && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Recurring</span>
              )}
            </div>

            {primaryEvent.description && (
              <p className="text-sm text-muted-foreground mt-2">{primaryEvent.description}</p>
            )}
          </CozyCard>
        </motion.div>

        {/* Start New Project CTA */}
        {!hasCurrentYearProject && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <CozyButton
              variant="primary"
              className="w-full"
              onClick={() =>
                navigate("/create-project", {
                  state: {
                    event: primaryEvent.title,
                    date: primaryEvent.event_date,
                    eventId: primaryEvent.id,
                    familySpaceId: primaryEvent.family_space_id,
                  },
                })
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Start {currentYear} Project
            </CozyButton>
          </motion.div>
        )}

        {/* Projects by Year */}
        {sortedYears.length > 0 ? (
          <div className="space-y-4">
            {sortedYears.map((year, yi) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: yi * 0.08 }}
              >
                <h2 className="font-display text-sm font-bold text-muted-foreground mb-2">{year}</h2>
                <div className="space-y-2">
                  {projectsByYear[year].map((project) => (
                    <CozyCard
                      key={project.id}
                      variant="elevated"
                      padding="sm"
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{project.emoji || "📁"}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            {project.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{project.progress}%</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>

                      {/* Assets Preview */}
                      {assets[project.id] && assets[project.id].length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                          {assets[project.id].slice(0, 4).map((asset, ai) => (
                            <img
                              key={ai}
                              src={asset.url}
                              alt={asset.name}
                              className="w-14 h-14 rounded-lg object-cover shrink-0 border border-border/50"
                              loading="lazy"
                            />
                          ))}
                          {assets[project.id].length > 4 && (
                            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                              <span className="text-xs text-muted-foreground font-medium">
                                +{assets[project.id].length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CozyCard>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <CozyCard className="text-center py-8">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-display text-base font-semibold text-foreground mb-1">No Projects Yet</h3>
            <p className="text-muted-foreground text-sm">
              Start a project to collect memories for this event
            </p>
          </CozyCard>
        )}
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default EventDetail;
