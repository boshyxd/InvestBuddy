import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusIcon } from "lucide-react";

export default function GoalsOverview() {
  const cad = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "CAD" });
  const goals = [
    { id: "g1", name: "Trip Fund", accountType: "TFSA", target: 5000, contributed: 1250, members: 2 },
    { id: "g2", name: "Laptop", accountType: "RRSP", target: 2000, contributed: 850, members: 3 },
  ];

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
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.contributed / g.target) * 100));
          return (
            <div key={g.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">{g.name}</h2>
                    <p className="text-sm text-muted-foreground">{g.accountType} • {g.members} members</p>
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
        })}
      </div>
    </main>
  );
}
