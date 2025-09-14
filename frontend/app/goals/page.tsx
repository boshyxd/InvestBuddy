import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusIcon } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Tables } from "@/lib/types/supabase";

export default async function GoalsOverview() {
  const cad = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "CAD" });
  const supabase = await createSupabaseServerClient();

  // Resolve current user profile (auth or fallback)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let me: Tables<"profiles"> | null = null;
  if (user?.id) {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    me = p ?? null;
  }
  if (!me) {
    const { data: first } = await supabase.from("profiles").select("*").limit(1);
    me = first?.[0] ?? null;
  }

  // Load goals created by me (extend later to include membership)
  const { data: goalsRaw } = await supabase
    .from("goals")
    .select("id, title, target_amount_cents, current_amount_cents, circle_id, portfolio, created_by")
    .order("created_at", { ascending: false })
    .filter("created_by", me?.id ? "eq" : "not.is", me?.id ?? null);

  const goals = (goalsRaw ?? []).map((g) => ({
    id: g.id,
    name: g.title,
    portfolio: g.portfolio ?? "Portfolio",
    target: (g.target_amount_cents ?? 0) / 100,
    contributed: (g.current_amount_cents ?? 0) / 100,
    members: undefined as number | undefined,
    circle_id: g.circle_id,
  }));

  // Derive member counts per circle (best-effort)
  const circleIds = Array.from(new Set(goals.map((g) => g.circle_id).filter(Boolean))) as string[];
  let memberCountByCircle = new Map<string, number>();
  if (circleIds.length > 0) {
    const { data: members } = await supabase
      .from("circle_members")
      .select("circle_id, user_id")
      .in("circle_id", circleIds);
    if (members) {
      for (const m of members) {
        const curr = memberCountByCircle.get(m.circle_id) ?? 0;
        memberCountByCircle.set(m.circle_id, curr + 1);
      }
    }
  }

  const enrichedGoals = goals.map((g) => ({
    ...g,
    members: g.circle_id ? (memberCountByCircle.get(g.circle_id) ?? 1) : 1,
  }));

  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Your Goals</h1>
        <Button asChild size="sm" className="rounded-full shadow-md hover:shadow-lg transition-all">
          <Link href="/goals/new">
            <PlusIcon className="h-4 w-4 mr-1" />
            New goal
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {enrichedGoals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No goals yet. Create your first goal to get started.</p>
        ) : (
          enrichedGoals.map((g) => {
            const pct = Math.min(100, Math.round((g.contributed / Math.max(1, g.target)) * 100));
            return (
              <div key={g.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-lg">{g.name}</h2>
                      <p className="text-sm text-muted-foreground">{g.portfolio} {g.members ? `• ${g.members} members` : ""}</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-full hover:shadow-md transition-all">
                      <Link href={`/goals/${g.id}`}>View</Link>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-between text-sm" aria-live="polite">
                      <span className="font-medium">{cad(g.contributed)}</span>
                      <span className="text-muted-foreground">of {cad(g.target)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
