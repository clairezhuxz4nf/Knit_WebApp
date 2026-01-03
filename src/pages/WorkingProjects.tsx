import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CozyButton from "@/components/ui/CozyButton";

const WorkingProjects = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout className="pb-20">
      <Header title="Working Projects" />

      <div className="flex-1" />

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="fixed bottom-24 right-6"
      >
        <CozyButton
          variant="primary"
          className="w-14 h-14 rounded-full shadow-lifted p-0"
          onClick={() => navigate("/create-project")}
        >
          <span className="text-xl">+</span>
        </CozyButton>
      </motion.div>

      <BottomNav />
    </MobileLayout>
  );
};

export default WorkingProjects;
