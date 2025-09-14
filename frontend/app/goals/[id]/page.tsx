"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function GoalDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createSupabaseBrowserClient();
  const [goal, setGoal] = useState<{ id: string; title: string; target_cents: number; current_cents: number; portfolio?: string } | null>(null);
  const [contrib, setContrib] = useState<{ label: string; value: number }[]>([]);
  const [investments, setInvestments] = useState<{ id: string; name: string }[]>([]);
  const [balances, setBalances] = useState<{ chequing: number; savings: number }>({ chequing: 0, savings: 0 });
  const [sourceAccount, setSourceAccount] = useState<"chequing" | "savings">("chequing");
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [investmentId, setInvestmentId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const { data: g } = await supabase
        .from("goals")
        .select("id, title, target_amount_cents, current_amount_cents, portfolio")
        .eq("id", id)
        .maybeSingle();
      if (g) {
        setGoal({
          id: g.id,
          title: g.title,
          target_cents: g.target_amount_cents ?? 0,
          current_cents: g.current_amount_cents ?? 0,
          portfolio: g.portfolio ?? undefined,
        });
      }

      const { data: rows } = await supabase
        .from("contributions")
        .select("amount_cents, user:user_id(username)")
        .eq("goal_id", id);

      const rollup = new Map<string, number>();
      (rows ?? []).forEach((r: any) => {
        const label = r.user?.username ?? "Anon";
        rollup.set(label, (rollup.get(label) ?? 0) + (r.amount_cents ?? 0));
      });
      setContrib(Array.from(rollup.entries()).map(([label, cents]) => ({ label, value: Math.round(cents / 100) })));

      // Load user's investments for contribution source select
      const { data: auth } = await supabase.auth.getUser();
      let uid = auth.user?.id;
      if (!uid) {
        const { data: first } = await supabase.from("profiles").select("id").limit(1);
        uid = first?.[0]?.id;
      }
      if (uid) {
        const { data: inv } = await supabase
          .from("user_investments")
          .select("investment_type_id, investment_types(id, name)")
          .eq("user_id", uid);
        const opts = (inv ?? []).map((row: any) => ({ id: row.investment_types?.id ?? row.investment_type_id, name: row.investment_types?.name ?? "Investment" }));
        setInvestments(opts.length ? opts : [{ id: "cash", name: "Cash" }]);
        const { data: prof } = await supabase
          .from("profiles")
          .select("balance_chequing, balance_savings")
          .eq("id", uid)
          .maybeSingle();
        setBalances({ chequing: prof?.balance_chequing ?? 0, savings: prof?.balance_savings ?? 0 });
      } else {
        setInvestments([{ id: "cash", name: "Cash" }]);
        setBalances({ chequing: 0, savings: 0 });
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const total = useMemo(() => contrib.reduce((s, x) => s + x.value, 0), [contrib]);
  const target = (goal?.target_cents ?? 0) / 100;
  const remaining = Math.max(0, Math.round(target - total));
  const percentComplete = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  const COLORS = ["#006ac3", "#ffdf01", "#34d399", "#9b87f5"];
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.12) return null; // hide very small slices to avoid clutter
    const txt = `${name}: $${Number(value).toLocaleString()}`;
    return (
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-gray-700 text-[10px]">
        {txt}
      </text>
    );
  };

  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{goal?.title ?? "Goal"}</h1>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href="/goals">Back</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{goal?.portfolio ?? "Portfolio"} • Target ${target.toLocaleString()}</p>

      <div className="glass-card p-6 space-y-6">
        {/* Visual progress representation */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{percentComplete}%</span>
          </div>
          <Progress value={percentComplete} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${total.toLocaleString()} raised</span>
            <span>${remaining.toLocaleString()} to go</span>
          </div>
        </div>

        {/* Contributions breakdown + pie chart */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Contributions</h2>
          <div className="grid grid-cols-3 gap-3 items-center">
            {/* Breakdown list */}
            <div className="col-span-1 space-y-2">
              {contrib.length === 0 ? (
                <p className="text-xs text-muted-foreground">No contributions yet.</p>
              ) : (
                contrib
                  .slice()
                  .sort((a, b) => b.value - a.value)
                  .map((c, i) => (
                    <div key={c.label} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="truncate">{c.label}</span>
                      </div>
                      <span className="font-mono">${c.value.toLocaleString()}</span>
                    </div>
                  ))
              )}
            </div>
            {/* Pie chart */}
            <ChartContainer config={{}} className="col-span-2 h-[200px] w-full overflow-hidden -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      ...contrib.map((c, i) => ({ name: c.label, value: c.value, color: COLORS[i % COLORS.length] })),
                      { name: "Remaining", value: remaining, color: "#e5e7eb" },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={82}
                    strokeWidth={1}
                    labelLine={false}
                    label={renderLabel}
                  >
                    {[
                      ...contrib.map((_, i) => COLORS[i % COLORS.length]),
                      "#e5e7eb",
                    ].map((fill, idx) => (
                      <Cell key={idx} fill={fill as string} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Leaderboard</h2>
          <ul className="space-y-2">
            {contrib
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((c, idx) => (
                <li key={c.label} className="flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' : 
                      idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="font-medium">{c.label}</span>
                  </div>
                  <span className="font-mono font-semibold">${c.value.toLocaleString()}</span>
                </li>
              ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-md hover:shadow-lg transition-all">
                Add contribution
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contribution</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    min="1" 
                    max={sourceAccount === "chequing" ? balances.chequing : balances.savings}
                    step="1" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="e.g., 50" 
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: ${(sourceAccount === "chequing" ? balances.chequing : balances.savings).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Allocate to investment</Label>
                  <Select value={investmentId} onValueChange={setInvestmentId}>
                    <SelectTrigger><SelectValue placeholder="Select investment" /></SelectTrigger>
                    <SelectContent>
                      {investments.map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Withdraw from account</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSourceAccount("chequing")}
                      className={`p-3 rounded-xl border ${sourceAccount === 'chequing' ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'} text-left hover:shadow-sm transition-all`}
                    >
                      <div className="text-xs text-muted-foreground">Chequing</div>
                      <div className="text-base font-bold">${balances.chequing.toLocaleString()}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceAccount("savings")}
                      className={`p-3 rounded-xl border ${sourceAccount === 'savings' ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'} text-left hover:shadow-sm transition-all`}
                    >
                      <div className="text-xs text-muted-foreground">Savings</div>
                      <div className="text-base font-bold">${balances.savings.toLocaleString()}</div>
                    </button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={async () => {
                  const a = Number(amount);
                  if (!a || a <= 0) {
                    alert("Please enter a valid amount");
                    return;
                  }
                  const availableBalance = sourceAccount === "chequing" ? balances.chequing : balances.savings;
                  if (a > availableBalance) {
                    alert(`Insufficient funds. Available: $${availableBalance.toLocaleString()}`);
                    return;
                  }
                  try {
                    const res = await fetch(`/api/goals/${id}/contribute`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ amount: a, investmentTypeId: investmentId, sourceAccount }),
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || "Failed to contribute");
                    
                    // Update local balance immediately
                    setBalances(prev => ({
                      ...prev,
                      [sourceAccount]: prev[sourceAccount] - a
                    }));
                    
                    setOpen(false);
                    setAmount("");
                    
                    // Track old vs new totals to detect 100% crossing
                    const prevTotal = contrib.reduce((s, x) => s + x.value, 0);
                    const goalTitle = goal?.title ?? "Goal";
                    
                    // Reload contributions
                    const { data: rows } = await supabase
                      .from("contributions")
                      .select("amount_cents, user:user_id(username)")
                      .eq("goal_id", id);
                    const rollup = new Map<string, number>();
                    (rows ?? []).forEach((r: any) => {
                      const label = r.user?.username ?? "Anon";
                      rollup.set(label, (rollup.get(label) ?? 0) + (r.amount_cents ?? 0));
                    });
                    const newContrib = Array.from(rollup.entries()).map(([label, cents]) => ({ label, value: Math.round(cents / 100) }));
                    setContrib(newContrib);
                    
                    // Update goal total
                    const { data: g } = await supabase
                      .from("goals")
                      .select("current_amount_cents")
                      .eq("id", id)
                      .maybeSingle();
                    if (g) {
                      setGoal(prev => prev ? { ...prev, current_cents: g.current_amount_cents ?? prev.current_cents } : prev);
                    }
                    
                    // After updates, compute crossing condition locally without waiting for re-render
                    const newTotal = newContrib.reduce((s, x) => s + x.value, 0);
                    const tgt = (goal?.target_cents ?? 0) / 100;
                    const crossed = tgt > 0 && prevTotal < tgt && newTotal >= tgt;
                    if (crossed) {
                      try {
                        // Notify local Godot listener via WebSocket (localhost only)
                        const ws = new WebSocket('ws://127.0.0.1:8787', 'investbuddy.v1');
                        ws.onopen = () => {
                          const payload = { type: 'goal_complete', id, name: goalTitle, prompt: `A 3D model of ${goalTitle}, game-ready, realistic PBR textures` };
                          ws.send(JSON.stringify(payload));
                          // Close shortly after sending to avoid hanging sockets
                          setTimeout(() => ws.close(), 250);
                        };
                        ws.onerror = () => {
                          console.warn('Could not reach local Godot listener at ws://127.0.0.1:8787');
                        };
                      } catch (err) {
                        console.warn('WebSocket error:', err);
                      }
                    }
                  } catch (e) {
                    alert((e as Error).message);
                  }
                }} disabled={!amount || Number(amount) <= 0 || Number(amount) > (sourceAccount === "chequing" ? balances.chequing : balances.savings)}>Submit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="rounded-xl hover:shadow-md transition-all">
            Invite friends
          </Button>
        </div>
      </div>
    </main>
  );
}
