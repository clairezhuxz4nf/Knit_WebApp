import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJI_OPTIONS = [
  "📁", "📖", "🎉", "🎂", "🎄", "🍳", "🌍", "👤", "🎋", "✈️",
  "📷", "🎬", "💝", "🏠", "👨‍👩‍👧‍👦", "🎓", "💒", "🎁", "🎊", "🪅",
  "🍰", "🎈", "🌸", "🌻", "🌈", "⭐", "💫", "🔥", "❤️", "💕",
  "🎵", "🎨", "📝", "✨", "🌙", "☀️", "🦋", "🐾", "🌺", "🍀",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
}

const EmojiPicker = ({ value, onChange, label }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground/80">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-xl bg-card border-2 border-border hover:border-primary/50 flex items-center justify-center text-3xl transition-all"
        >
          {value}
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute left-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-lg p-3 w-72"
              >
                <p className="text-xs text-muted-foreground mb-2">Choose an emoji</p>
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onChange(emoji);
                        setIsOpen(false);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-primary/10 transition-colors ${
                        value === emoji ? "bg-primary/20 ring-2 ring-primary" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmojiPicker;
