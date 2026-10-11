import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Key,
  type ReactNode,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  usePresence,
  usePresenceData,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { PIC_MOTION, PIC_REDUCED_MOTION } from "./visual-foundation/motion-tokens";
import { useOptionalLocale } from "./i18n/locale-provider";
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
  interrupted: boolean;
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

function motionTransition({ interrupted, reducedMotion }: SlideMotionContext): Transition {
  if (interrupted) return { duration: 0 };
  return reducedMotion
    ? {
        opacity: { duration: PIC_REDUCED_MOTION.duration.opacity },
        x: { duration: PIC_REDUCED_MOTION.duration.spatial },
      }
    : { duration: PIC_MOTION.duration.standard, ease: PIC_MOTION.ease.organic };
}

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
  userInitiated,
  onTransitionComplete,
}: SlidePanelProps) {
  const [isPresent, safeToRemove] = usePresence();
  const exitingMotionContext: SlideMotionContext = usePresenceData();
  // Presence retains old panel props while waiting. A later navigation owns the current exit policy.
  const currentMotionContext = isPresent ? motionContext : exitingMotionContext;
  const { interrupted } = currentMotionContext;
  const transition = motionTransition(currentMotionContext);
  const locale = useOptionalLocale()?.locale;
  const previousLocaleRef = useRef(locale);
  const controls = useAnimationControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const completionReportedRef = useRef(false);

  function completeTransition(): void {
    if (!shouldComplete || completionReportedRef.current) {
      return;
    }
    completionReportedRef.current = true;
    if (userInitiated && !panelRef.current?.closest("[inert]") &&
      !document.activeElement?.closest('[role="dialog"]')) {
      (focusTargetRef?.current ?? panelRef.current)?.focus();
    }
    onTransitionComplete?.(completion);
  }

  useLayoutEffect(() => {
    let cancelled = false;
    function finishExit() {
      if (!cancelled) safeToRemove?.();
    }
    const localeChanged = previousLocaleRef.current !== locale;
    previousLocaleRef.current = locale;
    if (localeChanged || interrupted) {
      controls.stop();
      controls.set("center");
      if (isPresent) completeTransition();
      // Presence records its outgoing keys in the parent's layout effect before accepting completion.
      else queueMicrotask(finishExit);
    } else if (isPresent) {
      void controls.start("center");
    } else {
      void controls.start("exit").then(finishExit);
    }
    return () => { cancelled = true; controls.stop(); };
  }, [controls, isPresent, locale, interrupted, safeToRemove]);

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
      custom={currentMotionContext}
      initial={initial}
      animate={controls}
      transition={transition}
      variants={slideVariants}
      onAnimationComplete={(definition) => {
        if (definition === "center" && isPresent) {
          completeTransition();
        }
      }}
    >
      {shouldComplete && !interrupted && stepLabel !== undefined ? (
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
  const locale = useOptionalLocale()?.locale;
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [presentation, setPresentation] = useState({
    activeKey, orderedKeys, locale, direction: "neutral" as HorizontalSlideDirection,
    pending: false, interrupted: false,
  });
  let current = presentation;
  if (!Object.is(presentation.activeKey, activeKey)) {
    current = {
      activeKey, orderedKeys, locale,
      direction: explicitDirection ?? inferDirection(
        presentation.activeKey, activeKey, presentation.orderedKeys, orderedKeys ?? [],
      ),
      pending: true, interrupted: presentation.locale !== locale,
    };
    setPresentation(current);
  } else if (presentation.locale !== locale) {
    current = { ...presentation, locale, interrupted: true };
    setPresentation(current);
  } else if (!sameOrder(presentation.orderedKeys, orderedKeys ?? []) && orderedKeys !== undefined) {
    current = { ...presentation, orderedKeys };
    setPresentation(current);
  }
  const direction = current.direction;
  const hasTransition = current.pending;
  const motionContext: SlideMotionContext = {
    direction,
    interrupted: current.interrupted,
    reducedMotion: prefersReducedMotion || current.interrupted,
  };

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
          initial={hasTransition && !current.interrupted ? "enter" : false}
          motionContext={motionContext}
          reducedMotion={prefersReducedMotion}
          shouldComplete={hasTransition}
          stepLabel={stepLabel}
          userInitiated={userInitiated}
          onTransitionComplete={(completion) => {
            setPresentation((previous) => Object.is(previous.activeKey, completion.activeKey)
              ? { ...previous, pending: false } : previous);
            onTransitionComplete?.(completion);
          }}
        >
          {children}
        </SlidePanel>
      </AnimatePresence>
    </div>
  );
}
