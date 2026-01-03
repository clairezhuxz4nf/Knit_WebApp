import { useState } from "react";
import { motion } from "framer-motion";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";

interface CreateSelfNodeModalProps {
  onClose: () => void;
  onCreate: (firstName: string, lastName?: string) => Promise<void>;
}

const CreateSelfNodeModal = ({ onClose, onCreate }: CreateSelfNodeModalProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!firstName.trim()) return;
    
    setCreating(true);
    try {
      await onCreate(firstName.trim(), lastName.trim() || undefined);
      onClose();
    } catch (error) {
      console.error("Error creating profile:", error);
    } finally {
      setCreating(false);
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
        <h3 className="font-display text-xl font-semibold text-center mb-2">
          Create Your Profile
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Add yourself to start building your family tree
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              First Name
            </label>
            <CozyInput
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Last Name (optional)
            </label>
            <CozyInput
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your last name"
            />
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
            onClick={handleCreate}
            disabled={creating || !firstName.trim()}
          >
            {creating ? "Creating..." : "Create"}
          </CozyButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateSelfNodeModal;
