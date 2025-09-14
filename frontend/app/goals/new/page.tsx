"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Tables } from "@/lib/types/supabase";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const schema = z.object({
  name: z.string().min(1).max(200),
  accountType: z.enum(["TFSA", "RRSP", "FHSA"]),
  targetAmount: z.coerce.number().positive(),
  durationMonths: z.coerce.number().int().min(1).max(120),
});

type Step1 = z.infer<typeof schema>;

type Step2 = {
  frequency: "daily" | "monthly";
  amountPerPeriod: number; // dollars
};

type Step3 = {
  withdrawalAccount: "chequing" | "savings";
};

type Step4 = {
  invitedFriendIds: string[];
};

type Wizard = {
  step1: Step1;
  step2: Step2;
  step3: Step3;
  step4: Step4;
};

export default function NewGoalPage() {
  const supabase = createSupabaseBrowserClient();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Load balances and friends
  const [me, setMe] = useState<Tables<"profiles"> | null>(null);
  const [balances, setBalances] = useState({ chequing: 0, savings: 0 });
  const [friends, setFriends] = useState<{ id: string; username: string }[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<{ id: string; username: string }[]>([]);
  const [friendQuery, setFriendQuery] = useState("");

  const form = useForm<Step1>({ resolver: zodResolver(schema), defaultValues: { accountType: "TFSA", durationMonths: 12 } });

  const [step2, setStep2] = useState<Step2>({ frequency: "monthly", amountPerPeriod: 100 });
  const [step3, setStep3] = useState<Step3>({ withdrawalAccount: "chequing" });
  const [step4, setStep4] = useState<Step4>({ invitedFriendIds: [] });

  useEffect(() => {
    const load = async () => {
      // current user profile (auth or fallback)
      const { data: auth } = await supabase.auth.getUser();
let profile: Tables<"profiles"> | null = null;
      if (auth.user?.id) {
        const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
        profile = data ?? null;
      }
      if (!profile) {
        const { data } = await supabase.from("profiles").select("*").limit(1);
        profile = data?.[0] ?? null;
      }
      setMe(profile);
      setBalances({
        chequing: profile?.balance_chequing ?? 0,
        savings: profile?.balance_savings ?? 0,
      });

      if (!profile) return;

      const { data: frs } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

      const friendIds = new Set<string>();
      (frs ?? []).forEach((row: any) => {
        const otherId = row.requester_id === profile!.id ? row.addressee_id : row.requester_id;
        if (otherId) friendIds.add(otherId);
      });

      // Hydrate friend usernames
      let friendList: { id: string; username: string }[] = [];
      if (friendIds.size > 0) {
        const { data: friendProfiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", Array.from(friendIds));
        friendList = (friendProfiles ?? []).map((p) => ({ id: p.id, username: p.username ?? "user" }));
      }
      setFriends(friendList);

      // Suggested = everyone else not me and not already friend (fetch 20, filter client-side for robustness)
      const { data: allUsers } = await supabase
        .from("profiles")
        .select("id, username")
        .neq("id", profile.id)
        .limit(20);
      const suggestions = (allUsers ?? [])
        .filter((u) => !friendIds.has(u.id))
        .slice(0, 8)
        .map((u) => ({ id: u.id, username: u.username ?? "user" }));
      setSuggestedFriends(suggestions);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredFriends = useMemo(() => {
    const q = friendQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => f.username.toLowerCase().includes(q));
  }, [friends, friendQuery]);

  // Step 2 prediction data
  const planMonths = form.watch("durationMonths") || 12;
  const target = form.watch("targetAmount") || 0;
  const monthlyAmount = step2.frequency === "monthly" ? step2.amountPerPeriod : step2.amountPerPeriod * 30;
  const projection = useMemo(() => {
    const data: { month: number; total: number }[] = [];
    let total = 0;
    for (let m = 1; m <= planMonths; m++) {
      total += monthlyAmount;
      data.push({ month: m, total: Math.min(total, target) });
    }
    return data;
  }, [monthlyAmount, planMonths, target]);

  const projectedMonthsToGoal = useMemo(() => {
    if (monthlyAmount <= 0) return Infinity;
    return Math.ceil(target / monthlyAmount) || Infinity;
  }, [target, monthlyAmount]);

  const canNextFromStep1 = !!form.watch("name") && !!form.watch("targetAmount");
  const canNextFromStep2 = step2.amountPerPeriod > 0;
  const canNextFromStep3 = step3.withdrawalAccount === "chequing" || step3.withdrawalAccount === "savings";
  const canCreate = step4.invitedFriendIds.length > 0;

  const goNext = async () => {
    if (step === 1) {
      const ok = await form.trigger(["name", "accountType", "targetAmount", "durationMonths"]);
      if (!ok) return;
      setStep(2);
      return;
    }
    if (step === 2 && canNextFromStep2) return setStep(3);
    if (step === 3 && canNextFromStep3) return setStep(4);
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const createGoal = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form.getValues(),
        frequency: step2.frequency,
        amountPerPeriod: step2.amountPerPeriod,
        withdrawalAccount: step3.withdrawalAccount,
        friendIds: step4.invitedFriendIds,
      };
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create goal");
      window.location.href = `/goals/${json.goalId}`;
    } catch (e) {
      alert((e as Error).message + "\nTip: sign in to enable creation if RLS blocks anon.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-4 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">New Goal</h1>
        <Button asChild variant="outline" size="sm"><Link href="/goals">Cancel</Link></Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`flex-1 h-1 mx-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`flex-1 h-1 mr-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`flex-1 h-1 rounded-full ${step >= 4 ? 'bg-primary' : 'bg-gray-200'}`} />
      </div>

      {/* Step 1: Basic */}
      {step === 1 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g., Spring Break Trip" />
            </div>

            <div className="space-y-2">
              <Label>Investment account type</Label>
              <Select value={form.watch("accountType")} onValueChange={(v) => form.setValue("accountType", v as Step1["accountType"]) }>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TFSA">TFSA</SelectItem>
                  <SelectItem value="RRSP">RRSP</SelectItem>
                  <SelectItem value="FHSA">FHSA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Goal amount</Label>
              <Input id="targetAmount" type="number" step="1" min="1" {...form.register("targetAmount", { valueAsNumber: true })} placeholder="e.g., 5000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMonths">Duration (months)</Label>
              <Input id="durationMonths" type="number" step="1" min="1" max="120" {...form.register("durationMonths", { valueAsNumber: true })} placeholder="e.g., 12" />
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={goNext} disabled={!canNextFromStep1}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Plan */}
      {step === 2 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <Label className="font-medium">Set your plan</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant={step2.frequency === 'daily' ? 'default' : 'outline'} onClick={() => setStep2({ ...step2, frequency: 'daily' })}>Daily</Button>
                <Button size="sm" variant={step2.frequency === 'monthly' ? 'default' : 'outline'} onClick={() => setStep2({ ...step2, frequency: 'monthly' })}>Monthly</Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Amount per {step2.frequency}</span>
                <span className="font-mono font-medium text-primary">${step2.amountPerPeriod.toLocaleString()}</span>
              </div>
              <Slider value={[step2.amountPerPeriod]} min={1} max={Math.max(50, Math.ceil((target || 1000) / (step2.frequency === 'monthly' ? planMonths : planMonths * 30)) * 2)} step={1} onValueChange={([v]) => setStep2({ ...step2, amountPerPeriod: v })} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Projected months to reach</span>
                <span>{isFinite(projectedMonthsToGoal) ? projectedMonthsToGoal : '—'}</span>
              </div>
              <div className="w-full max-w-full overflow-hidden min-w-0">
                <ChartContainer config={{}} className="h-40 w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projection} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={32} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="total" stroke="#006ac3" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={goBack}>Back</Button>
              <Button className="flex-1" onClick={goNext} disabled={!canNextFromStep2}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Funding account */}
      {step === 3 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Label className="font-medium">Choose funding account</Label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setStep3({ withdrawalAccount: 'chequing' })} className={`p-3 rounded-xl border ${step3.withdrawalAccount === 'chequing' ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'} text-left hover:shadow-sm transition-all`}>
                <div className="text-xs text-muted-foreground">Chequing</div>
                <div className="text-base font-bold">${balances.chequing.toLocaleString()}</div>
              </button>
              <button type="button" onClick={() => setStep3({ withdrawalAccount: 'savings' })} className={`p-3 rounded-xl border ${step3.withdrawalAccount === 'savings' ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'} text-left hover:shadow-sm transition-all`}>
                <div className="text-xs text-muted-foreground">Savings</div>
                <div className="text-base font-bold">${balances.savings.toLocaleString()}</div>
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={goBack}>Back</Button>
              <Button className="flex-1" onClick={goNext} disabled={!canNextFromStep3}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Invite friends */}
      {step === 4 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <Label className="font-medium">Invite friends (required)</Label>
              <Input value={friendQuery} onChange={(e) => setFriendQuery(e.target.value)} placeholder="Search friends" className="h-9 w-full" />
            </div>
            {/* Current Friends */}
            {friendQuery.trim() && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Search Results</div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {filteredFriends.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No friends found matching "{friendQuery}".</p>
                  ) : (
                    filteredFriends.map((f) => {
                      const selected = step4.invitedFriendIds.includes(f.id);
                      return (
                        <button key={f.id} type="button" onClick={() => setStep4((prev) => ({ invitedFriendIds: selected ? prev.invitedFriendIds.filter(id => id !== f.id) : [...prev.invitedFriendIds, f.id] }))} className={`w-full flex items-center justify-between p-3 rounded-xl border ${selected ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'} hover:shadow-sm`}>
                          <span className="font-medium">@{f.username}</span>
                          <span className={`text-xs ${selected ? 'text-primary' : 'text-muted-foreground'}`}>{selected ? 'Selected' : 'Tap to add'}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Your Friends */}
            {!friendQuery.trim() && friends.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Your Friends</div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {friends.map((f) => {
                    const selected = step4.invitedFriendIds.includes(f.id);
                    return (
                      <button key={f.id} type="button" onClick={() => setStep4((prev) => ({ invitedFriendIds: selected ? prev.invitedFriendIds.filter(id => id !== f.id) : [...prev.invitedFriendIds, f.id] }))} className={`w-full flex items-center justify-between p-3 rounded-xl border ${selected ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'} hover:shadow-sm`}>
                        <span className="font-medium">@{f.username}</span>
                        <span className={`text-xs ${selected ? 'text-primary' : 'text-muted-foreground'}`}>{selected ? 'Selected' : 'Tap to add'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggested Friends */}
            {!friendQuery.trim() && suggestedFriends.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Suggested Friends</div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {suggestedFriends.map((f) => {
                    const selected = step4.invitedFriendIds.includes(f.id);
                    return (
                      <button key={f.id} type="button" onClick={() => setStep4((prev) => ({ invitedFriendIds: selected ? prev.invitedFriendIds.filter(id => id !== f.id) : [...prev.invitedFriendIds, f.id] }))} className={`w-full flex items-center justify-between p-3 rounded-xl border ${selected ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'} hover:shadow-sm`}>
                        <span className="font-medium">@{f.username}</span>
                        <span className={`text-xs ${selected ? 'text-primary' : 'text-muted-foreground'}`}>{selected ? 'Selected' : 'Tap to add'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={goBack}>Back</Button>
              <Button className="flex-1" onClick={createGoal} disabled={!canCreate || submitting}>{submitting ? 'Creating...' : 'Create goal'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
