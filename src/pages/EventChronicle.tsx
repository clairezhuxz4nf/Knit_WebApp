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

interface FamilyMember {
  id: string;
  display_name: string | null;
  birthday: string | null;
}

interface WesternFestival {
  id: string;
  name: string;
  month: number;
  day: number;
  icon: string;
  enabled: boolean;
}

interface EventSettings {
  westernFestivals: WesternFestival[];
  showBirthdays: boolean;
  anniversaries: { id: string; title: string; month: number; day: number }[];
  customEvents: { id: string; title: string; month: number; day: number; icon: string }[];
}

const DEFAULT_WESTERN_FESTIVALS: WesternFestival[] = [
  { id: "christmas", name: "Christmas", month: 11, day: 25, icon: "🎄", enabled: true },
  { id: "thanksgiving", name: "Thanksgiving", month: 10, day: 28, icon: "🦃", enabled: true },
  { id: "easter", name: "Easter", month: 3, day: 20, icon: "🐣", enabled: true },
  { id: "halloween", name: "Halloween", month: 9, day: 31, icon: "🎃", enabled: true },
  { id: "valentines", name: "Valentine's Day", month: 1, day: 14, icon: "💝", enabled: true },
];

const DEFAULT_SETTINGS: EventSettings = {
  westernFestivals: DEFAULT_WESTERN_FESTIVALS,
  showBirthdays: true,
  anniversaries: [],
  customEvents: [],
};

const EventChronicle = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [eventSettings, setEventSettings] = useState<EventSettings>(() => {
    const saved = localStorage.getItem("eventChronicleSettings");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old format to new format
      if (parsed.showWesternFestivals !== undefined && !parsed.westernFestivals) {
        return {
          ...DEFAULT_SETTINGS,
          westernFestivals: DEFAULT_WESTERN_FESTIVALS.map(f => ({
            ...f,
            enabled: parsed.showWesternFestivals
          })),
          showBirthdays: parsed.showBirthdays ?? true,
          anniversaries: parsed.anniversaries ?? [],
          customEvents: parsed.customEvents ?? [],
        };
      }
      // Ensure westernFestivals exists
      if (!parsed.westernFestivals) {
        return { ...DEFAULT_SETTINGS, ...parsed, westernFestivals: DEFAULT_WESTERN_FESTIVALS };
      }
      return parsed;
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchFamilyMembers();
    }
  }, [user, loading, navigate]);

  const fetchFamilyMembers = async () => {
    if (!user) return;

    try {
      const { data: memberData, error: memberError } = await supabase
        .from("family_members")
        .select("family_space_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        navigate("/welcome-page");
        return;
      }

      const { data: membersData, error: membersError } = await supabase
        .from("family_members")
        .select("id, display_name, birthday")
        .eq("family_space_id", memberData.family_space_id);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveSettings = (newSettings: EventSettings) => {
    setEventSettings(newSettings);
    localStorage.setItem("eventChronicleSettings", JSON.stringify(newSettings));
  };

  const getAllEvents = () => {
    const events = [];
    const today = new Date();
    const year = today.getFullYear();

    // Add member birthdays from database
    if (eventSettings.showBirthdays) {
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
            color: "rose" as const,
          });
        }
      });
    }

    // Add western holidays (only enabled ones)
    const colorMap: Record<string, "rose" | "sage" | "butter" | "teal"> = {
      christmas: "sage",
      thanksgiving: "teal",
      easter: "butter",
      halloween: "butter",
      valentines: "rose",
    };

    eventSettings.westernFestivals
      .filter((festival) => festival.enabled)
      .forEach((festival) => {
        let holidayDate = new Date(year, festival.month, festival.day);
        if (holidayDate < today) {
          holidayDate = new Date(year + 1, festival.month, festival.day);
        }
        events.push({
          id: festival.id,
          title: festival.name,
          date: holidayDate,
          type: "holiday",
          icon: festival.icon,
          color: colorMap[festival.id] || ("sage" as const),
        });
      });

    // Add anniversaries
    eventSettings.anniversaries.forEach((ann) => {
      let annDate = new Date(year, ann.month, ann.day);
      if (annDate < today) {
        annDate = new Date(year + 1, ann.month, ann.day);
      }
      events.push({
        id: ann.id,
        title: ann.title,
        date: annDate,
        type: "anniversary",
        icon: "💍",
        color: "butter" as const,
      });
    });

    // Add custom events
    eventSettings.customEvents.forEach((custom) => {
      let customDate = new Date(year, custom.month, custom.day);
      if (customDate < today) {
        customDate = new Date(year + 1, custom.month, custom.day);
      }
      events.push({
        id: custom.id,
        title: custom.title,
        date: customDate,
        type: "custom",
        icon: custom.icon,
        color: "teal" as const,
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
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

  const events = getAllEvents();

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
            <CozyButton
              variant="secondary"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              Customize My Own Events
            </CozyButton>
          </div>
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Your Family's Timeline
            </h2>
            <p className="text-sm text-muted-foreground">
              Upcoming milestones to celebrate together
            </p>
          </div>
        </motion.div>

        {/* Yarn Timeline */}
        <div className="relative pb-8">
          <div className="space-y-4 ml-12">
            {events.map((event, index) => {
              const daysUntil = getDaysUntil(event.date);
              const isLast = index === events.length - 1;

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
                        height: 'calc(100% + 16px)',
                        borderRadius: '4px',
                        boxShadow: '0 0 4px rgba(0,0,0,0.1)',
                        background: `repeating-linear-gradient(
                          180deg,
                          hsl(var(--yarn-rose)) 0px,
                          hsl(var(--yarn-rose)) 8px,
                          hsl(var(--yarn-butter)) 8px,
                          hsl(var(--yarn-butter)) 16px
                        )`
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
                      `
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
                        )`
                      }}
                    />
                    <span className="relative z-10">{event.icon}</span>
                  </div>
                  
                  <CozyCard
                    variant="elevated"
                    className="cursor-pointer hover:shadow-cozy transition-all group"
                    onClick={() =>
                      navigate("/create-project", {
                        state: { event: event.title, date: event.date.toISOString() },
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
                        {event.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground text-base truncate">
                          {event.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatDate(event.date)}
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
                      <p className="text-xs text-muted-foreground">
                        Tap to create a project for this event
                      </p>
                    </div>
                  </CozyCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {events.length === 0 && (
          <CozyCard className="text-center py-12">
            <YarnDecoration
              variant="ball"
              color="sage"
              className="w-16 h-16 mx-auto mb-4 opacity-50"
            />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              No Events Yet
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Configure your events in the settings
            </p>
            <CozyButton
              variant="primary"
              onClick={() => setShowSettings(true)}
            >
              Open Settings
            </CozyButton>
          </CozyCard>
        )}
      </div>

      <EventSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={eventSettings}
        onSave={handleSaveSettings}
      />

      <BottomNav />
    </MobileLayout>
  );
};

export default EventChronicle;