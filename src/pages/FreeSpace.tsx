import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import BottomNav from "@/components/layout/BottomNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import grandmaAvatar from "@/assets/avatars/grandma.png";
import grandpaAvatar from "@/assets/avatars/grandpa.png";
import momAvatar from "@/assets/avatars/mom.png";
import dadAvatar from "@/assets/avatars/dad.png";
import daughterAvatar from "@/assets/avatars/daughter.png";

interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  replyTo?: string;
}

interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images?: string[];
  timestamp: string;
  likes: string[];
  comments: Comment[];
}

const samplePosts: Post[] = [
  {
    id: "1",
    authorName: "Mom",
    authorAvatar: momAvatar,
    content: "Found this old photo of grandma teaching me to cook! Those Sunday afternoons were magical. 🍳💕",
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    ],
    timestamp: "2 hours ago",
    likes: ["Grandma", "Dad", "Daughter"],
    comments: [
      {
        id: "c1",
        authorName: "Grandma",
        authorAvatar: grandmaAvatar,
        content: "I remember this day! You burnt the first batch of dumplings 😂",
      },
      {
        id: "c2",
        authorName: "Mom",
        authorAvatar: momAvatar,
        content: "Mom! Don't expose me like that 😅",
        replyTo: "Grandma",
      },
      {
        id: "c3",
        authorName: "Daughter",
        authorAvatar: daughterAvatar,
        content: "This is so cute! Teach me next time grandma! 🥺",
      },
    ],
  },
  {
    id: "2",
    authorName: "Grandpa",
    authorAvatar: grandpaAvatar,
    content: "Morning walk at the park today. The cherry blossoms reminded me of our honeymoon in Japan, 1965. @Grandma, remember?",
    images: [
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=300&fit=crop",
    ],
    timestamp: "5 hours ago",
    likes: ["Grandma", "Mom", "Dad"],
    comments: [
      {
        id: "c4",
        authorName: "Grandma",
        authorAvatar: grandmaAvatar,
        content: "How could I forget? You got us lost for 3 hours! 😂 But it was the best adventure.",
      },
      {
        id: "c5",
        authorName: "Dad",
        authorAvatar: dadAvatar,
        content: "Wait, you guys went to Japan for your honeymoon? I never knew that!",
      },
    ],
  },
  {
    id: "3",
    authorName: "Daughter",
    authorAvatar: daughterAvatar,
    content: "Just finished reading grandma's poem collection. I'm not crying, you're crying 😭📚 So proud to be her granddaughter.",
    timestamp: "Yesterday",
    likes: ["Grandma", "Grandpa", "Mom", "Dad"],
    comments: [
      {
        id: "c6",
        authorName: "Grandma",
        authorAvatar: grandmaAvatar,
        content: "My dear, you are my greatest poem. 💕",
      },
      {
        id: "c7",
        authorName: "Mom",
        authorAvatar: momAvatar,
        content: "Okay now I'M crying 😭",
      },
    ],
  },
  {
    id: "4",
    authorName: "Dad",
    authorAvatar: dadAvatar,
    content: "Sunday BBQ at our place! The whole family is coming. Grandpa, I'll need your secret marinade recipe 🍖",
    timestamp: "2 days ago",
    likes: ["Grandpa", "Mom"],
    comments: [
      {
        id: "c8",
        authorName: "Grandpa",
        authorAvatar: grandpaAvatar,
        content: "Secret recipe stays secret until you beat me at chess! 😎",
      },
      {
        id: "c9",
        authorName: "Dad",
        authorAvatar: dadAvatar,
        content: "Challenge accepted, old man! 🤣",
        replyTo: "Grandpa",
      },
      {
        id: "c10",
        authorName: "Daughter",
        authorAvatar: daughterAvatar,
        content: "Can I bring my friend Sarah?",
      },
    ],
  },
];

const FreeSpace = () => {
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <MobileLayout className="pb-20 bg-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => navigate("/gems")}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Family Moments
              </h1>
              <p className="text-muted-foreground text-xs">
                Sharing life together
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="divide-y divide-border/50">
        {samplePosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-background p-4"
          >
            {/* Post Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                  <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground text-sm">{post.authorName}</p>
                  <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                </div>
              </div>
              <button className="p-1 rounded-full hover:bg-muted">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Post Content */}
            <p className="text-foreground text-sm mb-3 whitespace-pre-wrap">{post.content}</p>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
              <div className="mb-3 rounded-xl overflow-hidden">
                {post.images.map((img, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={img}
                    alt=""
                    className="w-full object-cover"
                  />
                ))}
              </div>
            )}

            {/* Likes */}
            {post.likes.length > 0 && (
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <Heart className="w-3 h-3 fill-yarn-rose text-yarn-rose" />
                <span>{post.likes.join(", ")}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 py-2 border-t border-border/50">
              <button
                onClick={() => toggleLike(post.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-yarn-rose transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${
                    likedPosts.has(post.id) ? "fill-yarn-rose text-yarn-rose" : ""
                  }`}
                />
                Like
              </button>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4" />
                Comment
              </button>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Comments */}
            {post.comments.length > 0 && (
              <div className="mt-2 space-y-2 bg-muted/30 rounded-xl p-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                      <AvatarFallback className="text-[10px]">{comment.authorName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-semibold text-foreground">{comment.authorName}</span>
                        {comment.replyTo && (
                          <span className="text-primary"> @{comment.replyTo}</span>
                        )}
                        <span className="text-foreground/80"> {comment.content}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default FreeSpace;
