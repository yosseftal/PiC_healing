import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type Key,
  type ReactNode,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { PIC_MOTION, PIC_REDUCED_MOTION } from "./visual-foundation/motion-tokens";
import "./horizontal-slide-container.css";

export type HorizontalSlideDirection = "forward" | "backward" | "neutral";

export interface HorizontalSlideCompletion {
  activeKey: Key;
  direction: HorizontalSlideDirection;
}

interface HorizontalSlideBaseProps {
  activeKey: Key;
  children: ReactNode;
  stepLabel?: string;
  userInitiated?: boolean;
  focusTargetRef?: RefObject<HTMLElement | null>;
  onTransitionComplete?: (completion: HorizontalSlideCompletion) => void;
}

export type HorizontalSlideContainerProps = HorizontalSlideBaseProps &
  (
    | {
        orderedKeys: readonly Key[];
        direction?: never;
      }
    | {
        orderedKeys?: never;
        direction: HorizontalSlideDirection;
      }
  );

interface SlideMotionContext {
  direction: HorizontalSlideDirection;
  reducedMotion: boolean;
}

interface SlidePanelProps {
  activeKey: Key;
  children: ReactNode;
  completion: HorizontalSlideCompletion;
  focusTargetRef?: RefObject<HTMLElement | null>;
  initial: false | "enter";
  motionContext: SlideMotionContext;
  reducedMotion: boolean;
  shouldComplete: boolean;
  stepLabel?: string;
  transition: Transition;
  userInitiated: boolean;
  onTransitionComplete?: (completion: HorizontalSlideCompletion) => void;
}

const slideVariants = {
  enter: ({ direction, reducedMotion }: SlideMotionContext) => ({
    opacity: 0.92,
    x: reducedMotion ? 0 : enterOffset(direction),
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: ({ direction, reducedMotion }: SlideMotionContext) => ({
    opacity: 0.92,
    x: reducedMotion ? 0 : exitOffset(direction),
  }),
};

function enterOffset(direction: HorizontalSlideDirection): number | string {
  if (direction === "forward") {
    return "var(--pic-slide-inline-distance)";
  }
  if (direction === "backward") {
    return "calc(-1 * var(--pic-slide-inline-distance))";
  }
  return 0;
}

function exitOffset(direction: HorizontalSlideDirection): number | string {
  if (direction === "forward") {
    return "calc(-1 * var(--pic-slide-inline-distance))";
  }
  if (direction === "backward") {
    return "var(--pic-slide-inline-distance)";
  }
  return 0;
}

function sameOrder(previous: readonly Key[] | undefined, current: readonly Key[]): boolean {
  return (
    previous !== undefined &&
    previous.length === current.length &&
    previous.every((key, index) => Object.is(key, current[index]))
  );
}

function inferDirection(
  previousKey: Key | undefined,
  activeKey: Key,
  previousOrder: readonly Key[] | undefined,
  orderedKeys: readonly Key[],
): HorizontalSlideDirection {
  if (previousKey === undefined || !sameOrder(previousOrder, orderedKeys)) {
    return "neutral";
  }

  const previousIndex = orderedKeys.findIndex((key) => Object.is(key, previousKey));
  const activeIndex = orderedKeys.findIndex((key) => Object.is(key, activeKey));
  if (previousIndex < 0 || activeIndex < 0 || previousIndex === activeIndex) {
    return "neutral";
  }
  return activeIndex > previousIndex ? "forward" : "backward";
}

function enterFrom(direction: HorizontalSlideDirection): "inline-end" | "inline-start" | "none" {
  if (direction === "forward") {
    return "inline-end";
  }
  if (direction === "backward") {
    return "inline-start";
  }
  return "none";
}

function SlidePanel({
  activeKey,
  children,
  completion,
  focusTargetRef,
  initial,
  motionContext,
  reducedMotion,
  shouldComplete,
  stepLabel,
  transition,
  userInitiated,
  onTransitionComplete,
}: SlidePanelProps) {
  const isPresent = useIsPresent();
  const panelRef = useRef<HTMLDivElement>(null);
  const completionReportedRef = useRef(false);

  function completeTransition(): void {
    if (!shouldComplete || completionReportedRef.current) {
      return;
    }
    completionReportedRef.current = true;
    if (userInitiated) {
      (focusTargetRef?.current ?? panelRef.current)?.focus();
    }
    onTransitionComplete?.(completion);
  }

  return (
    <motion.div
      ref={panelRef}
      role="region"
      aria-label={stepLabel ?? "Current step"}
      aria-hidden={isPresent ? undefined : true}
      className="pic-horizontal-slide-panel"
      data-active-key={String(activeKey)}
      data-enter-from={enterFrom(completion.direction)}
      data-translation={reducedMotion ? "none" : "logical-inline"}
      inert={isPresent ? undefined : true}
      tabIndex={-1}
      custom={motionContext}
      initial={initial}
      animate="center"
      exit="exit"
      transition={transition}
      variants={slideVariants}
      onAnimationComplete={(definition) => {
        if (definition === "center" && isPresent) {
          completeTransition();
        }
      }}
    >
      {shouldComplete && stepLabel !== undefined ? (
        <span className="pic-horizontal-slide-announcement" role="status" aria-live="polite">
          {stepLabel}
        </span>
      ) : null}
      {children}
    </motion.div>
  );
}

export function HorizontalSlideContainer({
  activeKey,
  children,
  direction: explicitDirection,
  focusTargetRef,
  orderedKeys,
  stepLabel,
  userInitiated = false,
  onTransitionComplete,
}: HorizontalSlideContainerProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const previousKeyRef = useRef<Key | undefined>(undefined);
  const previousOrderRef = useRef<readonly Key[] | undefined>(undefined);
  const hasTransition =
    previousKeyRef.current !== undefined && !Object.is(previousKeyRef.current, activeKey);
  const direction = hasTransition
    ? (explicitDirection ??
      inferDirection(previousKeyRef.current, activeKey, previousOrderRef.current, orderedKeys ?? []))
    : "neutral";
  const motionContext: SlideMotionContext = {
    direction,
    reducedMotion: prefersReducedMotion,
  };
  const transition = prefersReducedMotion
    ? {
        opacity: { duration: PIC_REDUCED_MOTION.duration.opacity },
        x: { duration: PIC_REDUCED_MOTION.duration.spatial },
      }
    : {
        duration: PIC_MOTION.duration.standard,
        ease: PIC_MOTION.ease.organic,
      };

  useLayoutEffect(() => {
    previousKeyRef.current = activeKey;
    previousOrderRef.current = orderedKeys === undefined ? undefined : [...orderedKeys];
  }, [activeKey, orderedKeys]);

  return (
    <div
      className="pic-horizontal-slide-container"
      data-testid="horizontal-slide-container"
      data-transition-direction={direction}
      style={
        {
          "--pic-slide-distance-fallback": PIC_MOTION.distance.step,
        } as CSSProperties
      }
    >
      <AnimatePresence mode="wait" custom={motionContext}>
        <SlidePanel
          key={activeKey}
          activeKey={activeKey}
          completion={{ activeKey, direction }}
          focusTargetRef={focusTargetRef}
          initial={hasTransition ? "enter" : false}
          motionContext={motionContext}
          reducedMotion={prefersReducedMotion}
          shouldComplete={hasTransition}
          stepLabel={stepLabel}
          transition={transition}
          userInitiated={userInitiated}
          onTransitionComplete={onTransitionComplete}
        >
          {children}
        </SlidePanel>
      </AnimatePresence>
    </div>
  );
}
