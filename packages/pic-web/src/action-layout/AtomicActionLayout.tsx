import {
  useLayoutEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

export type ActionIntent = "primary" | "secondary" | "quiet";

interface ActionDescriptorBase {
  label: string;
  accessibleLabel?: string;
  intent: ActionIntent;
  disabled?: boolean;
}

export interface ButtonActionDescriptor extends ActionDescriptorBase {
  kind: "button";
  onAction: () => void;
  pressed?: boolean;
}

export interface LinkActionDescriptor extends ActionDescriptorBase {
  kind: "link";
  href: string;
}

export type ActionDescriptor = ButtonActionDescriptor | LinkActionDescriptor;
export type ActionTuple =
  | readonly []
  | readonly [ActionDescriptor]
  | readonly [ActionDescriptor, ActionDescriptor];

export type BannerIntent = "neutral" | "confirmation" | "reflection" | "recovery";

export interface BannerDescriptor {
  id: string;
  intent: BannerIntent;
  title?: string;
  content: ReactNode;
}

export type BannerTuple =
  | readonly []
  | readonly [BannerDescriptor]
  | readonly [BannerDescriptor, BannerDescriptor];

export interface AtomicActionLayoutProps {
  primaryContent: ReactNode;
  actions?: ActionTuple;
  banners?: BannerTuple;
  alignment?: "stacked" | "paired";
}

const EMPTY_ACTIONS: ActionTuple = [];
const EMPTY_BANNERS: BannerTuple = [];
const INTERACTIVE_SELECTOR = [
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "audio[controls]",
  "video[controls]",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[tabindex]:not([tabindex='-1'])",
  "a[href]",
].join(",");
const PROHIBITED_RECOVERY_LANGUAGE = /\b(?:failed|error|invalid)\b/i;

const actionIntentClasses: Readonly<Record<ActionIntent, string>> = {
  primary: "border-pic-sage-700 bg-pic-sage-700 text-white",
  secondary: "border-pic-line bg-pic-surface text-pic-ink",
  quiet: "border-transparent bg-transparent text-pic-quiet underline decoration-pic-line",
};

const bannerIntentClasses: Readonly<Record<BannerIntent, string>> = {
  neutral: "border-pic-line bg-pic-surface",
  confirmation: "border-pic-sage-200 bg-pic-sage-50",
  reflection: "border-pic-lavender-200 bg-pic-lavender-50",
  recovery: "border-pic-lavender-200 bg-pic-lavender-100",
};

function isAuthoredMarkdownLink(element: Element, root: HTMLElement): boolean {
  if (!(element instanceof HTMLAnchorElement) || !element.hasAttribute("href")) {
    return false;
  }
  const markdownContainer = element.closest("[data-pic-authored-markdown]");
  return markdownContainer !== null && root.contains(markdownContainer);
}

function assertSlotIsNonInteractive(root: HTMLElement, slotName: string): void {
  const interactiveDescendant = Array.from(root.querySelectorAll(INTERACTIVE_SELECTOR)).find(
    (element) => !isAuthoredMarkdownLink(element, root),
  );
  if (interactiveDescendant !== undefined) {
    throw new Error(`${slotName} contains an unintended interactive descendant.`);
  }
}

function assertRecoveryLanguageIsPositive(root: HTMLElement): void {
  const recoveryBanners = [
    ...(root.matches("[data-intent='recovery']") ? [root] : []),
    ...root.querySelectorAll<HTMLElement>("[data-intent='recovery']"),
  ];
  for (const banner of recoveryBanners) {
    if (PROHIBITED_RECOVERY_LANGUAGE.test(banner.textContent ?? "")) {
      throw new Error("Recovery banner language must remain positive and non-blocking.");
    }
  }
}

function useDevelopmentSlotValidation(
  ref: RefObject<HTMLElement | null>,
  slotName: string,
  content: unknown,
): void {
  useLayoutEffect(() => {
    if (!import.meta.env.DEV || ref.current === null) {
      return;
    }
    assertSlotIsNonInteractive(ref.current, slotName);
    assertRecoveryLanguageIsPositive(ref.current);
  }, [content, ref, slotName]);
}

export function AuthoredMarkdown({ children }: { children: ReactNode }) {
  return <div data-pic-authored-markdown>{children}</div>;
}

function ActionControl({ action }: { action: ActionDescriptor }) {
  const sharedClassName = [
    "inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-[var(--radius-pic-button)] border px-4 py-2",
    "font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2",
    "focus-visible:outline-pic-focus disabled:cursor-not-allowed disabled:border-dashed",
    actionIntentClasses[action.intent],
  ].join(" ");
  const stateIndicator = action.disabled ? "Unavailable" : action.kind === "button" && action.pressed ? "Selected" : null;

  if (action.kind === "link") {
    const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (action.disabled) {
        event.preventDefault();
      }
    };
    return (
      <a
        href={action.href}
        aria-label={action.accessibleLabel ?? action.label}
        aria-disabled={action.disabled || undefined}
        tabIndex={action.disabled ? -1 : undefined}
        className={`${sharedClassName} ${action.disabled ? "cursor-not-allowed border-dashed" : ""}`}
        style={{ minBlockSize: "var(--size-pic-touch)" }}
        onClick={handleClick}
      >
        <span>{action.label}</span>
        {stateIndicator === null ? null : <span aria-hidden="true">{stateIndicator}</span>}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={action.accessibleLabel ?? action.label}
      aria-pressed={action.pressed}
      disabled={action.disabled}
      className={sharedClassName}
      style={{ minBlockSize: "var(--size-pic-touch)" }}
      onClick={action.onAction}
    >
      <span>{action.label}</span>
      {stateIndicator === null ? null : <span aria-hidden="true">{stateIndicator}</span>}
    </button>
  );
}

export function TherapeuticBanner({ id, intent, title, content }: BannerDescriptor) {
  const bannerRef = useRef<HTMLElement>(null);
  useDevelopmentSlotValidation(bannerRef, "Banner", content);

  return (
    <aside
      ref={bannerRef}
      data-testid="therapeutic-banner"
      data-banner-id={id}
      data-intent={intent}
      role={intent === "recovery" ? "status" : undefined}
      aria-live={intent === "recovery" ? "polite" : undefined}
      className={[
        "max-h-40 overflow-y-auto overscroll-contain rounded-[var(--radius-pic-card-compact)] border p-4",
        "text-pic-ink [scrollbar-gutter:stable]",
        bannerIntentClasses[intent],
      ].join(" ")}
    >
      {title === undefined ? null : <p className="font-semibold">{title}</p>}
      <div>{content}</div>
    </aside>
  );
}

export function AtomicActionLayout({
  primaryContent,
  actions = EMPTY_ACTIONS,
  banners = EMPTY_BANNERS,
  alignment = "paired",
}: AtomicActionLayoutProps) {
  const primaryContentRef = useRef<HTMLElement>(null);
  useDevelopmentSlotValidation(primaryContentRef, "Primary content", primaryContent);

  const actionLayoutClasses =
    alignment === "paired" ? "flex flex-col gap-3 sm:flex-row" : "flex flex-col gap-3";

  return (
    <div className="grid min-h-0 min-w-0 gap-4">
      <section ref={primaryContentRef} data-testid="atomic-primary-content">
        {primaryContent}
      </section>
      {banners.length === 0 ? null : (
        <div className="grid min-h-0 gap-3" data-testid="therapeutic-banners">
          {banners.map((banner) => (
            <TherapeuticBanner key={banner.id} {...banner} />
          ))}
        </div>
      )}
      {actions.length === 0 ? null : (
        <div
          role="group"
          aria-label="Available actions"
          className={actionLayoutClasses}
          data-alignment={alignment}
        >
          {actions.map((action, index) => (
            <div className="min-w-0 flex-1" key={`${action.kind}-${action.label}-${index}`}>
              <ActionControl action={action} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
