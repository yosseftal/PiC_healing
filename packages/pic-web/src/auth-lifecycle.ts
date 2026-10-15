import { InquiryOperationCancelled, inquiryGenerationStore } from "./inquiry-lifecycle";
import type { RepositoryPort } from "pic-engine";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getVerifiedUser } from "./promote-path";

export type IdentityState = { status: "guest" | "checking" | "verified" | "reauthenticate" | "uncertain"; owner: string | null };
const UNCERTAIN_KEY = "pic-web.uncertain-completions.v1";

function readUncertainCompletions(): unknown[] {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(UNCERTAIN_KEY);
  const retained: unknown = raw === null ? [] : JSON.parse(raw);
  if (!Array.isArray(retained)) throw new Error("Previous uncertain completions cannot be read");
  return retained;
}

/** A retained uncertain session cannot become a new Finish or Guest promotion, including after reload. */
function assertCompletionAllowed(sessionId: string): void {
  if (readUncertainCompletions().some((entry: unknown) => typeof entry === "object" && entry !== null &&
    "sessionIds" in entry && Array.isArray(entry.sessionIds) && entry.sessionIds.includes(sessionId))) {
    throw new Error("This completion remains uncertain and cannot be repeated");
  }
}

/** SDK identity is independent of SessionEngine mode and never bootstraps therapeutic persistence. */
export function createAuthLifecycle(getClient: () => SupabaseClient | null, invalidate: () => void) {
  const partialCompletions = new Set<string>();
  const cancelled = new Set<() => void>();
  const listeners = new Set<() => void>();
  let state: IdentityState = { status: "guest", owner: null };
  let owner: string | null = null;
  let uncertain = false;
  let uncertainAppend: { owner: string; generation: number; sessionIds: string[]; event: unknown } | null = null;
  let verified = false;
  let revision = 0;
  let consumers = 0;
  let unsubscribe: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let sessionKey: string | null = null;
  const publish = (status: IdentityState["status"], identity = owner) => {
    state = { status: uncertain ? "uncertain" : status, owner: identity };
    for (const listener of listeners) listener();
  };
  const suspend = (status?: IdentityState["status"]) => {
    revision++;
    verified = false;
    invalidate();
    publish(status ?? (owner === null ? "guest" : "reauthenticate"));
  };
  const accept = (user: User) => {
    if (owner !== null && owner !== user.id) { suspend(); throw new Error("Sign in with the same identity"); }
    verified = true;
    publish("verified", user.id);
    return user;
  };
  const verify = async () => {
    const client = getClient();
    if (client === null) throw new Error("Public authentication configuration is unavailable");
    const started = revision;
    let user: User;
    try { user = await getVerifiedUser(client); }
    catch (error) { if (started === revision) suspend(); throw error; }
    if (started !== revision) throw new Error("Identity changed during verification");
    return accept(user);
  };
  const awaitOwner = async (expected: string, generation: number): Promise<number> => {
    if (generation !== inquiryGenerationStore.getSnapshot()) throw new InquiryOperationCancelled();
    if (state.status !== "verified" || state.owner !== expected) {
      if (state.status !== "checking") publish("reauthenticate");
      await new Promise<void>((resolve, reject) => {
        const check = () => {
          if (state.status !== "verified" || state.owner !== expected) return;
          listeners.delete(check); cancelled.delete(cancel); resolve();
        };
        const cancel = () => {
          listeners.delete(check); cancelled.delete(cancel); reject(new InquiryOperationCancelled());
        };
        cancelled.add(cancel); listeners.add(check);
        for (const listener of listeners) listener();
        check();
      });
    }
    try { await verify(); } catch {
      suspend();
      return awaitOwner(expected, generation);
    }
    if (generation !== inquiryGenerationStore.getSnapshot()) throw new InquiryOperationCancelled();
    if (state.status !== "verified" || state.owner !== expected) return awaitOwner(expected, generation);
    return revision;
  };
  return {
    admit: awaitOwner,
    current: (expected: string, generation: number, admitted: number) =>
      generation === inquiryGenerationStore.getSnapshot() && admitted === revision &&
      state.status === "verified" && state.owner === expected,
    hasPending: () => cancelled.size > 0,
    hasPartialCompletion: () => partialCompletions.size > 0,
    assertCompletionAllowed(sessionId: string) {
      if (uncertainAppend?.sessionIds.includes(sessionId)) {
        throw new Error("This completion remains uncertain and cannot be repeated");
      }
      assertCompletionAllowed(sessionId);
    },
    preserveUncertainty() {
      if (uncertainAppend === null) throw new Error("There is no uncertain completion to retain");
      const retained = readUncertainCompletions();
      if (retained.some((entry) => JSON.stringify(entry) === JSON.stringify(uncertainAppend))) return;
      // Separate from promotion recovery: retained facts never authorize a replay or Guest promotion.
      localStorage.setItem(UNCERTAIN_KEY, JSON.stringify([...retained, uncertainAppend]));
    },
    cancelPending() {
      for (const cancel of [...cancelled]) cancel();
    },
    completeDetachment() {
      if (uncertain) {
        partialCompletions.clear();
        uncertainAppend = null;
        uncertain = false;
        publish(verified ? "verified" : "reauthenticate");
      }
    },
    guard(port: RepositoryPort, expected: string, isPromotion = () => false): RepositoryPort {
      // Every call retains its own continuation. Resume does not restart a multi-write Finish.
      return new Proxy(port, {
        get(target, property, receiver) {
          const method: unknown = Reflect.get(target, property, receiver);
          if (typeof method !== "function") return method;
          return async (...args: unknown[]) => {
            if (property === "incrementUseCount" && typeof args[1] === "string") assertCompletionAllowed(args[1]);
            const generation = inquiryGenerationStore.getSnapshot();
            let admitted = await awaitOwner(expected, generation);
            let started: number;
            let result: unknown;
            for (;;) {
              if (generation !== inquiryGenerationStore.getSnapshot()) throw new InquiryOperationCancelled();
              if (admitted !== revision || state.status !== "verified" || state.owner !== expected) {
                admitted = await awaitOwner(expected, generation);
                continue;
              }
              started = revision;
              if (property === "incrementUseCount" && typeof args[1] === "string") partialCompletions.add(args[1]);
              try { result = await method.apply(target, args); break; }
              catch (error: unknown) {
                const cause = error instanceof Error && error.cause ? error.cause : error;
                const rejected = error instanceof Error && error.name === "SupabaseRepositoryNotAuthenticatedError" ||
                  typeof cause === "object" && cause !== null &&
                  (("status" in cause && cause.status === 401) || ("code" in cause && cause.code === "PGRST301"));
                if (!rejected && property === "appendTimelineEvent") {
                  uncertainAppend = { owner: expected, generation,
                    sessionIds: [...partialCompletions], event: structuredClone(args[0]) };
                  uncertain = true;
                  publish("uncertain");
                  // The public port cannot reconcile an append whose response was lost. Never replay it.
                  await new Promise<never>((_resolve, reject) => {
                    const cancel = () => { cancelled.delete(cancel); reject(new InquiryOperationCancelled()); };
                    cancelled.add(cancel);
                  });
                }
                const increment = property === "incrementUseCount";
                const completion = property === "savePlayerSession" &&
                  typeof args[0] === "object" && args[0] !== null &&
                  "success_declared" in args[0] && args[0].success_declared === true;
                if (!rejected && ((!completion && !increment) || isPromotion())) throw error;
                suspend();
                admitted = await awaitOwner(expected, generation);
              }
            }
            if (property === "incrementUseCount" && typeof args[1] === "string") partialCompletions.add(args[1]);
            if (property === "savePlayerSession" && typeof args[0] === "object" && args[0] !== null &&
              "success_declared" in args[0] && args[0].success_declared === true && "id" in args[0] &&
              typeof args[0].id === "string") partialCompletions.delete(args[0].id);
            const read = property === "getGroup" || property === "getPlayerSession" ||
              property === "getTreatment" || property === "listTreatments";
            if (read && (started !== revision || generation !== inquiryGenerationStore.getSnapshot())) {
              throw new InquiryOperationCancelled("Identity changed during read");
            }
            return result;
          };
        },
      });
    },
    store: {
      getSnapshot: () => state,
      subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    },
    verify,
    bind(userId: string) {
      if (owner !== null && owner !== userId) throw new Error("Work belongs to another identity");
      owner = userId;
    },
    suspend,
    start(): () => void {
      consumers++;
      if (unsubscribe === null) {
        const client = getClient();
        if (client !== null) {
          const { data } = client.auth.onAuthStateChange((_event, session) => {
            const nextKey = session === null ? null : `${session.user.id}:${session.access_token}`;
            if (nextKey !== null && nextKey === sessionKey && state.status === "verified") return;
            sessionKey = nextKey;
            suspend(session === null ? undefined : "checking");
            if (timer !== null) clearTimeout(timer);
            if (session === null) return;
            const started = revision;
            // SDK callbacks run under its Auth lock. Verification must run after the callback returns.
            timer = setTimeout(() => {
              timer = null;
              void verify().catch(() => { if (started === revision) suspend(); });
            }, 0);
          });
          unsubscribe = () => { data.subscription.unsubscribe(); };
        }
      }
      let released = false;
      return () => {
        if (released) return;
        released = true;
        consumers--;
        if (consumers > 0) return;
        unsubscribe?.();
        unsubscribe = null;
        sessionKey = null;
        if (timer !== null) clearTimeout(timer);
        timer = null;
        revision++;
      };
    },
  };
}
