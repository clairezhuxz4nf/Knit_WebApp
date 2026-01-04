import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const JoinFamilySpace = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleJoin = async () => {
    if (!inviteCode.trim() || !user) return;

    setIsJoining(true);
    try {
      // Find the family space by code
      const { data: spaceData, error: spaceError } = await supabase
        .from("family_spaces")
        .select("id, name")
        .eq("family_code", inviteCode.toUpperCase())
        .maybeSingle();

      if (spaceError) throw spaceError;

      if (!spaceData) {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: "No family space found with this code. Please check and try again.",
        });
        setIsJoining(false);
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("people")
        .select("id")
        .eq("family_space_id", spaceData.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: `You're already part of ${spaceData.name}!`,
        });
        navigate("/family-space");
        return;
      }

      // Get user's profile for display name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, birthday")
        .eq("id", user.id)
        .maybeSingle();

      // Parse display_name into first_name and last_name
      const nameParts = (profileData?.display_name || "").split(" ");
      const firstName = nameParts[0] || "New Member";
      const lastName = nameParts.slice(1).join(" ") || null;

      // Join the family space
      const { error: joinError } = await supabase
        .from("people")
        .insert({
          family_space_id: spaceData.id,
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          birth_date: profileData?.birthday || null,
          is_admin: false,
          status: 'active',
          created_by: user.id,
        });

      if (joinError) throw joinError;

      toast({
        title: "Welcome to the family!",
        description: `You've joined ${spaceData.name}`,
      });

      navigate("/family-space");
    } catch (error: any) {
      console.error("Error joining family space:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join family space. Please try again.",
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout className="flex items-center justify-center" showPattern>
        <YarnDecoration variant="ball" color="rose" className="w-12 h-12 animate-pulse-soft" />
      </MobileLayout>
    );
  }

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
            Enter the 6-digit code shared by your family member
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm space-y-6"
        >
          <CozyInput
            label="Family Code"
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
            disabled={inviteCode.length < 6 || isJoining}
          >
            {isJoining ? "Joining..." : "Join Family Space"}
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
