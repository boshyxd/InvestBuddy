export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const {
      name,
      accountType,
      targetAmount,
      durationMonths,
      frequency,
      amountPerPeriod,
      withdrawalAccount,
      friendIds,
    } = body as {
      name: string;
      accountType: string;
      targetAmount: number;
      durationMonths: number;
      frequency: "daily" | "monthly";
      amountPerPeriod: number;
      withdrawalAccount: "chequing" | "savings";
      friendIds: string[];
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Resolve current profile
    let creatorId: string | null = null;
    if (user?.id) creatorId = user.id;

    // In dev, allow anonymous creation: pick the first profile if no auth
    if (!creatorId) {
      const { data: first } = await supabase.from("profiles").select("id").limit(1);
      creatorId = first?.[0]?.id ?? null;
    }

    if (!creatorId) {
      return NextResponse.json({ error: "No user available to create goal." }, { status: 401 });
    }

    // Create a circle for this goal (private group)
    const { data: circle, error: circleErr } = await supabase
      .from("circles")
      .insert({ name: name.slice(0, 100), owner_id: creatorId, is_private: true })
      .select("id")
      .single();

    if (circleErr) throw circleErr;

    // Create the goal
    const { data: goal, error: goalErr } = await supabase
      .from("goals")
      .insert({
        circle_id: circle.id,
        created_by: creatorId,
        title: name,
        description: null,
        target_amount_cents: Math.round(targetAmount * 100),
        current_amount_cents: 0,
        portfolio: accountType,
        contribution_per_period: amountPerPeriod,
        contribution_frequency: frequency,
        withdrawal_account: withdrawalAccount,
      })
      .select("id")
      .single();

    if (goalErr) throw goalErr;

    // Add members (creator + invited)
    const memberRows = [creatorId, ...friendIds.filter(Boolean)].map((uid, idx) => ({
      circle_id: circle.id,
      user_id: uid,
      role: idx === 0 ? "owner" : "member",
      is_active: true,
    }));

    const { error: membersErr } = await supabase.from("circle_members").insert(memberRows);
    if (membersErr) throw membersErr;

    return NextResponse.json({ ok: true, goalId: goal.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
