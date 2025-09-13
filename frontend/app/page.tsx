import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  // Placeholder data; replace with real data from Supabase later
  const user = {
    name: "Your Name",
    initials: "YN",
    avatarUrl: "",
    maskedCard: "XXXX1523",
    chequing: "$3,200.00",
    savings: "$8,500.00",
    investments: [
      { type: "TFSA", balance: "$12,340.00" },
      { type: "RRSP", balance: "$7,890.00" },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-6">
      {/* Profile header */}
      <section className="glass-card p-6 card-shine">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-white/50 shadow-xl">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-bold">{user.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold leading-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.maskedCard}</p>
          </div>
        </div>
      </section>

      {/* Accounts summary */}
      <section className="grid grid-cols-2 gap-4">
        <div className="group glass-card p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Chequing</p>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{user.chequing}</p>
        </div>
        <div className="group glass-card p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Savings</p>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{user.savings}</p>
        </div>
      </section>

      {/* Actions */}
      <section className="grid grid-cols-2 gap-3">
        <Button className="w-full rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 btn-premium h-12 font-semibold">Add money</Button>
        <Button variant="outline" className="w-full rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-12 font-semibold border-2">
          Move money
        </Button>
      </section>

      {/* Investments list (larger emphasis) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Investments</h2>
          <span className="text-xs text-muted-foreground bg-accent/20 px-2 py-1 rounded-full">2 Active</span>
        </div>
        <div className="glass-card overflow-hidden">
          <ul className="divide-y divide-gray-100/50">
            {user.investments.map((inv, idx) => (
              <li
                key={inv.type}
                className="group flex items-center justify-between p-5 hover:bg-white/50 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${idx === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {inv.type.slice(0, 2)}
                  </div>
                  <span className="font-semibold text-gray-900">{inv.type}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg block">{inv.balance}</span>
                  <span className="text-xs text-green-600">+12.3%</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Primary CTA */}
      <section className="pt-4">
        <Button asChild className="w-full h-14 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r from-primary via-primary to-blue-600 hover:from-blue-600 hover:to-primary text-lg font-bold btn-premium">
          <Link href="/buddies">Start Investing with Friends</Link>
        </Button>
      </section>
    </main>
  );
}
