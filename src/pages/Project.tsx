import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Settings,
  X,
  Book,
  Check,
} from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import Header from "@/components/layout/Header";
import CozyButton from "@/components/ui/CozyButton";
import CozyCard from "@/components/ui/CozyCard";
import YarnDecoration from "@/components/ui/YarnDecoration";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: Date;
  media?: { type: "image" | "video"; url: string }[];
}

const Project = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Welcome to your family storybook project! 🧶\n\nI'm here to help you collect and organize your family stories. Let's start by sharing what makes this occasion special. What's the first memory that comes to mind?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [isCompiled, setIsCompiled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleCompile = () => {
    setIsCompiled(true);
    setShowSettings(false);

    const botMessage: Message = {
      id: Date.now().toString(),
      type: "bot",
      content:
        "🎉 Your storybook has been compiled! It's now ready to be viewed and shared with your family. The stories you've collected will be treasured for generations to come.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
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
        title="Story Collection"
        showBack
        showSettings
        onSettingsClick={() => setShowSettings(true)}
      />

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
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 z-50 flex items-end"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full bg-background rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold">
                  Project Settings
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-full hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <CozyCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Admin Status</p>
                      <p className="text-sm text-muted-foreground">
                        {isAdmin ? "You are the admin" : "You are a contributor"}
                      </p>
                    </div>
                    {isAdmin && <Check className="w-5 h-5 text-secondary" />}
                  </div>
                </CozyCard>

                <CozyCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Contributors</p>
                      <p className="text-sm text-muted-foreground">
                        3 family members
                      </p>
                    </div>
                    <CozyButton variant="ghost" size="sm">
                      Manage
                    </CozyButton>
                  </div>
                </CozyCard>

                {isAdmin && !isCompiled && (
                  <CozyButton
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleCompile}
                  >
                    <Book className="w-5 h-5 mr-2" />
                    Compile Storybook
                  </CozyButton>
                )}

                {isCompiled && (
                  <CozyCard className="bg-secondary/10 border-secondary">
                    <div className="flex items-center gap-3">
                      <Check className="w-6 h-6 text-secondary" />
                      <p className="text-foreground">
                        This project has been compiled into a storybook
                      </p>
                    </div>
                  </CozyCard>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
};

export default Project;
