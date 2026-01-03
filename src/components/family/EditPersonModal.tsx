import { useState } from "react";
import { motion } from "framer-motion";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Person } from "@/types/family";

interface EditPersonModalProps {
  person: Person;
  onClose: () => void;
  onSave: (personId: string, updates: { first_name: string; last_name?: string; birth_date?: string }) => Promise<void>;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const day = (i + 1).toString().padStart(2, "0");
  return { value: day, label: (i + 1).toString() };
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 120 }, (_, i) => {
  const year = (currentYear - i).toString();
  return { value: year, label: year };
});

const parseBirthDate = (dateStr?: string) => {
  if (!dateStr) return { month: "", day: "", year: "" };
  const date = new Date(dateStr);
  return {
    month: (date.getMonth() + 1).toString().padStart(2, "0"),
    day: date.getDate().toString().padStart(2, "0"),
    year: date.getFullYear().toString(),
  };
};

const EditPersonModal = ({ person, onClose, onSave }: EditPersonModalProps) => {
  const [firstName, setFirstName] = useState(person.first_name || "");
  const [lastName, setLastName] = useState(person.last_name || "");
  const initialDate = parseBirthDate(person.birth_date);
  const [birthMonth, setBirthMonth] = useState(initialDate.month);
  const [birthDay, setBirthDay] = useState(initialDate.day);
  const [birthYear, setBirthYear] = useState(initialDate.year);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim()) return;
    
    setSaving(true);
    try {
      let birthDate: string | undefined;
      if (birthMonth && birthDay && birthYear) {
        birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
      }
      
      await onSave(person.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        birth_date: birthDate,
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
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Birthday
            </label>
            <div className="flex gap-2">
              <Select value={birthMonth} onValueChange={setBirthMonth}>
                <SelectTrigger className="flex-1 rounded-xl border-2 border-border/50 bg-muted/30 h-12">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={birthDay} onValueChange={setBirthDay}>
                <SelectTrigger className="w-20 rounded-xl border-2 border-border/50 bg-muted/30 h-12">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={birthYear} onValueChange={setBirthYear}>
                <SelectTrigger className="w-24 rounded-xl border-2 border-border/50 bg-muted/30 h-12">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50 max-h-60">
                  {YEARS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
