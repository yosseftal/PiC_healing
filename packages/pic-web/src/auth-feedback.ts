export type AuthFeedback = "gate.recovery" | "gate.verification" | "gate.expired" | "gate.rateLimit" |
  "gate.rejected" | "gate.offline" | "gate.missingConfig" | "gate.resent";

/** Map provider categories to authored copy; never render raw provider messages or request data. */
export function authFeedback(error: unknown): AuthFeedback {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "gate.offline";
  if (error instanceof Error && error.message === "Public authentication configuration is unavailable") {
    return "gate.missingConfig";
  }
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
  const status = typeof error === "object" && error !== null && "status" in error ? error.status : null;
  if (status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit") return "gate.rateLimit";
  if (code === "otp_expired" || code === "otp_disabled") return "gate.expired";
  if (code === "email_not_confirmed") return "gate.verification";
  if (code === "invalid_credentials" || code === "weak_password" || code === "email_address_invalid" ||
    code === "user_already_exists") return "gate.rejected";
  if (status === 0 || error instanceof TypeError) return "gate.offline";
  return "gate.recovery";
}

export function verificationReturnFeedback(): AuthFeedback | null {
  if (typeof location === "undefined") return null;
  const code = new URLSearchParams(location.hash.slice(1)).get("error_code");
  return code === "otp_expired" || code === "access_denied" ? "gate.expired" : null;
}
