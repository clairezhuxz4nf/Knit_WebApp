import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import CozyButton from "@/components/ui/CozyButton";
import YarnDecoration from "@/components/ui/YarnDecoration";
import logo from "@/assets/logo.png";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout className="flex flex-col" showPattern>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <img
            src={logo}
            alt="Knit - Family Storybook"
            className="w-48 h-48 object-contain animate-float"
          />
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Family Storybook
          </h1>
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
