export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient();
    const goalId = params.id;
    const body = await _.json();
    const { amount, investmentTypeId, sourceAccount } = body as { 
      amount: number; 
      investmentTypeId?: string;
      sourceAccount?: "chequing" | "savings";
    };

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
    }

    // Resolve current user
    const { data: auth } = await supabase.auth.getUser();
    let userId = auth.user?.id;
    if (!userId) {
      const { data: first } = await supabase.from("profiles").select("id").limit(1);
      userId = first?.[0]?.id ?? null;
    }
    if (!userId) return NextResponse.json({ error: "No user" }, { status: 401 });

    // Check balance and deduct if sourceAccount is specified
    if (sourceAccount) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance_chequing, balance_savings")
        .eq("id", userId)
        .single();
      
      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      const currentBalance = sourceAccount === "chequing" ? 
        (profile.balance_chequing ?? 0) : 
        (profile.balance_savings ?? 0);
      
      if (currentBalance < amount) {
        return NextResponse.json({ 
          error: `Insufficient funds in ${sourceAccount}. Available: $${currentBalance}` 
        }, { status: 400 });
      }

      // Deduct from the account
      const balanceField = sourceAccount === "chequing" ? "balance_chequing" : "balance_savings";
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ [balanceField]: currentBalance - amount })
        .eq("id", userId);
      
      if (updateErr) throw updateErr;
    }

    // Insert contribution
    const { error: insertErr } = await supabase.from("contributions").insert({
      goal_id: goalId,
      user_id: userId,
      amount_cents: Math.round(amount * 100),
      source: "manual",
      notes: investmentTypeId ? `From ${investmentTypeId}` : null,
    });
    if (insertErr) throw insertErr;

    // Update goal current amount
    const { data: currentGoal } = await supabase
      .from("goals")
      .select("current_amount_cents")
      .eq("id", goalId)
      .single();
    
    if (currentGoal) {
      const newAmount = (currentGoal.current_amount_cents ?? 0) + Math.round(amount * 100);
      await supabase
        .from("goals")
        .update({ current_amount_cents: newAmount })
        .eq("id", goalId);
    }

    // Create transaction record
    await supabase.from("transactions").insert({
      user_id: userId,
      goal_id: goalId,
      type: "contribution",
      amount: amount,
      from_account: sourceAccount || "chequing",
      to_account: "goal",
      description: `Contribution to goal",
    }).catch(() => {}); // Best effort

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
