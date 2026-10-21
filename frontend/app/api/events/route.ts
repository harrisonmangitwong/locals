import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Help me pick events (see lib/track.ts). Open to signed-out visitors, so
// everything is validated and only known fields are kept; the table itself
// has RLS with no policies, so only this server route can write to it.

const EVENTS = new Set(["pick_started", "pick_completed", "result_action", "visit_answer"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESTAURANT_ID = /^r_[a-z0-9]{1,32}$/i;
const ACTIONS = new Set(["lets_go", "details", "share", "pick_again", "swap"]);
const ANSWERS = new Set(["went", "not_yet", "elsewhere"]);

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 30).map((x) => x.slice(0, 40)) : undefined);

// Only the fields each event is meant to carry.
function cleanProps(event: string, p: Record<string, unknown>): Record<string, unknown> | null {
  switch (event) {
    case "pick_started":
      return {
        cuisines: strList(p.cuisines) ?? [],
        prices: strList(p.prices) ?? [],
        max_miles: num(p.max_miles),
        only_new: typeof p.only_new === "boolean" ? p.only_new : undefined,
        shortlist_size: num(p.shortlist_size),
        location: ["device", "chosen", "none"].includes(String(p.location)) ? p.location : undefined,
      };
    case "pick_completed":
      return {
        runner_up: typeof p.runner_up === "string" && RESTAURANT_ID.test(p.runner_up) ? p.runner_up : null,
        rounds: num(p.rounds),
        method: p.method === "just_pick" ? "just_pick" : "compared",
      };
    case "result_action":
      return ACTIONS.has(String(p.action)) ? { action: p.action } : null;
    case "visit_answer":
      return ANSWERS.has(String(p.answer)) ? { answer: p.answer, hours_after: num(p.hours_after) } : null;
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 4000) return new NextResponse(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const event = String(body.event);
  const pickId = String(body.pick_id);
  const anonId = String(body.anon_id);
  const restaurantId = body.restaurant_id == null ? null : String(body.restaurant_id);
  if (!EVENTS.has(event) || !UUID.test(pickId) || !UUID.test(anonId)) return new NextResponse(null, { status: 400 });
  if (restaurantId !== null && !RESTAURANT_ID.test(restaurantId)) return new NextResponse(null, { status: 400 });

  const props = cleanProps(event, (body.props && typeof body.props === "object" ? body.props : {}) as Record<string, unknown>);
  if (!props) return new NextResponse(null, { status: 400 });

  // Attach the account when there is one; tracking still works signed out.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    // no session
  }

  const { error } = await createAdminClient().from("pick_events").insert({
    pick_id: pickId,
    anon_id: anonId,
    user_id: userId,
    event,
    restaurant_id: restaurantId,
    props,
  });
  // Tracking never breaks the app: failures are swallowed client-side, and
  // reported here only so they show up in the server logs.
  if (error) {
    console.error("pick_events insert failed:", error.message);
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
