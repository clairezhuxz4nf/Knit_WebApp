import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Person } from "@/types/family";

interface EditPersonModalProps {
  person: Person;
  onClose: () => void;
  onSave: (personId: string, updates: { first_name: string; last_name?: string; birth_date?: string }) => Promise<void>;
}

const EditPersonModal = ({ person, onClose, onSave }: EditPersonModalProps) => {
  const [firstName, setFirstName] = useState(person.first_name || "");
  const [lastName, setLastName] = useState(person.last_name || "");
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    person.birth_date ? new Date(person.birth_date) : undefined
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim()) return;
    
    setSaving(true);
    try {
      await onSave(person.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        birth_date: birthDate ? birthDate.toISOString().split("T")[0] : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Error saving person:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-lifted"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-semibold text-center mb-4">
          Edit Profile
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              First Name
            </label>
            <CozyInput
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Last Name
            </label>
            <CozyInput
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name (optional)"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Birthday
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl border-2 border-border/50 bg-muted/30 h-12",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate ? format(birthDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <CozyButton
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </CozyButton>
          <CozyButton
            variant="primary"
            className="flex-1"
            onClick={handleSave}
            disabled={saving || !firstName.trim()}
          >
            {saving ? "Saving..." : "Save"}
          </CozyButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditPersonModal;
