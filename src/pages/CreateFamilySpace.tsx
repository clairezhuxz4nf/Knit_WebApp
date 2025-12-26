import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Calendar, Mail, MessageCircle, Check } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyButton from "@/components/ui/CozyButton";
import CozyCard from "@/components/ui/CozyCard";
import CozyInput from "@/components/ui/CozyInput";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FamilyMember {
  id: string;
  name: string;
  birthday: string;
}

const bigEvents = [
  { id: "birthday", label: "Family Member Birthdays", icon: "🎂" },
  { id: "christmas", label: "Christmas", icon: "🎄" },
  { id: "lunar", label: "Chinese Lunar New Year", icon: "🧧" },
  { id: "thanksgiving", label: "Thanksgiving", icon: "🦃" },
  { id: "easter", label: "Easter", icon: "🐣" },
  { id: "diwali", label: "Diwali", icon: "🪔" },
];

const CreateFamilySpace = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([
    { id: "1", name: "", birthday: "" },
  ]);
  const [ethnicGroup, setEthnicGroup] = useState("");
  const [cultureBackground, setCultureBackground] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["birthday"]);
  const [inviteMethod, setInviteMethod] = useState<"sms" | "email">("email");
  const [inviteContact, setInviteContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const addMember = () => {
    setMembers([
      ...members,
      { id: Date.now().toString(), name: "", birthday: "" },
    ]);
  };

  const removeMember = (id: string) => {
    if (members.length > 1) {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  const updateMember = (id: string, field: "name" | "birthday", value: string) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      await createFamilySpace();
    }
  };

  const createFamilySpace = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Generate a unique 6-digit family code
      const { data: codeData, error: codeError } = await supabase
        .rpc("generate_family_code");

      if (codeError) throw codeError;

      const familyCode = codeData;

      // Create the family space
      const { data: spaceData, error: spaceError } = await supabase
        .from("family_spaces")
        .insert({
          name: familyName,
          family_code: familyCode,
          created_by: user.id,
        })
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Get user's profile for display name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_space_id: spaceData.id,
          user_id: user.id,
          display_name: profileData?.display_name || null,
          is_admin: true,
        });

      if (memberError) throw memberError;

      toast({
        title: "Family Space Created!",
        description: `Your family code is: ${familyCode}`,
      });

      navigate("/family-space");
    } catch (error: any) {
      console.error("Error creating family space:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create family space. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return familyName.trim().length > 0;
      case 2:
        return members.every((m) => m.name.trim().length > 0);
      case 3:
        return selectedEvents.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <YarnDecoration variant="heart" color="rose" className="w-12 h-12 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Name Your Family
              </h2>
              <p className="text-muted-foreground">
                This will be your family's space name
              </p>
            </div>

            <CozyInput
              label="Family Name (Last Name)"
              placeholder="e.g., The Johnsons"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <YarnDecoration variant="ball" color="sage" className="w-10 h-10 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Add Family Members
              </h2>
              <p className="text-muted-foreground text-sm">
                Add the family members who will share stories
              </p>
            </div>

            <div className="space-y-4">
              {members.map((member, index) => (
                <CozyCard key={member.id} padding="sm" className="relative">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <CozyInput
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) =>
                          updateMember(member.id, "name", e.target.value)
                        }
                      />
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="date"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                          value={member.birthday}
                          onChange={(e) =>
                            updateMember(member.id, "birthday", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    {members.length > 1 && (
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </CozyCard>
              ))}
            </div>

            <button
              onClick={addMember}
              className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Member
            </button>

            <div className="pt-4 space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Cultural Context (Optional)
              </h3>
              <CozyInput
                label="Ethnic Group"
                placeholder="e.g., Chinese, Mexican, Irish"
                value={ethnicGroup}
                onChange={(e) => setEthnicGroup(e.target.value)}
              />
              <CozyInput
                label="Culture Background"
                placeholder="e.g., Southern traditions, Buddhist heritage"
                value={cultureBackground}
                onChange={(e) => setCultureBackground(e.target.value)}
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <YarnDecoration variant="ball" color="butter" className="w-10 h-10 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Important Events
              </h2>
              <p className="text-muted-foreground text-sm">
                Select the milestones you want to celebrate
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {bigEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => toggleEvent(event.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedEvents.includes(event.id)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="text-2xl mb-2">{event.icon}</div>
                  <p className="text-sm font-medium text-foreground">
                    {event.label}
                  </p>
                  {selectedEvents.includes(event.id) && (
                    <Check className="w-4 h-4 text-primary mx-auto mt-2" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <YarnDecoration variant="heart" color="teal" className="w-10 h-10 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Invite Contributors
              </h2>
              <p className="text-muted-foreground text-sm">
                Invite family members to join (optional)
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInviteMethod("email")}
                className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                  inviteMethod === "email"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => setInviteMethod("sms")}
                className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                  inviteMethod === "sms"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                SMS
              </button>
            </div>

            <CozyInput
              label={inviteMethod === "email" ? "Email Address" : "Phone Number"}
              placeholder={
                inviteMethod === "email"
                  ? "grandma@email.com"
                  : "+1 (555) 123-4567"
              }
              type={inviteMethod === "email" ? "email" : "tel"}
              value={inviteContact}
              onChange={(e) => setInviteContact(e.target.value)}
            />

            <p className="text-sm text-muted-foreground text-center">
              You can always invite more members later using the family code
            </p>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <MobileLayout className="flex items-center justify-center">
        <YarnDecoration variant="ball" color="rose" className="w-12 h-12 animate-pulse-soft" />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <Header title="Create Family Space" showBack />

      {/* Progress Indicator */}
      <div className="px-6 py-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Step {step} of 4
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
      </div>

      {/* Bottom Action */}
      <div className="sticky bottom-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <CozyButton
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
        >
          {isSubmitting
            ? "Creating..."
            : step === 4
            ? "Create Family Space"
            : "Continue"}
        </CozyButton>
      </div>
    </MobileLayout>
  );
};

export default CreateFamilySpace;
