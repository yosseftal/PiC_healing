/** Shared presentation only: inputs and session utilities retain their native action semantics. */
export const CONTROL_FOCUS = [
  "focus-visible:ring-2 focus-visible:ring-pic-sage-500",
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2",
  "focus-visible:outline-pic-focus",
].join(" ");

export const INPUT_CONTROL = [
  "min-h-11 min-w-11 rounded-pic-button border border-pic-quiet bg-pic-surface",
  "px-3 py-2 text-pic-ink",
  CONTROL_FOCUS,
].join(" ");

export const UTILITY_CONTROL = [
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2",
  "rounded-pic-button border border-pic-quiet bg-pic-surface px-3 py-2 text-pic-ink",
  "hover:bg-pic-sage-50 disabled:cursor-default disabled:opacity-50",
  CONTROL_FOCUS,
].join(" ");
