import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Book,
  Radio,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyButton from "@/components/ui/CozyButton";
import CozyCard from "@/components/ui/CozyCard";
import YarnDecoration from "@/components/ui/YarnDecoration";
import ProjectSettingsModal from "@/components/project/ProjectSettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: Date;
  media?: { type: "image" | "video"; url: string }[];
  isListening?: boolean;
  followUpQuestions?: string[];
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  family_space_id: string;
  status: string;
  progress: number;
}

const ProjectPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "user",
      content: "Here's a photo from grandma's 70th birthday party!",
      timestamp: new Date(Date.now() - 120000),
      media: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=400",
        },
      ],
    },
    {
      id: "2",
      type: "bot",
      content: "What a beautiful moment captured! 📷 I'd love to hear more about this special day. Here are some questions to help us dig deeper:",
      timestamp: new Date(Date.now() - 60000),
      followUpQuestions: [
        "Do you remember what was happening right before or after this photo?",
        "Who took this photo—and why that moment?",
        "What do you notice first when you look at this now?",
      ],
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCompiled, setIsCompiled] = useState(false);
  const [isListening] = useState(true); // AI is always listening
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();
    
    if (data) {
      setProject(data);
      setIsCompiled(data.status === "completed");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "That's a beautiful memory! 💕 Can you tell me more about the emotions you felt during that moment?",
        "I love how vivid your description is! Would you like to add any photos that capture this memory?",
        "What a wonderful story! How did this experience shape your family traditions?",
        "Thank you for sharing! Is there anyone else in the family who has a perspective on this story?",
        "This is exactly the kind of detail that makes family stories so special. What happened next?",
      ];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: botResponses[Math.floor(Math.random() * botResponses.length)],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1500);
  };

  const handleImageUpload = () => {
    // Simulate image upload
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: "I uploaded a family photo!",
      timestamp: new Date(),
      media: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=300",
        },
      ],
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "What a lovely photo! 📷 Can you tell me who's in this picture and what was happening when it was taken?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1500);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording simulation
      setTimeout(() => {
        setIsRecording(false);
        const userMessage: Message = {
          id: Date.now().toString(),
          type: "user",
          content: "🎤 [Voice message recorded - 0:15]",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        setTimeout(() => {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content:
              "I've saved your voice recording! Your voice adds such a personal touch to this story. Would you like to add any written details to accompany it?",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
        }, 1000);
      }, 3000);
    }
  };


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <MobileLayout className="flex flex-col">
      <Header
        title={project?.title || "Story Collection"}
        showBack
        showSettings
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* AI Listening Indicator */}
      <motion.div 
        className="mx-4 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 rounded-full">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <Radio className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="text-xs font-medium text-primary">AI is listening to your conversation</span>
          <motion.div 
            className="flex gap-0.5"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <span className="w-1 h-1 rounded-full bg-primary" />
            <span className="w-1 h-1 rounded-full bg-primary" />
            <span className="w-1 h-1 rounded-full bg-primary" />
          </motion.div>
        </div>
      </motion.div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] ${
                  message.type === "user" ? "order-1" : "order-2"
                }`}
              >
                {message.type === "bot" && (
                  <div className="flex items-center gap-2 mb-1">
                    <YarnDecoration
                      variant="ball"
                      color="rose"
                      className="w-5 h-5"
                    />
                    <span className="text-xs text-muted-foreground">
                      Story Helper
                    </span>
                  </div>
                )}

                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {message.media?.map((m, i) => (
                    <img
                      key={i}
                      src={m.url}
                      alt="Uploaded media"
                      className="mt-2 rounded-lg max-w-full"
                    />
                  ))}

                  {/* Follow-up Questions */}
                  {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.followUpQuestions.map((question, qIndex) => (
                        <motion.button
                          key={qIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: qIndex * 0.1 + 0.3 }}
                          onClick={() => setInputText(question)}
                          className="w-full text-left p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-xs text-foreground/80 border border-border/50"
                        >
                          💭 {question}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                <p
                  className={`text-xs text-muted-foreground mt-1 ${
                    message.type === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Compiled Banner */}
      {isCompiled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4"
        >
          <CozyCard className="bg-secondary/20 border-secondary">
            <div className="flex items-center gap-3">
              <Book className="w-6 h-6 text-secondary" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Storybook Ready!</p>
                <p className="text-sm text-muted-foreground">
                  View your completed family storybook
                </p>
              </div>
              <CozyButton variant="secondary" size="sm">
                View
              </CozyButton>
            </div>
          </CozyCard>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-end gap-2">
          <button
            onClick={handleImageUpload}
            className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Share your memory..."
              className="w-full px-4 py-3 pr-12 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
            />
          </div>

          <button
            onClick={toggleRecording}
            className={`p-3 rounded-full transition-all ${
              isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          <CozyButton
            variant="primary"
            className="p-3 rounded-full"
            onClick={handleSend}
            disabled={!inputText.trim()}
          >
            <Send className="w-5 h-5" />
          </CozyButton>
        </div>

        {isRecording && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-destructive mt-2"
          >
            Recording... Tap to stop
          </motion.p>
        )}
      </div>

      {/* Settings Modal */}
      {projectId && (
        <ProjectSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          projectId={projectId}
          onProjectDeleted={() => navigate("/working-projects")}
          onProjectUpdated={(updated) => setProject(updated)}
        />
      )}
    </MobileLayout>
  );
};

export default ProjectPage;
