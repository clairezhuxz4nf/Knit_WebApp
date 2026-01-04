import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Check } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyButton from "@/components/ui/CozyButton";
import CozyCard from "@/components/ui/CozyCard";
import CozyInput from "@/components/ui/CozyInput";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const projectTypes = [
  { id: "culture-story", label: "Culture Story", icon: "🌍", description: "Preserve cultural heritage and traditions" },
  { id: "food-family", label: "Food at Family", icon: "🍳", description: "Collect family recipes and food memories" },
  { id: "member-story", label: "Member Story", icon: "👤", description: "Document a family member's life story" },
  { id: "traditions", label: "Traditions", icon: "🎋", description: "Record family traditions and rituals" },
  { id: "milestone", label: "Milestone", icon: "🎉", description: "Celebrate special achievements" },
  { id: "travel", label: "Travel Memories", icon: "✈️", description: "Capture family travel experiences" },
];

const outputTypes = [
  { id: "storybook", label: "Storybook", icon: "📖", description: "A beautiful illustrated story" },
  { id: "video", label: "Video (Coming Soon)", icon: "🎬", description: "A compiled video memory", disabled: true },
  { id: "album", label: "Photo Album (Coming Soon)", icon: "📷", description: "A curated photo collection", disabled: true },
];

interface FamilyMember {
  id: string;
  name: string;
  birthday: string;
}

const CreateProject = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [projectType, setProjectType] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [outputType, setOutputType] = useState("storybook");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [familySpaceId, setFamilySpaceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load family members from storage
    const saved = localStorage.getItem("familySpace");
    if (saved) {
      const parsed = JSON.parse(saved);
      setFamilyMembers(parsed.members || []);
    }

    // Pre-fill from navigation state (when coming from an event)
    if (location.state) {
      const { event, date, eventId: passedEventId, familySpaceId: passedFamilySpaceId } = location.state as { 
        event?: string; 
        date?: string; 
        eventId?: string;
        familySpaceId?: string;
      };
      if (event) setEventName(event);
      if (date) {
        const dateObj = new Date(date);
        setEventDate(dateObj.toISOString().split("T")[0]);
      }
      if (passedEventId) setEventId(passedEventId);
      if (passedFamilySpaceId) setFamilySpaceId(passedFamilySpaceId);
    }

    // Fetch user's family space if not passed
    const fetchFamilySpace = async () => {
      if (!user || familySpaceId) return;
      const { data } = await supabase
        .from("family_members")
        .select("family_space_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (data) {
        setFamilySpaceId(data.family_space_id);
      }
    };
    fetchFamilySpace();
  }, [location.state, user, familySpaceId]);

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      if (!user || !familySpaceId) {
        toast.error("Please log in and join a family space first");
        return;
      }

      setIsSubmitting(true);
      try {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            title: projectName,
            description: eventName,
            family_space_id: familySpaceId,
            created_by: user.id,
            event_id: eventId,
            status: "in_progress",
            progress: 0,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success("Project created successfully!");
        navigate(`/project/${data.id}`);
      } catch (error: any) {
        console.error("Error creating project:", error);
        toast.error(error.message || "Failed to create project");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return projectName.trim().length > 0 && eventName.trim().length > 0;
      case 2:
        return projectType.length > 0;
      case 3:
        return true; // Members are optional
      case 4:
        return outputType.length > 0;
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
            <div className="text-center mb-6">
              <YarnDecoration variant="heart" color="rose" className="w-12 h-12 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Event Details
              </h2>
              <p className="text-muted-foreground text-sm">
                What occasion is this project for?
              </p>
            </div>

            <CozyInput
              label="Project Name"
              placeholder="e.g., Family CNY Memories 2026"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />

            <CozyInput
              label="Event Name"
              placeholder="e.g., Grandpa's 80th Birthday"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/80">
                Event Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>
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
              <YarnDecoration variant="ball" color="sage" className="w-12 h-12 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Project Type
              </h2>
              <p className="text-muted-foreground text-sm">
                What kind of story are you creating?
              </p>
            </div>

            <div className="space-y-3">
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setProjectType(type.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    projectType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    {projectType === type.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
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
              <Users className="w-12 h-12 mx-auto mb-4 text-secondary" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Invite Contributors
              </h2>
              <p className="text-muted-foreground text-sm">
                Who should collaborate on this project?
              </p>
            </div>

            <div className="space-y-3">
              {familyMembers.length > 0 ? (
                familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedMembers.includes(member.id)
                        ? "border-secondary bg-secondary/10"
                        : "border-border bg-card hover:border-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{member.name}</h3>
                      </div>
                      {selectedMembers.includes(member.id) && (
                        <Check className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <CozyCard className="text-center py-8">
                  <p className="text-muted-foreground">
                    No family members added yet. You can invite them later.
                  </p>
                </CozyCard>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Selected contributors can add their stories and photos
            </p>
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
              <YarnDecoration variant="heart" color="butter" className="w-12 h-12 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Output Format
              </h2>
              <p className="text-muted-foreground text-sm">
                How would you like to experience this story?
              </p>
            </div>

            <div className="space-y-3">
              {outputTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => !type.disabled && setOutputType(type.id)}
                  disabled={type.disabled}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    type.disabled
                      ? "border-border bg-muted/50 opacity-60 cursor-not-allowed"
                      : outputType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    {outputType === type.id && !type.disabled && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <MobileLayout>
      <Header title="Create Project" showBack />

      {/* Progress */}
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
        <div className="flex gap-3">
          {step > 1 && (
            <CozyButton
              variant="outline"
              size="lg"
              onClick={() => setStep(step - 1)}
            >
              Back
            </CozyButton>
          )}
          <CozyButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? "Creating..." : step === 4 ? "Start Project" : "Continue"}
          </CozyButton>
        </div>
      </div>
    </MobileLayout>
  );
};

export default CreateProject;
