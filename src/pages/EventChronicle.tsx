import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import YarnDecoration from "@/components/ui/YarnDecoration";
import EventSettingsModal from "@/components/chronicle/EventSettingsModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [eventProjects, setEventProjects] = useState<Record<string, boolean>>({});
  const [familySpaceId, setFamilySpaceId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [eventSettings, setEventSettings] = useState<EventSettings>(DEFAULT_SETTINGS);

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
      // First get user's family space
      const { data: memberData, error: memberError } = await supabase
        .from("people")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!memberData) {
        navigate("/welcome-page");
        return;
      }

      setFamilySpaceId(memberData.family_space_id);

      // Seed default festivals if needed (fire and forget)
      supabase.rpc("seed_default_festivals", {
        _family_space_id: memberData.family_space_id,
        _created_by: user.id,
      }).then(() => {
        // Refetch events after seeding
      });

      // Fetch events, projects, and user settings in parallel
      const [eventsResult, projectsResult, settingsResult] = await Promise.all([
        supabase
          .from("events")
          .select("id, title, event_date, event_type, event_category, icon, is_recurring, family_space_id, person_id")
          .eq("family_space_id", memberData.family_space_id),
        supabase
          .from("projects")
          .select("event_id")
          .eq("family_space_id", memberData.family_space_id)
          .not("event_id", "is", null),
        supabase
          .from("user_event_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (eventsResult.error) throw eventsResult.error;

      setEvents(eventsResult.data || []);

      // Build a map of event IDs that have associated projects
      const projectEventMap: Record<string, boolean> = {};
      (projectsResult.data || []).forEach((p: { event_id: string | null }) => {
        if (p.event_id) {
          projectEventMap[p.event_id] = true;
        }
      });
      setEventProjects(projectEventMap);

      // Load user settings for hidden events
      if (settingsResult.data) {
        const westernFestivals = settingsResult.data.western_festivals as Array<{ id: string; enabled: boolean }> | null;
        const hiddenIds = westernFestivals
          ?.filter((f) => !f.enabled)
          .map((f) => f.id) || [];
        
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
    // Settings will be persisted via the modal
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    return events
      .filter((event) => {
        // Filter out hidden events
        if (eventSettings.hiddenEventIds.includes(event.id)) return false;
        if (eventSettings.hiddenCategories.includes(event.event_category)) return false;
        return true;
      })
      .map((event) => {
        let eventDate = new Date(event.event_date);

        // For recurring events, calculate next occurrence
        if (event.is_recurring) {
          const thisYearDate = new Date(currentYear, eventDate.getMonth(), eventDate.getDate());
          if (thisYearDate < today) {
            thisYearDate.setFullYear(currentYear + 1);
          }
          eventDate = thisYearDate;
        }

        return {
          ...event,
          displayDate: eventDate,
          color: CATEGORY_COLORS[event.event_category] || "teal",
        };
      })
      .filter((event) => {
        // Only show future or today's events for non-recurring
        if (!event.is_recurring) {
          return event.displayDate >= today;
        }
        return true;
      })
      .sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const upcomingEvents = getUpcomingEvents();

  if (loading || dataLoading) {
    return (
      <MobileLayout className="flex items-center justify-center" showPattern>
        <YarnDecoration variant="ball" color="rose" className="w-12 h-12 animate-pulse-soft" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showPattern className="pb-20">
      <Header title="Chronicle of Events" />

      <div className="flex-1 px-6 py-4 overflow-y-auto pb-24">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-center gap-4 mb-3">
            <YarnDecoration variant="wave" color="rose" className="w-32" />
            <CozyButton variant="secondary" size="sm" onClick={() => setShowSettings(true)}>
              Manage Events
            </CozyButton>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Upcoming milestones to celebrate together
            </p>
          </div>
        </motion.div>

        {/* Yarn Timeline */}
        <div className="relative pb-8">
          <div className="space-y-4 ml-12">
            {upcomingEvents.map((event, index) => {
              const daysUntil = getDaysUntil(event.displayDate);
              const isLast = index === upcomingEvents.length - 1;

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
                        background: `repeating-linear-gradient(
                          180deg,
                          hsl(var(--yarn-rose)) 0px,
                          hsl(var(--yarn-rose)) 8px,
                          hsl(var(--yarn-butter)) 8px,
                          hsl(var(--yarn-butter)) 16px
                        )`,
                      }}
                    />
                  )}

                  <div
                    className={`absolute -left-10 top-4 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md border-2 border-background z-10 ${
                      event.color === "rose"
                        ? "bg-yarn-rose"
                        : event.color === "sage"
                        ? "bg-yarn-sage"
                        : event.color === "butter"
                        ? "bg-yarn-butter"
                        : "bg-yarn-teal"
                    }`}
                    style={{
                      boxShadow: `
                        0 2px 8px rgba(0,0,0,0.15),
                        inset 0 1px 2px rgba(255,255,255,0.3),
                        inset 0 -1px 2px rgba(0,0,0,0.1)
                      `,
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full opacity-30"
                      style={{
                        background: `repeating-linear-gradient(
                          45deg,
                          transparent 0px,
                          transparent 2px,
                          rgba(255,255,255,0.3) 2px,
                          rgba(255,255,255,0.3) 4px
                        )`,
                      }}
                    />
                    <span className="relative z-10">{event.icon || "📅"}</span>
                  </div>

                  <CozyCard
                    variant="elevated"
                    className="cursor-pointer hover:shadow-cozy transition-all group"
                    onClick={() =>
                      navigate("/create-project", {
                        state: {
                          event: event.title,
                          date: event.displayDate.toISOString(),
                          eventId: event.id,
                          familySpaceId: familySpaceId,
                        },
                      })
                    }
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                          event.color === "rose"
                            ? "bg-yarn-rose/20"
                            : event.color === "sage"
                            ? "bg-yarn-sage/20"
                            : event.color === "butter"
                            ? "bg-yarn-butter/20"
                            : "bg-yarn-teal/20"
                        }`}
                      >
                        {event.icon || "📅"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground text-base truncate">
                          {event.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatDate(event.displayDate)}
                        </p>
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                            daysUntil <= 7
                              ? "bg-yarn-rose/20 text-yarn-rose"
                              : daysUntil <= 30
                              ? "bg-yarn-butter/20 text-yarn-taupe"
                              : "bg-yarn-sage/20 text-yarn-sage"
                          }`}
                        >
                          {daysUntil === 0
                            ? "Today!"
                            : daysUntil === 1
                            ? "Tomorrow"
                            : `In ${daysUntil} days`}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0" />
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/50">
                      {eventProjects[event.id] ? (
                        <p className="text-xs font-medium" style={{ color: "#94B097" }}>
                          Start working on this event
                        </p>
                      ) : (
                        <p className="text-xs font-medium" style={{ color: "#C08686" }}>
                          Start preparing for this event
                        </p>
                      )}
                    </div>
                  </CozyCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {upcomingEvents.length === 0 && (
          <CozyCard className="text-center py-12">
            <YarnDecoration variant="ball" color="sage" className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              No Events Yet
            </h3>
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
