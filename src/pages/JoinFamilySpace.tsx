import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";
import YarnDecoration from "@/components/ui/YarnDecoration";

const JoinFamilySpace = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate("/family-space");
    }, 1500);
  };

  return (
    <MobileLayout className="flex flex-col" showPattern>
      <Header title="Join Family Space" showBack />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <YarnDecoration
            variant="heart"
            color="sage"
            className="w-16 h-16 mx-auto mb-6 animate-float"
          />
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">
            Join Your Family
          </h1>
          <p className="text-muted-foreground">
            Enter the invite code shared by your family member
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm space-y-6"
        >
          <CozyInput
            label="Invite Code"
            placeholder="Enter 6-digit code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="text-center text-2xl tracking-widest"
          />

          <CozyButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleJoin}
            disabled={inviteCode.length < 6 || isLoading}
          >
            {isLoading ? "Joining..." : "Join Family Space"}
          </CozyButton>

          <p className="text-sm text-muted-foreground text-center">
            Don't have a code?{" "}
            <button
              onClick={() => navigate("/create-family-space")}
              className="text-primary font-medium hover:underline"
            >
              Create your own space
            </button>
          </p>
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pb-8 flex justify-center"
      >
        <YarnDecoration variant="wave" color="sage" className="w-40" />
      </motion.div>
    </MobileLayout>
  );
};

export default JoinFamilySpace;
