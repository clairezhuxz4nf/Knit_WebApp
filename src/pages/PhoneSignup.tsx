import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import yarnHearts from "@/assets/yarn-hearts.png";

const phoneSchema = z.string().min(10, "Please enter a valid phone number").regex(/^\+?[0-9\s-()]+$/, "Please enter a valid phone number");
const otpSchema = z.string().length(6, "Please enter the 6-digit code");

// Test credentials for development
const TEST_PHONE = "+15555555555";
const TEST_CODE = "123456";
const TEST_EMAIL = "testuser@knit.app";
const TEST_PASSWORD = "TestKnit123!";

const PhoneSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intent = searchParams.get("intent"); // "join" or null (create)
  const { toast } = useToast();
  
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  const formatPhone = (phoneNumber: string) => {
    return phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber.replace(/\D/g, "")}`;
  };

  const isTestPhone = (phoneNumber: string) => {
    const formatted = formatPhone(phoneNumber);
    return formatted === TEST_PHONE || phoneNumber.replace(/\D/g, "") === "5555555555";
  };

  const handleSendCode = async () => {
    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setError(null);
    setIsSubmitting(true);

    try {
      // Check if this is the test phone number
      if (isTestPhone(phone)) {
        setIsTestMode(true);
        setStep("verify");
        toast({
          title: "Test Mode",
          description: "Use code 123456 to verify.",
        });
        setIsSubmitting(false);
        return;
      }

      const formattedPhone = formatPhone(phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to send code",
          description: error.message,
        });
      } else {
        setStep("verify");
        toast({
          title: "Code sent!",
          description: "We've texted you a verification code.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    const result = otpSchema.safeParse(otp);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setError(null);
    setIsSubmitting(true);

    try {
      // Handle test mode verification
      if (isTestMode) {
        if (otp === TEST_CODE) {
          // Try to sign in with test user, or create if doesn't exist
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
          });

          if (signInError) {
            // User might not exist, try to create
            const { error: signUpError } = await supabase.auth.signUp({
              email: TEST_EMAIL,
              password: TEST_PASSWORD,
              options: {
                emailRedirectTo: `${window.location.origin}/`,
                data: {
                  display_name: "Test User",
                },
              },
            });

            if (signUpError) {
              toast({
                variant: "destructive",
                title: "Test login failed",
                description: signUpError.message,
              });
              setIsSubmitting(false);
              return;
            }
          }

          toast({
            title: "Welcome to Knit!",
            description: "Test account logged in successfully.",
          });
          
          if (intent === "join") {
            navigate("/join-family-space");
          } else {
            navigate("/create-family-space");
          }
        } else {
          setError("Invalid code. Use 123456 for test mode.");
        }
        setIsSubmitting(false);
        return;
      }

      const formattedPhone = formatPhone(phone);
      
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Welcome to Knit!",
          description: "Your account has been created.",
        });
        if (intent === "join") {
          navigate("/join-family-space");
        } else {
          navigate("/create-family-space");
        }
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout className="flex flex-col" showPattern>
      {/* Header with Skip */}
      <div className="flex justify-between items-center px-6 pt-6">
        <button
          onClick={() => step === "verify" ? setStep("phone") : navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate("/welcome-page")}
          className="text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Yarn Hearts Image */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <img
            src={yarnHearts}
            alt="Knit"
            className="w-24 h-24 object-contain"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {step === "phone" ? "What's your phone number?" : "Enter verification code"}
          </h1>
          <p className="text-muted-foreground">
            {step === "phone"
              ? "Create an account to preserve your family's stories!"
              : isTestMode ? "Enter code 123456 to continue." : "We sent a code to your phone."}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-sm space-y-4"
        >
          {step === "phone" ? (
            <>
              <div>
                <CozyInput
                  label=""
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError(null);
                  }}
                />
                {error && (
                  <p className="text-destructive text-sm mt-1">{error}</p>
                )}
              </div>

              <p className="text-sm text-muted-foreground text-center">
                We'll text you a verification code
              </p>

              <CozyButton
                variant="outline"
                size="lg"
                fullWidth
                onClick={handleSendCode}
                disabled={isSubmitting || phone.trim().length < 10}
              >
                {isSubmitting ? "Sending..." : "Next"}
              </CozyButton>

              {/* Test mode hint */}
              <p className="text-xs text-muted-foreground text-center mt-4">
                For testing: use +15555555555
              </p>
            </>
          ) : (
            <>
              <div>
                <CozyInput
                  label=""
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(value);
                    setError(null);
                  }}
                  maxLength={6}
                />
                {error && (
                  <p className="text-destructive text-sm mt-1">{error}</p>
                )}
              </div>

              <button
                onClick={handleSendCode}
                className="text-sm text-primary hover:underline w-full text-center"
                disabled={isSubmitting}
              >
                Resend code
              </button>

              <CozyButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleVerifyCode}
                disabled={isSubmitting || otp.length !== 6}
              >
                {isSubmitting ? "Verifying..." : "Verify"}
              </CozyButton>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="pb-8 flex justify-center gap-3"
      >
        <YarnDecoration variant="ball" color="rose" className="w-6 h-6" />
        <YarnDecoration variant="ball" color="sage" className="w-6 h-6" />
        <YarnDecoration variant="ball" color="butter" className="w-6 h-6" />
      </motion.div>
    </MobileLayout>
  );
};

export default PhoneSignup;
