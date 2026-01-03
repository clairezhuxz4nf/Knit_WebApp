import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Calendar, Gift, Heart, Star } from "lucide-react";
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

interface CustomEvent {
  id: string;
  title: string;
  month: number;
  day: number;
  icon: string;
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
  customEvents: CustomEvent[];
}

interface EventSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EventSettings;
  onSave: (settings: EventSettings) => void;
}

const DEFAULT_WESTERN_FESTIVALS: WesternFestival[] = [
  { id: "christmas", name: "Christmas", month: 11, day: 25, icon: "🎄", enabled: true },
  { id: "thanksgiving", name: "Thanksgiving", month: 10, day: 28, icon: "🦃", enabled: true },
  { id: "easter", name: "Easter", month: 3, day: 20, icon: "🐣", enabled: true },
  { id: "halloween", name: "Halloween", month: 9, day: 31, icon: "🎃", enabled: true },
  { id: "valentines", name: "Valentine's Day", month: 1, day: 14, icon: "💝", enabled: true },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ICONS = ["🎉", "🎊", "💫", "⭐", "🌟", "💖", "🎁", "🏠", "✈️", "🎓", "💍", "🎂"];

const EventSettingsModal = ({ isOpen, onClose, settings, onSave }: EventSettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState<EventSettings>(settings);
  const [newAnniversary, setNewAnniversary] = useState({ title: "", month: 0, day: 1 });
  const [newCustomEvent, setNewCustomEvent] = useState({ title: "", month: 0, day: 1, icon: "🎉" });
  const [showAddAnniversary, setShowAddAnniversary] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const addAnniversary = () => {
    if (!newAnniversary.title.trim()) return;
    setLocalSettings({
      ...localSettings,
      anniversaries: [
        ...localSettings.anniversaries,
        { ...newAnniversary, id: `ann-${Date.now()}` }
      ]
    });
    setNewAnniversary({ title: "", month: 0, day: 1 });
    setShowAddAnniversary(false);
  };

  const removeAnniversary = (id: string) => {
    setLocalSettings({
      ...localSettings,
      anniversaries: localSettings.anniversaries.filter(a => a.id !== id)
    });
  };

  const addCustomEvent = () => {
    if (!newCustomEvent.title.trim()) return;
    setLocalSettings({
      ...localSettings,
      customEvents: [
        ...localSettings.customEvents,
        { ...newCustomEvent, id: `custom-${Date.now()}` }
      ]
    });
    setNewCustomEvent({ title: "", month: 0, day: 1, icon: "🎉" });
    setShowAddCustom(false);
  };

  const removeCustomEvent = (id: string) => {
    setLocalSettings({
      ...localSettings,
      customEvents: localSettings.customEvents.filter(e => e.id !== id)
    });
  };

  const getDaysInMonth = (month: number) => {
    return new Date(2024, month + 1, 0).getDate();
  };

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
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Event Settings
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Western Festivals Section */}
              <CozyCard variant="default">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-yarn-sage/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-yarn-sage" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Western Festivals</Label>
                    <p className="text-xs text-muted-foreground">
                      Select which festivals to show
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {localSettings.westernFestivals.map((festival) => (
                    <div
                      key={festival.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{festival.icon}</span>
                        <span className="font-medium text-sm">{festival.name}</span>
                      </div>
                      <Switch
                        checked={festival.enabled}
                        onCheckedChange={(checked) => {
                          setLocalSettings({
                            ...localSettings,
                            westernFestivals: localSettings.westernFestivals.map((f) =>
                              f.id === festival.id ? { ...f, enabled: checked } : f
                            ),
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CozyCard>

              {/* Birthdays Toggle */}
              <CozyCard variant="default">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yarn-rose/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-yarn-rose" />
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Family Birthdays</Label>
                      <p className="text-xs text-muted-foreground">
                        Show family members' birthdays
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.showBirthdays}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, showBirthdays: checked })
                    }
                  />
                </div>
              </CozyCard>

              {/* Anniversaries Section */}
              <CozyCard variant="default">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yarn-butter/20 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-yarn-butter" />
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Anniversaries</Label>
                      <p className="text-xs text-muted-foreground">
                        Wedding, relationship milestones
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddAnniversary(!showAddAnniversary)}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <Plus className="w-5 h-5 text-primary" />
                  </button>
                </div>

                {showAddAnniversary && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 mb-4 p-4 bg-muted/50 rounded-xl"
                  >
                    <Input
                      placeholder="Anniversary title..."
                      value={newAnniversary.title}
                      onChange={(e) => setNewAnniversary({ ...newAnniversary, title: e.target.value })}
                      className="bg-background"
                    />
                    <div className="flex gap-2">
                      <Select
                        value={String(newAnniversary.month)}
                        onValueChange={(v) => setNewAnniversary({ ...newAnniversary, month: parseInt(v) })}
                      >
                        <SelectTrigger className="flex-1 bg-background">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month, i) => (
                            <SelectItem key={month} value={String(i)}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(newAnniversary.day)}
                        onValueChange={(v) => setNewAnniversary({ ...newAnniversary, day: parseInt(v) })}
                      >
                        <SelectTrigger className="w-24 bg-background">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: getDaysInMonth(newAnniversary.month) }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <CozyButton variant="primary" size="sm" onClick={addAnniversary} fullWidth>
                      Add Anniversary
                    </CozyButton>
                  </motion.div>
                )}

                {localSettings.anniversaries.length > 0 && (
                  <div className="space-y-2">
                    {localSettings.anniversaries.map((ann) => (
                      <div
                        key={ann.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-sm">{ann.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {MONTHS[ann.month]} {ann.day}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAnniversary(ann.id)}
                          className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CozyCard>

              {/* Custom Events Section */}
              <CozyCard variant="default">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yarn-teal/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-yarn-teal" />
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Custom Events</Label>
                      <p className="text-xs text-muted-foreground">
                        Add your own special dates
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddCustom(!showAddCustom)}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <Plus className="w-5 h-5 text-primary" />
                  </button>
                </div>

                {showAddCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 mb-4 p-4 bg-muted/50 rounded-xl"
                  >
                    <Input
                      placeholder="Event title..."
                      value={newCustomEvent.title}
                      onChange={(e) => setNewCustomEvent({ ...newCustomEvent, title: e.target.value })}
                      className="bg-background"
                    />
                    <div className="flex gap-2">
                      <Select
                        value={String(newCustomEvent.month)}
                        onValueChange={(v) => setNewCustomEvent({ ...newCustomEvent, month: parseInt(v) })}
                      >
                        <SelectTrigger className="flex-1 bg-background">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month, i) => (
                            <SelectItem key={month} value={String(i)}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(newCustomEvent.day)}
                        onValueChange={(v) => setNewCustomEvent({ ...newCustomEvent, day: parseInt(v) })}
                      >
                        <SelectTrigger className="w-24 bg-background">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: getDaysInMonth(newCustomEvent.month) }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Choose an icon</Label>
                      <div className="flex flex-wrap gap-2">
                        {ICONS.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => setNewCustomEvent({ ...newCustomEvent, icon })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                              newCustomEvent.icon === icon
                                ? "bg-primary/20 ring-2 ring-primary"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    <CozyButton variant="primary" size="sm" onClick={addCustomEvent} fullWidth>
                      Add Custom Event
                    </CozyButton>
                  </motion.div>
                )}

                {localSettings.customEvents.length > 0 && (
                  <div className="space-y-2">
                    {localSettings.customEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{event.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {MONTHS[event.month]} {event.day}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeCustomEvent(event.id)}
                          className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CozyCard>

              {/* Save Button */}
              <div className="pt-4 pb-24">
                <CozyButton variant="primary" fullWidth onClick={handleSave}>
                  Save Settings
                </CozyButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventSettingsModal;