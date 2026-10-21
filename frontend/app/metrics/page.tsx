import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Private: Help me pick's funnel and the pick-to-visit rate. Only accounts
// listed in METRICS_USER_IDS (comma-separated Supabase user ids) can see it;
// everyone else gets a 404, so the page doesn't advertise that it exists.

export const metadata: Metadata = { title: "Metrics · Locals", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const RANGES = { "7": 7, "30": 30, all: null } as const;
type RangeKey = keyof typeof RANGES;

interface EventRow {
  created_at: string;
  pick_id: string;
  event: string;
  restaurant_id: string | null;
  props: Record<string, unknown>;
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

// Start of the window, computed per request (this page is dynamic).
function sinceIso(days: number) {
  return new Date(Date.now() - days * 864e5).toISOString();
}

export default async function MetricsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const allowed = (process.env.METRICS_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !allowed.includes(user.id)) notFound();

  const { range: rangeParam } = await searchParams;
  const range: RangeKey = rangeParam === "7" || rangeParam === "all" ? rangeParam : "30";
  const days = RANGES[range];

  let query = createAdminClient()
    .from("pick_events")
    .select("created_at, pick_id, event, restaurant_id, props")
    .order("created_at", { ascending: false })
    .limit(20000);
  if (days) query = query.gte("created_at", sinceIso(days));
  const { data, error } = await query;
  const rows = (data ?? []) as EventRow[];

  const ids = (event: string, pred: (r: EventRow) => boolean = () => true) =>
    new Set(rows.filter((r) => r.event === event && pred(r)).map((r) => r.pick_id));
  const started = ids("pick_started");
  const completed = ids("pick_completed");
  const justPick = ids("pick_completed", (r) => r.props.method === "just_pick");
  const letsGo = ids("result_action", (r) => r.props.action === "lets_go");
  const answers = rows.filter((r) => r.event === "visit_answer");
  const count = (a: string) => answers.filter((r) => r.props.answer === a).length;
  const went = count("went");
  const elsewhere = count("elsewhere");
  const notYet = count("not_yet");

  // Names for the recent picks, from the restaurant API.
  const recent = rows.filter((r) => r.event === "pick_completed").slice(0, 12);
  const names: Record<string, string> = {};
  const recentIds = [...new Set(recent.map((r) => r.restaurant_id).filter(Boolean))] as string[];
  if (recentIds.length) {
    try {
      const res = await fetch(`${API_BASE}/api/restaurants/batch?ids=${recentIds.join(",")}`, { cache: "no-store" });
      const json = await res.json();
      for (const r of json.results ?? []) names[r.restaurant_id] = r.name;
    } catch {
      // ids are fine as a fallback
    }
  }
  const answerByPick = new Map(answers.map((r) => [r.pick_id, String(r.props.answer)]));
  const ANSWER_LABEL: Record<string, string> = { went: "Went", not_yet: "Not yet", elsewhere: "Went elsewhere" };

  const funnel: { label: string; value: string; note: string }[] = [
    { label: "Picks started", value: String(started.size), note: "Tapped Help me pick" },
    { label: "Picks completed", value: String(completed.size), note: `${pct(completed.size, started.size)} of started · ${pct(justPick.size, completed.size)} used Just pick for me` },
    { label: "Let’s go", value: pct(letsGo.size, completed.size), note: `${letsGo.size} of ${completed.size} completed picks asked for directions` },
    { label: "Answered “Did you go?”", value: pct(answers.length, completed.size), note: `${answers.length} answers` },
    { label: "Went elsewhere", value: pct(elsewhere, answers.length), note: `${elsewhere} of ${answers.length} answers · ${notYet} not yet` },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />
      <main id="main-content" className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-14">
        <h1 className="font-display text-[34px] md:text-[44px]">Metrics</h1>
        <p className="text-[15px] mt-1.5" style={{ color: "var(--text-secondary)" }}>Help me pick, from first tap to the table.</p>

        <nav className="flex gap-2 mt-6" aria-label="Time range">
          {(["7", "30", "all"] as RangeKey[]).map((k) => (
            <Link key={k} href={`/metrics?range=${k}`} aria-current={range === k ? "page" : undefined} className={`filter-pill h-11 px-4 text-[15px] font-medium inline-flex items-center${range === k ? " is-active" : ""}`}>
              {k === "all" ? "All time" : `Last ${k} days`}
            </Link>
          ))}
        </nav>

        {error && (
          <p role="alert" className="text-[15px] mt-6">Couldn’t read events: {error.message}. Has the pick_events table been created?</p>
        )}

        {/* The north star */}
        <section className="mt-8" aria-labelledby="north-star">
          <h2 id="north-star" className="text-[15px] font-semibold" style={{ color: "var(--text-secondary)" }}>Pick-to-visit rate</h2>
          <p className="font-display text-[56px] leading-none mt-2 tabular-nums">{pct(went, answers.length)}</p>
          <p className="text-[15px] mt-2" style={{ color: "var(--text-secondary)" }}>
            {answers.length ? `${went} of ${answers.length} people who answered went to their pick.` : "No answers yet. It asks 2 to 72 hours after a pick."}
          </p>
        </section>

        <section className="mt-10" aria-labelledby="funnel">
          <h2 id="funnel" className="text-[21px] font-semibold tracking-[-0.015em] mb-1">Funnel</h2>
          <dl>
            {funnel.map((f, i) => (
              <div key={f.label} className="flex items-baseline justify-between gap-4 py-3.5" style={{ borderTop: i ? "1px solid var(--border)" : undefined }}>
                <dt className="min-w-0">
                  <span className="block text-[16px] font-medium">{f.label}</span>
                  <span className="block text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{f.note}</span>
                </dt>
                <dd className="text-[21px] font-semibold tabular-nums shrink-0">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10" aria-labelledby="recent">
          <h2 id="recent" className="text-[21px] font-semibold tracking-[-0.015em] mb-1">Recent picks</h2>
          {recent.length === 0 ? (
            <p className="text-[15px] py-3" style={{ color: "var(--text-secondary)" }}>No completed picks in this range.</p>
          ) : (
            <ul>
              {recent.map((r, i) => (
                <li key={r.pick_id + r.created_at} className="flex items-baseline justify-between gap-4 py-3" style={{ borderTop: i ? "1px solid var(--border)" : undefined }}>
                  <span className="min-w-0">
                    <Link href={`/restaurant/${r.restaurant_id}`} className="block text-[15px] font-semibold truncate underline-offset-4 hover:underline">
                      {names[r.restaurant_id ?? ""] ?? r.restaurant_id}
                    </Link>
                    <span className="block text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}
                      {" · "}{r.props.method === "just_pick" ? "Just pick for me" : `${r.props.rounds ?? 0} rounds`}
                    </span>
                  </span>
                  <span className="text-[13px] shrink-0" style={{ color: answerByPick.has(r.pick_id) ? "var(--text)" : "var(--text-muted)" }}>
                    {ANSWER_LABEL[answerByPick.get(r.pick_id) ?? ""] ?? "No answer yet"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
