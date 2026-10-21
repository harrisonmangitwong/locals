// Help me pick tracking: a handful of events tied together by a pick_id,
// sent to /api/events. Signed-out visitors get a random anonymous id kept in
// this browser; no location, IP or device details are ever sent.
//
// Nothing is sent from localhost (unless localStorage "locals-track-dev" is
// "1"), and visiting any page with ?notrack turns tracking off for that
// browser, so your own testing stays out of the data.

export type PickEvent = "pick_started" | "pick_completed" | "result_action" | "visit_answer";

const ANON_KEY = "locals-anon-id";
const OPT_OUT_KEY = "locals-notrack";
const LAST_PICK_KEY = "locals-last-pick";

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Fallback for very old browsers: RFC 4122 v4 from Math.random.
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
  );
}

function anonId(): string {
  const s = storage();
  const existing = s?.getItem(ANON_KEY);
  if (existing) return existing;
  const id = newId();
  s?.setItem(ANON_KEY, id);
  return id;
}

function trackingOff(): boolean {
  if (typeof window === "undefined") return true;
  const s = storage();
  if (new URLSearchParams(window.location.search).has("notrack")) s?.setItem(OPT_OUT_KEY, "1");
  if (s?.getItem(OPT_OUT_KEY) === "1") return true;
  // Set localStorage "locals-track-dev" to "1" to try tracking locally.
  if (s?.getItem("locals-track-dev") === "1") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function newPickId(): string {
  return newId();
}

/** Fire-and-forget. Uses sendBeacon so it survives navigating away (Let's go opens Maps). */
export function track(event: PickEvent, pickId: string, data: { restaurantId?: string; props?: Record<string, unknown> } = {}) {
  if (trackingOff()) return;
  const body = JSON.stringify({
    event,
    pick_id: pickId,
    anon_id: anonId(),
    restaurant_id: data.restaurantId ?? null,
    props: data.props ?? {},
  });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }))) return;
  } catch {
    // fall through to fetch
  }
  fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}

// ---------------------------------------------------------------------------
// The most recent completed pick, kept in this browser so "Did you go?" can
// ask about it on a later visit. Asked once, 2 to 72 hours after the pick.
// ---------------------------------------------------------------------------

export interface LastPick {
  pickId: string;
  restaurantId: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  imageUrl: string | null;
  at: number;
  asked?: boolean;
}

const ASK_AFTER_MS = 2 * 60 * 60 * 1000;
const ASK_UNTIL_MS = 72 * 60 * 60 * 1000;

export function rememberPick(pick: Omit<LastPick, "at" | "asked">) {
  storage()?.setItem(LAST_PICK_KEY, JSON.stringify({ ...pick, at: Date.now() }));
}

export function pickToAskAbout(): LastPick | null {
  try {
    const raw = storage()?.getItem(LAST_PICK_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as LastPick;
    const age = Date.now() - p.at;
    if (p.asked || age < ASK_AFTER_MS || age > ASK_UNTIL_MS) return null;
    return p;
  } catch {
    return null;
  }
}

/** Records the "Did you go?" answer for a remembered pick and stops asking. */
export function answerVisit(pick: LastPick, answer: "went" | "not_yet" | "elsewhere") {
  markAsked();
  track("visit_answer", pick.pickId, {
    restaurantId: pick.restaurantId,
    props: { answer, hours_after: Math.round((Date.now() - pick.at) / 36e5) },
  });
}

export function markAsked() {
  try {
    const s = storage();
    const raw = s?.getItem(LAST_PICK_KEY);
    if (!raw) return;
    s?.setItem(LAST_PICK_KEY, JSON.stringify({ ...JSON.parse(raw), asked: true }));
  } catch {
    // nothing to do
  }
}
