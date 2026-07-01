import { useReducedMotion } from "framer-motion";
import type { Transition, Variants } from "framer-motion";

/** Impeccable product register — snappy, não decorativo. */
export const DASH_EASE = [0.22, 1, 0.36, 1] as const;

export const DASH_ENTER_MS = 0.2;
export const DASH_EXIT_MS = 0.15;
export const DASH_STAGGER_S = 0.04;
export const DASH_STAGGER_CAP = 6;

export function useDashboardMotion() {
  const reduced = useReducedMotion();
  return {
    reduced: !!reduced,
    enter: reduced ? 0 : DASH_ENTER_MS,
    exit: reduced ? 0 : DASH_EXIT_MS,
    stagger: reduced ? 0 : DASH_STAGGER_S,
  };
}

export function dashTransition(
  reduced: boolean,
  extra?: Partial<Transition>,
): Transition {
  if (reduced) return { duration: 0 };
  return { duration: DASH_ENTER_MS, ease: DASH_EASE, ...extra };
}

export const fadeUpVariants = (reduced: boolean): Variants => ({
  hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0 : DASH_ENTER_MS, ease: DASH_EASE },
  },
  exit: {
    opacity: 0,
    y: reduced ? 0 : -4,
    transition: { duration: reduced ? 0 : DASH_EXIT_MS, ease: DASH_EASE },
  },
});

export const listContainerVariants = (
  reduced: boolean,
  stagger = DASH_STAGGER_S,
): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: reduced ? 0 : stagger,
      delayChildren: reduced ? 0 : 0.04,
    },
  },
});

export const listItemVariants = (reduced: boolean): Variants => ({
  hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0 : DASH_ENTER_MS, ease: DASH_EASE },
  },
});
