import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Check, X, Mail, Plus } from "lucide-react";
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
  created_at: string;
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
  const currentYear = new Date().getFullYear();
  

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
          .select("id, title, progress, status, emoji, event_id, created_at")
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

  // Group projects by year for an event, plus generate year rows
  const getYearRowsForEvent = (eventId: string, isUpcoming: boolean) => {
    const eventProjects = getProjectsForEvent(eventId);
    const projectsByYear: Record<number, ProjectInfo> = {};
    eventProjects.forEach((p) => {
      const year = new Date(p.created_at).getFullYear();
      projectsByYear[year] = p;
    });

    const years: number[] = [];
    if (isUpcoming) {
      // Show current year first (Start), then past years descending
      years.push(currentYear);
      const pastYears = Object.keys(projectsByYear)
        .map(Number)
        .filter((y) => y < currentYear)
        .sort((a, b) => b - a);
      years.push(...pastYears);
    } else {
      // Past: show all years with projects, descending
      const allYears = Object.keys(projectsByYear)
        .map(Number)
        .sort((a, b) => b - a);
      years.push(...allYears);
    }

    return years.map((year) => ({
      year,
      project: projectsByYear[year] || null,
    }));
  };

  const getFilteredEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yr = today.getFullYear();

    const allProcessed = events
      .filter((event) => {
        if (eventSettings.hiddenEventIds.includes(event.id)) return false;
        if (eventSettings.hiddenCategories.includes(event.event_category)) return false;
        return true;
      })
      .map((event) => {
        let eventDate = new Date(event.event_date);
        if (event.is_recurring) {
          const thisYearDate = new Date(yr, eventDate.getMonth(), eventDate.getDate());
          if (thisYearDate < today) thisYearDate.setFullYear(yr + 1);
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

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const { upcoming: upcomingEvents, past: pastEvents } = getFilteredEvents();

  const renderEventCard = (event: typeof upcomingEvents[0], isUpcoming: boolean, index: number) => {
    const daysUntil = getDaysUntil(event.displayDate);
    const yearRows = getYearRowsForEvent(event.id, isUpcoming);

    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <CozyCard variant="elevated" padding="sm" className="h-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{event.icon || "📅"}</span>
            <h3 className="font-display font-semibold text-foreground text-sm truncate flex-1">
              {event.title}
            </h3>
          </div>
          {isUpcoming && (
            <p className="text-xs text-muted-foreground mb-2">
              {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
            </p>
          )}

          <div className="space-y-1.5 mt-2">
            {yearRows.length > 0 ? (
              yearRows.map(({ year, project }) => (
                <div
                  key={year}
                  className="flex items-center gap-2 rounded-lg border border-border/60 overflow-hidden"
                >
                  <span className="text-xs font-medium text-muted-foreground px-2.5 py-1.5 bg-muted/50 min-w-[48px] text-center">
                    {year}
                  </span>
                  {project ? (
                    <button
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="flex-1 text-xs font-medium text-primary px-2 py-1.5 text-right hover:bg-muted/30 transition-colors"
                    >
                      View Project
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        navigate("/create-project", {
                          state: { event: event.title, date: event.displayDate.toISOString(), eventId: event.id, familySpaceId },
                        })
                      }
                      className="flex-1 text-xs font-medium text-primary px-2 py-1.5 text-right hover:bg-muted/30 transition-colors flex items-center justify-end gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Start
                    </button>
                  )}
                </div>
              ))
            ) : isUpcoming ? (
              <button
                onClick={() =>
                  navigate("/create-project", {
                    state: { event: event.title, date: event.displayDate.toISOString(), eventId: event.id, familySpaceId },
                  })
                }
                className="w-full flex items-center gap-2 rounded-lg border border-border/60 overflow-hidden"
              >
                <span className="text-xs font-medium text-muted-foreground px-2.5 py-1.5 bg-muted/50 min-w-[48px] text-center">
                  {currentYear}
                </span>
                <span className="flex-1 text-xs font-medium text-primary px-2 py-1.5 text-right flex items-center justify-end gap-1">
                  <Plus className="w-3 h-3" />
                  Start
                </span>
              </button>
            ) : null}
          </div>
        </CozyCard>
      </motion.div>
    );
  };

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

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-5">
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

        {/* Events Grid */}
        {(() => {
          const allEvents = [
            ...upcomingEvents.map((e) => ({ ...e, _isUpcoming: true as const })),
            ...pastEvents.map((e) => ({ ...e, _isUpcoming: false as const })),
          ];
          const recurringEvents = allEvents.filter((e) => e.is_recurring);
          const oneTimeEvents = allEvents.filter((e) => !e.is_recurring);

          return (recurringEvents.length > 0 || oneTimeEvents.length > 0) ? (
            <div className="mb-6 space-y-6">
              {recurringEvents.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground mb-3">Recurring Events</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {recurringEvents.map((event, i) => renderEventCard(event, event._isUpcoming, i))}
                  </div>
                </div>
              )}
              {oneTimeEvents.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground mb-3">One-Time Events</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {oneTimeEvents.map((event, i) => renderEventCard(event, event._isUpcoming, i))}
                  </div>
                </div>
              )}
            </div>
          ) : null;
        })() || (
          <CozyCard className="text-center py-12">
            <YarnDecoration variant="ball" color="sage" className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No Events Yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Add events in the settings or add birthdays to family members
            </p>
            <CozyButton variant="primary" onClick={() => setShowSettings(true)}>
              Manage Events
            </CozyButton>
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
