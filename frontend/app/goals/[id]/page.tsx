"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const sample = {
  id: "g1",
  name: "Trip Fund",
  accountType: "TFSA",
  target: 5000,
  contributed: [
    { label: "Alex", value: 900, color: "#006ac3" },
    { label: "Sam", value: 350, color: "#ffdf01" },
  ],
};

export default function GoalDetails({ params }: { params: { id: string } }) {
  const total = sample.contributed.reduce((s, x) => s + x.value, 0);
  const remaining = Math.max(0, sample.target - total);
  const percentComplete = Math.min(100, Math.round((total / sample.target) * 100));

  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{sample.name}</h1>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href="/goals">Back</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{sample.accountType} • Target ${sample.target.toLocaleString()}</p>

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

        {/* Contributions pie chart */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Contributions</h2>
          <ChartContainer config={{}} className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    ...sample.contributed.map((c, i) => ({
                      name: c.label,
                      value: c.value,
                      color: ["#006ac3", "#ffdf01", "#34d399", "#9b87f5"][i % 4],
                    })),
                    { name: "Remaining", value: remaining, color: "#e5e7eb" },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  strokeWidth={1}
                >
                  {[
                    ...sample.contributed.map((_, i) => ["#006ac3", "#ffdf01", "#34d399", "#9b87f5"][i % 4]),
                    "#e5e7eb",
                  ].map((fill, idx) => (
                    <Cell key={idx} fill={fill as string} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Leaderboard</h2>
          <ul className="space-y-2">
            {sample.contributed
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
          <Button className="rounded-xl shadow-md hover:shadow-lg transition-all">
            Add contribution
          </Button>
          <Button variant="outline" className="rounded-xl hover:shadow-md transition-all">
            Invite friends
          </Button>
        </div>
      </div>
    </main>
  );
}
