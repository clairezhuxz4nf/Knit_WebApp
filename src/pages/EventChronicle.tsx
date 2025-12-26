import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Plus } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyCard from "@/components/ui/CozyCard";
import CozyButton from "@/components/ui/CozyButton";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import yarnTimelineImg from "@/assets/yarn-timeline.png";

interface FamilyMember {
  id: string;
  display_name: string | null;
  birthday: string | null;
}

const EventChronicle = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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
      // Get family space the user belongs to
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

      // Get all family members with birthdays
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

  const getAllEvents = () => {
    const events = [];
    const today = new Date();
    const year = today.getFullYear();

    // Add member birthdays from database
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

    // Add holidays
    const holidays = [
      { id: "christmas", title: "Christmas", month: 11, day: 25, icon: "🎄", color: "sage" as const },
      { id: "lunar", title: "Chinese Lunar New Year", month: 0, day: 29, icon: "🧧", color: "butter" as const },
      { id: "thanksgiving", title: "Thanksgiving", month: 10, day: 28, icon: "🦃", color: "teal" as const },
      { id: "easter", title: "Easter", month: 3, day: 20, icon: "🐣", color: "butter" as const },
      { id: "diwali", title: "Diwali", month: 9, day: 20, icon: "🪔", color: "rose" as const },
    ];

    holidays.forEach((holiday) => {
      let holidayDate = new Date(year, holiday.month, holiday.day);
      if (holidayDate < today) {
        holidayDate = new Date(year + 1, holiday.month, holiday.day);
      }
      events.push({
        id: holiday.id,
        title: holiday.title,
        date: holidayDate,
        type: "holiday",
        icon: holiday.icon,
        color: holiday.color,
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
    <MobileLayout showPattern>
      <Header title="Chronicle of Events" showBack />

      <div className="flex-1 px-6 py-4 overflow-y-auto pb-24">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <YarnDecoration variant="wave" color="rose" className="w-32 mx-auto mb-3" />
          <h2 className="font-display text-xl font-semibold text-foreground">
            Your Family's Timeline
          </h2>
          <p className="text-sm text-muted-foreground">
            Upcoming milestones to celebrate together
          </p>
        </motion.div>

        {/* Yarn Timeline with Image */}
        <div className="relative pb-8">
          {/* Timeline Image - positioned on the left */}
          <div className="absolute left-8 top-0 bottom-0 w-16 flex justify-center">
            <img 
              src={yarnTimelineImg} 
              alt="Yarn timeline" 
              className="h-full w-auto object-contain object-top opacity-90"
              style={{ minHeight: events.length * 140 + 'px' }}
            />
          </div>

          {/* Event Cards */}
          <div className="space-y-4 ml-20">
            {events.map((event, index) => {
              const daysUntil = getDaysUntil(event.date);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="relative"
                >
                  {/* Connector dot */}
                  <div 
                    className={`absolute -left-12 top-6 w-3 h-3 rounded-full border-2 border-background shadow-sm ${
                      event.color === "rose"
                        ? "bg-yarn-rose"
                        : event.color === "sage"
                        ? "bg-yarn-sage"
                        : event.color === "butter"
                        ? "bg-yarn-butter"
                        : "bg-yarn-teal"
                    }`}
                  />
                  
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
              Add family members with birthdays in the settings
            </p>
            <CozyButton
              variant="primary"
              onClick={() => navigate("/family-settings")}
            >
              Go to Settings
            </CozyButton>
          </CozyCard>
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

export default EventChronicle;
