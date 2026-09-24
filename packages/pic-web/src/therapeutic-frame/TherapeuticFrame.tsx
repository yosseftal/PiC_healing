import {
  type ReactNode,
  useId,
  useLayoutEffect,
} from "react";
import "./therapeutic-frame.css";

type AccessibleName =
  | {
      "aria-label": string;
      "aria-labelledby"?: never;
    }
  | {
      "aria-label"?: never;
      "aria-labelledby": string;
    };

type FrameTitle =
  | {
      "aria-labelledby"?: never;
      title: string;
    }
  | {
      "aria-labelledby": string;
      title?: never;
    };

export type TherapeuticFrameTone = "neutral" | "confirmation" | "reflection";
export type TherapeuticFrameWidth = "reading" | "wide";

type TherapeuticFrameBaseProps = {
  children: ReactNode;
  eyebrow?: ReactNode;
  progress?: ReactNode;
  quietStatus?: ReactNode;
  stageLabel: string;
  tone?: TherapeuticFrameTone;
  utilityTrigger?: ReactNode;
  width?: TherapeuticFrameWidth;
};

export type TherapeuticFrameProps = TherapeuticFrameBaseProps & FrameTitle;

type LockedElement = {
  element: HTMLElement;
  overflow: string;
  overscrollBehavior: string;
};

type DocumentLock = {
  count: number;
  elements: LockedElement[];
};

const documentLocks = new WeakMap<Document, DocumentLock>();

function acquireDocumentLock(documentNode: Document): () => void {
  const activeLock = documentLocks.get(documentNode);
  if (activeLock !== undefined) {
    activeLock.count += 1;
    return () => releaseDocumentLock(documentNode);
  }

  const appRoot = documentNode.getElementById("root");
  const lockTargets = [documentNode.documentElement, documentNode.body, appRoot].filter(
    (element): element is HTMLElement => element !== null,
  );
  const elements = lockTargets.map((element) => ({
    element,
    overflow: element.style.overflow,
    overscrollBehavior: element.style.overscrollBehavior,
  }));

  for (const { element } of elements) {
    element.style.overflow = "hidden";
    element.style.overscrollBehavior = "none";
  }

  documentLocks.set(documentNode, { count: 1, elements });
  return () => releaseDocumentLock(documentNode);
}

function releaseDocumentLock(documentNode: Document): void {
  const activeLock = documentLocks.get(documentNode);
  if (activeLock === undefined) {
    return;
  }

  activeLock.count -= 1;
  if (activeLock.count > 0) {
    return;
  }

  for (const { element, overflow, overscrollBehavior } of activeLock.elements) {
    element.style.overflow = overflow;
    element.style.overscrollBehavior = overscrollBehavior;
  }
  documentLocks.delete(documentNode);
}

function useDocumentLock(): void {
  useLayoutEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    return acquireDocumentLock(document);
  }, []);
}

export function TherapeuticFrame({
  children,
  eyebrow,
  progress,
  quietStatus,
  stageLabel,
  title,
  tone = "neutral",
  utilityTrigger,
  width = "reading",
  ...accessibleName
}: TherapeuticFrameProps) {
  const generatedTitleId = useId();
  const titleId = title === undefined ? undefined : generatedTitleId;
  const frameLabelledBy = accessibleName["aria-labelledby"] ?? titleId;

  useDocumentLock();

  return (
    <section
      aria-labelledby={frameLabelledBy}
      className="pic-therapeutic-frame"
      data-tone={tone}
      data-width={width}
    >
      <header className="pic-therapeutic-frame__header">
        <div className="pic-therapeutic-frame__heading">
          {eyebrow === undefined ? null : (
            <div className="pic-therapeutic-frame__eyebrow">{eyebrow}</div>
          )}
          {title === undefined ? null : <h1 id={titleId}>{title}</h1>}
          {progress === undefined ? null : (
            <div className="pic-therapeutic-frame__progress">{progress}</div>
          )}
          {quietStatus === undefined ? null : (
            <div className="pic-therapeutic-frame__status">{quietStatus}</div>
          )}
        </div>
        {utilityTrigger === undefined ? null : (
          <div className="pic-therapeutic-frame__utility">{utilityTrigger}</div>
        )}
      </header>
      <div
        aria-label={stageLabel}
        className="pic-therapeutic-frame__stage"
        role="region"
      >
        {children}
      </div>
    </section>
  );
}

export type TherapeuticContentCardProps = AccessibleName & {
  children: ReactNode;
};

export function TherapeuticContentCard({
  children,
  ...accessibleName
}: TherapeuticContentCardProps) {
  return (
    <section
      {...accessibleName}
      className="pic-therapeutic-content-card"
      role="region"
      tabIndex={0}
    >
      <div className="pic-therapeutic-content-card__body">{children}</div>
    </section>
  );
}

export type TherapeuticTableScrollerProps = AccessibleName & {
  children: ReactNode;
};

export function TherapeuticTableScroller({
  children,
  ...accessibleName
}: TherapeuticTableScrollerProps) {
  return (
    <div
      {...accessibleName}
      className="pic-therapeutic-table-scroller"
      role="region"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
