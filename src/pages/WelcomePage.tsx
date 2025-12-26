import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import CozyButton from "@/components/ui/CozyButton";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import yarnHearts from "@/assets/yarn-hearts.png";
import knitLogo from "@/assets/knit-logo.png";

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checkingFamily, setCheckingFamily] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      checkFamilyMembership();
    }
  }, [user, loading, navigate]);

  const checkFamilyMembership = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        // User already has a family space, redirect there
        navigate("/family-space", { replace: true });
        return;
      }
    } catch (error) {
      console.error("Error checking family membership:", error);
    } finally {
      setCheckingFamily(false);
    }
  };

  if (loading || checkingFamily) {
    return (
      <MobileLayout className="flex items-center justify-center" showPattern>
        <YarnDecoration variant="ball" color="rose" className="w-12 h-12 animate-pulse-soft" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="flex flex-col" showPattern>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Yarn Hearts Image */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 relative"
        >
          {/* Shadow layers */}
          <div className="absolute inset-0 blur-2xl opacity-30 scale-110">
            <div className="w-full h-full bg-gradient-to-br from-yarn-rose via-yarn-sage to-yarn-butter rounded-full" />
          </div>
          <div className="absolute inset-4 blur-xl opacity-20">
            <div className="w-full h-full bg-yarn-rose rounded-full" />
          </div>
          {/* Main image */}
          <img
            src={yarnHearts}
            alt="Knit - Family Storybook"
            className="w-48 h-48 object-contain animate-float relative z-10 drop-shadow-lg"
          />
        </motion.div>

        {/* KNIT Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="flex justify-center -mt-4 -mb-2 relative z-10"
        >
          <img 
            src={knitLogo} 
            alt="KNIT" 
            className="h-20 object-contain"
          />
        </motion.div>

        {/* Tagline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-lg leading-relaxed max-w-[280px]">
            Preserve your family's stories — for today, and for generations.
          </p>
        </motion.div>

        {/* Yarn Wave Decoration */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-[250px] mb-12"
        >
          <YarnDecoration variant="wave" color="rose" className="w-full" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm text-muted-foreground italic mb-10"
        >
          Capture once, experience forever
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="w-full space-y-4 px-4"
        >
          <CozyButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate("/create-family-space")}
          >
            <YarnDecoration variant="heart" color="sage" className="w-5 h-5" />
            Create a Family Space
          </CozyButton>

          <CozyButton
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => navigate("/join-family-space")}
          >
            <YarnDecoration variant="ball" color="rose" className="w-5 h-5" />
            Join a Family Space
          </CozyButton>
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="pb-8 flex justify-center gap-3"
      >
        <YarnDecoration variant="ball" color="rose" className="w-6 h-6" />
        <YarnDecoration variant="ball" color="sage" className="w-6 h-6" />
        <YarnDecoration variant="ball" color="butter" className="w-6 h-6" />
      </motion.div>
    </MobileLayout>
  );
};

export default WelcomePage;
