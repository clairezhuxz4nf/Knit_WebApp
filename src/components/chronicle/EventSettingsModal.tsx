import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Calendar, Gift, Heart, Star, Eye, EyeOff } from "lucide-react";
import CozyButton from "@/components/ui/CozyButton";
import CozyCard from "@/components/ui/CozyCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

interface EventSettings {
  hiddenEventIds: string[];
  hiddenCategories: string[];
}

interface EventSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: DbEvent[];
  settings: EventSettings;
  onSave: (settings: EventSettings) => void;
  familySpaceId: string | null;
  onEventsChange: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ICONS = ["🎉", "🎊", "💫", "⭐", "🌟", "💖", "🎁", "🏠", "✈️", "🎓", "💍", "🎂", "🎄", "🦃", "🐣", "🎃", "💝"];

// Common public holidays that can be quickly added
const PUBLIC_HOLIDAYS = [
  { id: "christmas", name: "Christmas", month: 11, day: 25, icon: "🎄" },
  { id: "thanksgiving", name: "Thanksgiving", month: 10, day: 28, icon: "🦃" },
  { id: "easter", name: "Easter", month: 3, day: 20, icon: "🐣" },
  { id: "halloween", name: "Halloween", month: 9, day: 31, icon: "🎃" },
  { id: "valentines", name: "Valentine's Day", month: 1, day: 14, icon: "💝" },
  { id: "new_year", name: "New Year's Day", month: 0, day: 1, icon: "🎆" },
  { id: "mothers_day", name: "Mother's Day", month: 4, day: 11, icon: "💐" },
  { id: "fathers_day", name: "Father's Day", month: 5, day: 15, icon: "👔" },
  { id: "independence_day", name: "Independence Day", month: 6, day: 4, icon: "🎇" },
  { id: "labor_day", name: "Labor Day", month: 8, day: 2, icon: "🛠️" },
];

const CATEGORY_LABELS: Record<string, string> = {
  birthday: "Birthdays",
  festival: "Festivals & Holidays",
  anniversary: "Anniversaries",
  custom: "Custom Events",
  general: "General Events",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  birthday: <Calendar className="w-5 h-5 text-yarn-rose" />,
  festival: <Gift className="w-5 h-5 text-yarn-sage" />,
  anniversary: <Heart className="w-5 h-5 text-yarn-butter" />,
  custom: <Star className="w-5 h-5 text-yarn-teal" />,
  general: <Calendar className="w-5 h-5 text-yarn-teal" />,
};

const EventSettingsModal = ({
  isOpen,
  onClose,
  events,
  settings,
  onSave,
  familySpaceId,
  onEventsChange,
}: EventSettingsModalProps) => {
  const { user } = useAuth();
  const [localSettings, setLocalSettings] = useState<EventSettings>(settings);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    month: 0,
    day: 1,
    icon: "🎉",
    category: "custom" as string,
    isRecurring: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user_event_settings for backward compatibility
      if (user) {
        await supabase
          .from("user_event_settings")
          .upsert({
            user_id: user.id,
            show_birthdays: !localSettings.hiddenCategories.includes("birthday"),
            western_festivals: events
              .filter((e) => e.event_category === "festival")
              .map((e) => ({
                id: e.id,
                name: e.title,
                enabled: !localSettings.hiddenEventIds.includes(e.id),
              })),
          });
      }
      onSave(localSettings);
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleEventVisibility = (eventId: string) => {
    const isHidden = localSettings.hiddenEventIds.includes(eventId);
    setLocalSettings({
      ...localSettings,
      hiddenEventIds: isHidden
        ? localSettings.hiddenEventIds.filter((id) => id !== eventId)
        : [...localSettings.hiddenEventIds, eventId],
    });
  };

  const toggleCategoryVisibility = (category: string) => {
    const isHidden = localSettings.hiddenCategories.includes(category);
    setLocalSettings({
      ...localSettings,
      hiddenCategories: isHidden
        ? localSettings.hiddenCategories.filter((c) => c !== category)
        : [...localSettings.hiddenCategories, category],
    });
  };

  const getDaysInMonth = (month: number) => {
    return new Date(2024, month + 1, 0).getDate();
  };

  const addNewEvent = async () => {
    if (!newEvent.title.trim() || !familySpaceId || !user) return;

    try {
      const eventDate = new Date(new Date().getFullYear(), newEvent.month, newEvent.day);

      const { error } = await supabase.from("events").insert({
        family_space_id: familySpaceId,
        created_by: user.id,
        title: newEvent.title,
        event_date: eventDate.toISOString().split("T")[0],
        event_type: newEvent.category,
        event_category: newEvent.category,
        icon: newEvent.icon,
        is_recurring: newEvent.isRecurring,
      });

      if (error) throw error;

      toast.success("Event added!");
      setNewEvent({ title: "", month: 0, day: 1, icon: "🎉", category: "custom", isRecurring: true });
      setShowAddEvent(false);
      onEventsChange();
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
      toast.success("Event deleted");
      onEventsChange();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const addPublicHoliday = async (holiday: typeof PUBLIC_HOLIDAYS[0]) => {
    if (!familySpaceId || !user) return;

    try {
      const eventDate = new Date(new Date().getFullYear(), holiday.month, holiday.day);

      const { error } = await supabase.from("events").insert({
        family_space_id: familySpaceId,
        created_by: user.id,
        title: holiday.name,
        event_date: eventDate.toISOString().split("T")[0],
        event_type: "festival",
        event_category: "festival",
        icon: holiday.icon,
        is_recurring: true,
      });

      if (error) throw error;

      toast.success(`${holiday.name} added!`);
      onEventsChange();
    } catch (error) {
      console.error("Error adding holiday:", error);
      toast.error("Failed to add holiday");
    }
  };

  // Group events by category
  const eventsByCategory = events.reduce((acc, event) => {
    const category = event.event_category || "custom";
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {} as Record<string, DbEvent[]>);

  const categories = Object.keys(eventsByCategory).sort();

  // Find which public holidays are not yet added
  const existingHolidayNames = events
    .filter((e) => e.event_category === "festival")
    .map((e) => e.title.toLowerCase());
  
  const availableHolidays = PUBLIC_HOLIDAYS.filter(
    (h) => !existingHolidayNames.includes(h.name.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto bg-background rounded-t-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Manage Events
                </h2>
              </div>
              <CozyButton variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </CozyButton>
            </div>

            <div className="p-6 space-y-6">
              {/* Add New Event Button */}
              <CozyButton
                variant="secondary"
                fullWidth
                onClick={() => setShowAddEvent(!showAddEvent)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Event
              </CozyButton>

              {/* Add Event Form */}
              {showAddEvent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <CozyCard variant="default">
                    <div className="space-y-4">
                      <Input
                        placeholder="Event title..."
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="bg-background"
                      />

                      <div className="flex gap-2">
                        <Select
                          value={String(newEvent.month)}
                          onValueChange={(v) => setNewEvent({ ...newEvent, month: parseInt(v) })}
                        >
                          <SelectTrigger className="flex-1 bg-background">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((month, i) => (
                              <SelectItem key={month} value={String(i)}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={String(newEvent.day)}
                          onValueChange={(v) => setNewEvent({ ...newEvent, day: parseInt(v) })}
                        >
                          <SelectTrigger className="w-24 bg-background">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: getDaysInMonth(newEvent.month) }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Select
                        value={newEvent.category}
                        onValueChange={(v) => setNewEvent({ ...newEvent, category: v })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom Event</SelectItem>
                          <SelectItem value="anniversary">Anniversary</SelectItem>
                          <SelectItem value="festival">Festival</SelectItem>
                        </SelectContent>
                      </Select>

                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Choose an icon
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {ICONS.map((icon) => (
                            <button
                              key={icon}
                              onClick={() => setNewEvent({ ...newEvent, icon })}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                newEvent.icon === icon
                                  ? "bg-primary/20 ring-2 ring-primary"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Repeats yearly</Label>
                        <Switch
                          checked={newEvent.isRecurring}
                          onCheckedChange={(checked) =>
                            setNewEvent({ ...newEvent, isRecurring: checked })
                          }
                        />
                      </div>

                      <CozyButton variant="primary" size="sm" onClick={addNewEvent} fullWidth>
                        Add Event
                      </CozyButton>
                    </div>
                  </CozyCard>
                </motion.div>
              )}

              {/* Quick Add Public Holidays */}
              {availableHolidays.length > 0 && (
                <CozyCard variant="default">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-yarn-sage/20 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-yarn-sage" />
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Quick Add Holidays</Label>
                      <p className="text-xs text-muted-foreground">
                        Tap to add popular holidays
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableHolidays.map((holiday) => (
                      <button
                        key={holiday.id}
                        onClick={() => addPublicHoliday(holiday)}
                        className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-yarn-sage/20 rounded-xl transition-colors border border-transparent hover:border-yarn-sage/30"
                      >
                        <span className="text-lg">{holiday.icon}</span>
                        <span className="text-sm font-medium">{holiday.name}</span>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </CozyCard>
              )}

              {/* Events by Category */}
              {categories.map((category) => (
                <CozyCard key={category} variant="default">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        {CATEGORY_ICONS[category] || CATEGORY_ICONS.custom}
                      </div>
                      <div>
                        <Label className="text-base font-semibold">
                          {CATEGORY_LABELS[category] || category}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {eventsByCategory[category].length} events
                        </p>
                      </div>
                    </div>
                    {category !== "birthday" && (
                      <Switch
                        checked={!localSettings.hiddenCategories.includes(category)}
                        onCheckedChange={() => toggleCategoryVisibility(category)}
                      />
                    )}
                    {category === "birthday" && (
                      <Switch
                        checked={!localSettings.hiddenCategories.includes("birthday")}
                        onCheckedChange={() => toggleCategoryVisibility("birthday")}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    {eventsByCategory[category].map((event) => {
                      const isHidden = localSettings.hiddenEventIds.includes(event.id);
                      const canDelete = event.event_category !== "birthday";

                      return (
                        <div
                          key={event.id}
                          className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                            isHidden ? "bg-muted/20 opacity-60" : "bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xl">{event.icon || "📅"}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.event_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                {event.is_recurring && " • Yearly"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleEventVisibility(event.id)}
                              className="p-2 rounded-full hover:bg-muted transition-colors"
                              title={isHidden ? "Show event" : "Hide event"}
                            >
                              {isHidden ? (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => deleteEvent(event.id)}
                                className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CozyCard>
              ))}

              {events.length === 0 && (
                <CozyCard className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    No events yet. Add birthdays to family members or create custom events above.
                  </p>
                </CozyCard>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventSettingsModal;
