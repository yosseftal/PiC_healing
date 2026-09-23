export const PIC_MOTION = {
  duration: {
    fast: 0.14,
    standard: 0.24,
    deliberate: 0.36,
    drawer: 0.28,
  },
  ease: {
    organic: [0.22, 1, 0.36, 1],
  },
  distance: {
    step: "clamp(24px, 8vw, 96px)",
    drawer: "100%",
  },
} as const;

export const PIC_REDUCED_MOTION = {
  duration: {
    opacity: PIC_MOTION.duration.fast,
    spatial: 0,
  },
  distance: {
    step: 0,
    drawer: 0,
  },
} as const;
