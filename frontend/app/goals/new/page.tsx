"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(1).max(200),
  accountType: z.enum(["TFSA", "RRSP", "FHSA"]),
  targetAmount: z.coerce.number().positive(),
  durationMonths: z.coerce.number().int().min(1).max(120),
});

type FormData = z.infer<typeof schema>;

export default function NewGoalPage() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { accountType: "TFSA", durationMonths: 12 } });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      // TODO: wire to Supabase (create circle + goal)
      console.log("create goal", data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">New Goal</h1>
        <Button asChild variant="outline" size="sm"><Link href="/goals">Cancel</Link></Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Goal name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g., Spring Break Trip" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Investment account type</Label>
              <Select value={form.watch("accountType")} onValueChange={(v) => form.setValue("accountType", v as FormData["accountType"]) }>
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
              <Input id="targetAmount" type="number" step="1" min="1" {...form.register("targetAmount")} placeholder="e.g., 5000" />
              {form.formState.errors.targetAmount && <p className="text-xs text-destructive">Enter a positive amount</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMonths">Duration (months)</Label>
              <Input id="durationMonths" type="number" step="1" min="1" max="120" {...form.register("durationMonths")} placeholder="e.g., 12" />
              {form.formState.errors.durationMonths && <p className="text-xs text-destructive">1–120 months</p>}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Creating..." : "Create goal"}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
