import type { Variants, Transition } from "framer-motion";

// Transitions
export const transitionFast: Transition = {
  duration: 0.15,
  ease: "easeOut",
};

export const transitionNormal: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

export const transitionSlow: Transition = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1],
};

export const springBounce: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 30,
};

// Variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionNormal,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitionNormal,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springBounce,
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitionNormal,
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitionNormal,
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionNormal,
  },
};

// Page transition variants
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

// Wizard step variants (direction-aware)
export const wizardStepVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export const wizardTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// Button press
export const buttonPress = {
  whileTap: { scale: 0.97 },
  whileHover: { scale: 1.02 },
  transition: transitionFast,
};

// Card hover
export const cardHover = {
  whileHover: {
    y: -4,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
  },
  transition: transitionNormal,
};
