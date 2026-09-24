import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  type ReactNode,
  type RefObject,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export interface TherapeuticSheetProps {
  children: ReactNode;
  defaultOpen?: boolean;
  description?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: string;
  trigger: ReactNode;
  triggerLabel: string;
}

function useInertBackground(open: boolean, triggerRef: RefObject<HTMLButtonElement | null>): void {
  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const background = triggerRef.current?.closest("body > *");
    if (!(background instanceof HTMLElement)) {
      return;
    }

    const hadInert = background.hasAttribute("inert");
    const previousAriaHidden = background.getAttribute("aria-hidden");
    background.setAttribute("inert", "");
    background.setAttribute("aria-hidden", "true");

    return () => {
      if (!hadInert) {
        background.removeAttribute("inert");
      }
      if (previousAriaHidden === null) {
        background.removeAttribute("aria-hidden");
      } else {
        background.setAttribute("aria-hidden", previousAriaHidden);
      }
    };
  }, [open, triggerRef]);
}

function useRestoreTriggerFocus(open: boolean, triggerRef: RefObject<HTMLButtonElement | null>): void {
  const wasOpenRef = useRef(open);

  useLayoutEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (wasOpen && !open) {
      triggerRef.current?.focus();
    }
  }, [open, triggerRef]);
}

export function TherapeuticSheet({
  children,
  defaultOpen = false,
  description,
  onOpenChange,
  open,
  title,
  trigger,
  triggerLabel,
}: TherapeuticSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const resolvedOpen = open ?? uncontrolledOpen;
  useInertBackground(resolvedOpen, triggerRef);
  useRestoreTriggerFocus(resolvedOpen, triggerRef);

  function handleOpenChange(nextOpen: boolean): void {
    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={resolvedOpen}>
      <Dialog.Trigger
        aria-label={triggerLabel}
        className={[
          "inline-flex min-h-11 min-w-11 items-center justify-center rounded-pic-button",
          "border border-pic-line bg-pic-surface px-3 text-pic-ink",
          "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2",
          "focus-visible:outline-pic-focus",
        ].join(" ")}
        ref={triggerRef}
        type="button"
      >
        {trigger}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className={[
            "fixed inset-0 z-50 bg-pic-ink/30",
            "transition-opacity duration-[var(--motion-pic-drawer-active)]",
            "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
          ].join(" ")}
          data-testid="therapeutic-sheet-overlay"
        />
        <Dialog.Content
          aria-describedby={description === undefined ? undefined : descriptionId}
          aria-labelledby={titleId}
          aria-modal="true"
          className={[
            "fixed inset-y-0 end-0 z-50 grid h-[100dvh] max-h-[100dvh]",
            "w-[calc(100%-1rem)] max-w-[28rem] grid-rows-[auto_minmax(0,1fr)]",
            "overflow-hidden border-s border-pic-line bg-pic-surface shadow-pic-sheet",
            "transition-[transform,opacity] duration-[var(--motion-pic-drawer-active)]",
            "ease-[var(--ease-pic-organic)] data-[state=closed]:translate-x-full",
            "data-[state=open]:translate-x-0 rtl:data-[state=closed]:-translate-x-full",
          ].join(" ")}
          data-testid="therapeutic-sheet-content"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const background = triggerRef.current?.closest("body > *");
            background?.removeAttribute("inert");
            triggerRef.current?.focus();
          }}
        >
          <header className="flex items-start gap-4 border-b border-pic-line p-6">
            <div className="min-w-0 flex-1">
              <Dialog.Title asChild>
                <h2 className="m-0 text-pic-heading font-pic-heading text-pic-ink" id={titleId}>
                  {title}
                </h2>
              </Dialog.Title>
              {description === undefined ? null : (
                <Dialog.Description asChild>
                  <p className="mt-2 text-pic-quiet leading-pic-quiet text-pic-quiet" id={descriptionId}>
                    {description}
                  </p>
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label={`Close ${title.toLocaleLowerCase()}`}
              className={[
                "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center",
                "rounded-pic-button border border-pic-line bg-pic-surface text-pic-ink",
                "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2",
                "focus-visible:outline-pic-focus",
              ].join(" ")}
              type="button"
            >
              <X aria-hidden="true" size={20} strokeWidth={2} />
            </Dialog.Close>
          </header>

          <div
            aria-label={`${title} content`}
            className={[
              "min-h-0 overflow-y-auto overscroll-contain p-6",
              "[scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]",
            ].join(" ")}
            role="region"
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
