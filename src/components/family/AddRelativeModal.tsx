import { useState } from "react";
import { motion } from "framer-motion";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";
import { Person } from "@/types/family";

interface AddRelativeModalProps {
  fromPerson: Person;
  relationType: 'parent' | 'child' | 'spouse';
  onClose: () => void;
  onAdd: (fromPerson: Person, type: 'parent' | 'child' | 'spouse', name: string) => Promise<Person | null>;
}

const relationLabels = {
  parent: 'Parent',
  child: 'Child',
  spouse: 'Spouse',
};

const AddRelativeModal = ({ fromPerson, relationType, onClose, onAdd }: AddRelativeModalProps) => {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    
    setAdding(true);
    try {
      await onAdd(fromPerson, relationType, name.trim());
      onClose();
    } catch (error) {
      console.error("Error adding relative:", error);
    } finally {
      setAdding(false);
    }
  };

  const fullName = fromPerson.last_name 
    ? `${fromPerson.first_name} ${fromPerson.last_name}`
    : fromPerson.first_name;

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
        <h3 className="font-display text-xl font-semibold text-center mb-2">
          Add {relationLabels[relationType]}
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Adding {relationType === 'child' ? 'a child of' : relationType === 'parent' ? 'a parent of' : 'a spouse for'} {fullName}
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Name
            </label>
            <CozyInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${relationLabels[relationType].toLowerCase()}'s name`}
              autoFocus
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 mb-4">
          This will create a placeholder. You can invite them to claim their profile later.
        </p>

        <div className="flex gap-3">
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
            onClick={handleAdd}
            disabled={adding || !name.trim()}
          >
            {adding ? "Adding..." : "Add"}
          </CozyButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddRelativeModal;
