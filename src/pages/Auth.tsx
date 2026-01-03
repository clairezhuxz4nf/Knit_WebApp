import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import MobileLayout from "@/components/layout/MobileLayout";
import CozyButton from "@/components/ui/CozyButton";
import CozyInput from "@/components/ui/CozyInput";
import YarnDecoration from "@/components/ui/YarnDecoration";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const phoneSchema = z.string().min(10, "Please enter a valid phone number").regex(/^\+?[0-9\s-()]+$/, "Please enter a valid phone number");
const otpSchema = z.string().length(6, "Please enter the 6-digit code");

// Test credentials for development
const TEST_PHONE = "+15555555555";
const TEST_CODE = "123456";
const TEST_EMAIL = "testuser@knit.app";
const TEST_PASSWORD = "TestKnit123!";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate("/welcome-page");
    }
  }, [user, loading, navigate]);

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
            title: "Welcome back!",
            description: "Test account logged in successfully.",
          });
          navigate("/welcome-page");
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
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        navigate("/welcome-page");
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

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/welcome-page`,
        },
      });
      if (error) {
        toast({
          variant: "destructive",
          title: "Google sign-in failed",
          description: error.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description: "An unexpected error occurred",
      });
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <img
            src={logo}
            alt="Knit - Family Storybook"
            className="w-32 h-32 object-contain animate-float"
          />
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {step === "phone" ? "Welcome Back" : "Enter Verification Code"}
          </h1>
          <p className="text-muted-foreground">
            {step === "phone"
              ? "Sign in with your phone number"
              : isTestMode ? "Enter code 123456 to continue." : "We sent a code to your phone"}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-sm space-y-4"
        >
          {step === "phone" ? (
            <>
              <div>
                <CozyInput
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter your phone number"
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
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSendCode}
                disabled={isSubmitting || phone.trim().length < 10}
              >
                {isSubmitting ? "Sending..." : "Send Code"}
              </CozyButton>

              {/* Test mode hint */}
              <p className="text-xs text-muted-foreground text-center">
                For testing: use +15555555555
              </p>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <CozyButton
                variant="outline"
                size="lg"
                fullWidth
                type="button"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </CozyButton>
            </>
          ) : (
            <>
              <div>
                <CozyInput
                  label="Verification Code"
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
                {isSubmitting ? "Verifying..." : "Verify & Sign In"}
              </CozyButton>

              <button
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                  setIsTestMode(false);
                }}
                className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
              >
                Use a different phone number
              </button>
            </>
          )}

          <p className="text-sm text-muted-foreground text-center pt-4">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/phone-signup")}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="pb-8 flex justify-center gap-3"
      >
        <YarnDecoration variant="ball" color="rose" className="w-6 h-6" />
        <YarnDecoration variant="ball" color="sage" className="w-6 h-6" />
        <YarnDecoration variant="ball" color="butter" className="w-6 h-6" />
      </motion.div>
    </MobileLayout>
  );
};

export default Auth;
