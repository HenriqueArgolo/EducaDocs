"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function WordFadeIn({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");

  return (
    <motion.div
      className={cn("flex flex-wrap gap-x-2", className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: delay,
          },
        },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
