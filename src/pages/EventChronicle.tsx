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
import EventSettingsModal from "@/components/chronicle/EventSettingsModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DbEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  event_category: string;
  icon: string | null;
  is_recurring: boolean;
  family_space_id: string;
  person_id: string | null;
}

interface ProjectInfo {
  id: string;
  title: string;
  progress: number;
  status: string;
  emoji: string | null;
  event_id: string | null;
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
}

interface EventSettings {
  hiddenEventIds: string[];
  hiddenCategories: string[];
}

const DEFAULT_SETTINGS: EventSettings = {
  hiddenEventIds: [],
  hiddenCategories: [],
};

const CATEGORY_COLORS: Record<string, "rose" | "sage" | "butter" | "teal"> = {
  birthday: "rose",
  festival: "sage",
  anniversary: "butter",
  custom: "teal",
  general: "teal",
};

const EventChronicle = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [familySpaceId, setFamilySpaceId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [eventSettings, setEventSettings] = useState<EventSettings>(DEFAULT_SETTINGS);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: memberData, error: memberError } = await supabase
        .from("people")
        .select("id, family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!memberData) {
        navigate("/welcome-page");
        return;
      }

      setFamilySpaceId(memberData.family_space_id);

      supabase.rpc("seed_default_festivals", {
        _family_space_id: memberData.family_space_id,
        _created_by: user.id,
      });

      const [eventsResult, projectsResult, settingsResult, invitationsResult] = await Promise.all([
        supabase
          .from("events")
          .select("id, title, event_date, event_type, event_category, icon, is_recurring, family_space_id, person_id")
          .eq("family_space_id", memberData.family_space_id),
        supabase
          .from("projects")
          .select("id, title, progress, status, emoji, event_id")
          .eq("family_space_id", memberData.family_space_id),
        supabase
          .from("user_event_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        memberData.id
          ? supabase
              .from("project_contributors")
              .select("id, project_id, invited_at, project:projects(id, title, description)")
              .eq("person_id", memberData.id)
              .eq("status", "pending")
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      setEvents(eventsResult.data || []);
      setProjects(projectsResult.data || []);

      if (!invitationsResult.error && invitationsResult.data) {
        setPendingInvitations(invitationsResult.data as unknown as PendingInvitation[]);
      }

      if (settingsResult.data) {
        const westernFestivals = settingsResult.data.western_festivals as Array<{ id: string; enabled: boolean }> | null;
        const hiddenIds = westernFestivals?.filter((f) => !f.enabled).map((f) => f.id) || [];
        setEventSettings({
          hiddenEventIds: hiddenIds,
          hiddenCategories: settingsResult.data.show_birthdays === false ? ["birthday"] : [],
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveSettings = async (newSettings: EventSettings) => {
    setEventSettings(newSettings);
  };

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
      toast.success(accept ? "Invitation accepted!" : "Invitation declined.");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to respond");
    } finally {
      setRespondingTo(null);
    }
  };

  const getProjectsForEvent = (eventId: string) => {
    return projects.filter((p) => p.event_id === eventId);
  };

  const getFilteredEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    const allProcessed = events
      .filter((event) => {
        if (eventSettings.hiddenEventIds.includes(event.id)) return false;
        if (eventSettings.hiddenCategories.includes(event.event_category)) return false;
        return true;
      })
      .map((event) => {
        let eventDate = new Date(event.event_date);
        if (event.is_recurring) {
          const thisYearDate = new Date(currentYear, eventDate.getMonth(), eventDate.getDate());
          if (thisYearDate < today) thisYearDate.setFullYear(currentYear + 1);
          eventDate = thisYearDate;
        }
        return {
          ...event,
          displayDate: eventDate,
          color: CATEGORY_COLORS[event.event_category] || ("teal" as const),
          isPast: !event.is_recurring && eventDate < today,
        };
      });

    const upcoming = allProcessed
      .filter((e) => !e.isPast)
      .sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());

    const past = allProcessed
      .filter((e) => e.isPast)
      .sort((a, b) => b.displayDate.getTime() - a.displayDate.getTime());

    return { upcoming, past };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysAgo = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.abs(Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const { upcoming: upcomingEvents, past: pastEvents } = getFilteredEvents();
  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  if (loading || dataLoading) {
    return (
      <MobileLayout className="flex items-center justify-center" showPattern>
        <YarnDecoration variant="ball" color="rose" className="w-12 h-12 animate-pulse-soft" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showPattern className="pb-20">
      <Header title="Chronicle" />

      <div className="flex-1 px-6 py-4 overflow-y-auto pb-24">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-center justify-center gap-4 mb-3">
            <YarnDecoration variant="wave" color="rose" className="w-32" />
            <CozyButton variant="secondary" size="sm" onClick={() => setShowSettings(true)}>
              Manage Events
            </CozyButton>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { value: "upcoming" as const, label: "Upcoming", count: upcomingEvents.length },
            { value: "past" as const, label: "Past", count: pastEvents.length },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Pending Invitations — only on upcoming tab */}
        {activeTab === "upcoming" && pendingInvitations.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Pending Invitations ({pendingInvitations.length})
            </h3>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <motion.div key={invitation.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <CozyCard variant="elevated" className="border-2 border-primary/20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{invitation.project?.title || "Unknown Project"}</h4>
                        <p className="text-xs text-muted-foreground">You've been invited to collaborate</p>
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

        {/* Yarn Timeline */}
        <div className="relative pb-8">
          <div className="space-y-4 ml-12">
            {displayEvents.map((event, index) => {
              const daysUntil = getDaysUntil(event.displayDate);
              const daysAgo = getDaysAgo(event.displayDate);
              const isLast = index === displayEvents.length - 1;
              const eventProjects = getProjectsForEvent(event.id);
              const isPast = activeTab === "past";

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="relative"
                >
                  {!isLast && (
                    <div
                      className="absolute -left-6 top-8 w-1"
                      style={{
                        height: "calc(100% + 16px)",
                        borderRadius: "4px",
                        boxShadow: "0 0 4px rgba(0,0,0,0.1)",
                        background: isPast
                          ? `repeating-linear-gradient(180deg, hsl(var(--muted-foreground) / 0.3) 0px, hsl(var(--muted-foreground) / 0.3) 8px, hsl(var(--muted-foreground) / 0.15) 8px, hsl(var(--muted-foreground) / 0.15) 16px)`
                          : `repeating-linear-gradient(180deg, hsl(var(--yarn-rose)) 0px, hsl(var(--yarn-rose)) 8px, hsl(var(--yarn-butter)) 8px, hsl(var(--yarn-butter)) 16px)`,
                      }}
                    />
                  )}

                  <div
                    className={`absolute -left-10 top-4 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md border-2 border-background z-10 ${
                      isPast ? "bg-muted" : event.color === "rose" ? "bg-yarn-rose" : event.color === "sage" ? "bg-yarn-sage" : event.color === "butter" ? "bg-yarn-butter" : "bg-yarn-teal"
                    }`}
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.1)" }}
                  >
                    <div
                      className="absolute inset-0 rounded-full opacity-30"
                      style={{ background: "repeating-linear-gradient(45deg, transparent 0px, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)" }}
                    />
                    <span className="relative z-10">{event.icon || "📅"}</span>
                  </div>

                  <CozyCard
                    variant="elevated"
                    className={`cursor-pointer hover:shadow-cozy transition-all group ${isPast ? "opacity-80" : ""}`}
                    onClick={() =>
                      navigate("/create-project", {
                        state: { event: event.title, date: event.displayDate.toISOString(), eventId: event.id, familySpaceId },
                      })
                    }
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                          isPast ? "bg-muted" : event.color === "rose" ? "bg-yarn-rose/20" : event.color === "sage" ? "bg-yarn-sage/20" : event.color === "butter" ? "bg-yarn-butter/20" : "bg-yarn-teal/20"
                        }`}
                      >
                        {event.icon || "📅"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground text-base truncate">{event.title}</h3>
                        <p className="text-xs text-muted-foreground mb-1">{formatDate(event.displayDate)}</p>
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                            isPast
                              ? "bg-muted text-muted-foreground"
                              : daysUntil <= 7 ? "bg-yarn-rose/20 text-yarn-rose" : daysUntil <= 30 ? "bg-yarn-butter/20 text-yarn-taupe" : "bg-yarn-sage/20 text-yarn-sage"
                          }`}
                        >
                          {isPast
                            ? daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`
                            : daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0" />
                    </div>

                    {/* Projects under this event */}
                    {eventProjects.length > 0 ? (
                      <div className="mt-3 pt-2 border-t border-border/50 space-y-1.5">
                        {eventProjects.map((proj) => (
                          <button
                            key={proj.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/project/${proj.id}`);
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left group/proj"
                          >
                            <span className="text-sm">{proj.emoji || "📁"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{proj.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      event.color === "rose" ? "bg-yarn-rose" : event.color === "sage" ? "bg-yarn-sage" : event.color === "butter" ? "bg-yarn-butter" : "bg-yarn-teal"
                                    }`}
                                    style={{ width: `${proj.progress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground">{proj.progress}%</span>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover/proj:text-primary transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : !isPast ? (
                      <div className="mt-3 pt-2 border-t border-border/50">
                        <p className="text-xs font-medium" style={{ color: "#C08686" }}>
                          Start preparing for this event
                        </p>
                      </div>
                    ) : null}
                  </CozyCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {displayEvents.length === 0 && (
          <CozyCard className="text-center py-12">
            <YarnDecoration variant="ball" color="sage" className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {activeTab === "upcoming" ? "No Upcoming Events" : "No Past Events"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {activeTab === "upcoming" ? "Add events in the settings or add birthdays to family members" : "Past events will appear here after they've passed"}
            </p>
            {activeTab === "upcoming" && (
              <CozyButton variant="primary" onClick={() => setShowSettings(true)}>
                Manage Events
              </CozyButton>
            )}
          </CozyCard>
        )}
      </div>

      <EventSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        events={events}
        settings={eventSettings}
        onSave={handleSaveSettings}
        familySpaceId={familySpaceId}
        onEventsChange={() => fetchData()}
      />

      <BottomNav />
    </MobileLayout>
  );
};

export default EventChronicle;
