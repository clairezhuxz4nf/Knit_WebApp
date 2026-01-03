import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Mail } from "lucide-react";
import CozyButton from "@/components/ui/CozyButton";
import { Person } from "@/types/family";

interface InviteModalProps {
  person: Person;
  existingCode?: string | null;
  onClose: () => void;
  onGenerateCode: (personId: string) => Promise<string | null>;
}

const InviteModal = ({ person, existingCode, onClose, onGenerateCode }: InviteModalProps) => {
  const [inviteCode, setInviteCode] = useState<string | null>(existingCode || null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullName = person.last_name 
    ? `${person.first_name} ${person.last_name}`
    : person.first_name;

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const code = await onGenerateCode(person.id);
      if (code) {
        setInviteCode(code);
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareInvite = () => {
    if (inviteCode && navigator.share) {
      navigator.share({
        title: 'Join Our Family Tree',
        text: `You've been invited to join the family tree! Use code: ${inviteCode}`,
      });
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
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-accent-foreground" />
          </div>
        </div>

        <h3 className="font-display text-xl font-semibold text-center mb-2">
          Invite {fullName}
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Share this code so they can claim their profile and join the family tree.
        </p>

        {inviteCode ? (
          <>
            <div className="bg-muted rounded-xl p-4 text-center mb-4">
              <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
                {inviteCode}
              </span>
            </div>

            <div className="flex gap-3 mb-4">
              <CozyButton
                variant="secondary"
                className="flex-1"
                onClick={copyCode}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </CozyButton>
              {navigator.share && (
                <CozyButton
                  variant="primary"
                  className="flex-1"
                  onClick={shareInvite}
                >
                  Share
                </CozyButton>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This code expires in 7 days
            </p>
          </>
        ) : (
          <CozyButton
            variant="primary"
            className="w-full"
            onClick={handleGenerateCode}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Invite Code"}
          </CozyButton>
        )}

        <CozyButton
          variant="secondary"
          className="w-full mt-3"
          onClick={onClose}
        >
          Close
        </CozyButton>
      </motion.div>
    </motion.div>
  );
};

export default InviteModal;
