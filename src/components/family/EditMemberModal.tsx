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

interface EditMemberModalProps {
  member: {
    id: string;
    display_name: string | null;
    birthday?: string | null;
  };
  onClose: () => void;
  onSave: (id: string, name: string, birthday: Date | null) => Promise<void>;
}

const EditMemberModal = ({ member, onClose, onSave }: EditMemberModalProps) => {
  const [name, setName] = useState(member.display_name || "");
  const [birthday, setBirthday] = useState<Date | undefined>(
    member.birthday ? new Date(member.birthday) : undefined
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(member.id, name, birthday || null);
      onClose();
    } catch (error) {
      console.error("Error saving member:", error);
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
          Edit Family Member
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Name
            </label>
            <CozyInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
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
                    !birthday && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthday ? format(birthday, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthday}
                  onSelect={setBirthday}
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
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving..." : "Save"}
          </CozyButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditMemberModal;
