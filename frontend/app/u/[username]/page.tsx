"use client";

import { use, useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpIcon, ArrowDownIcon, PlusIcon, UsersIcon, TrendingUpIcon, BanknoteIcon, PiggyBankIcon, WalletIcon } from "lucide-react";

export default function UserProfile({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const isYourProfile = resolvedParams.username === "you";
  
  const [userData, setUserData] = useState<any>({
    username: isYourProfile ? "you" : resolvedParams.username,
    displayName: isYourProfile ? "Angus Bailey" : resolvedParams.username,
    initials: isYourProfile ? "AB" : resolvedParams.username[0]?.toUpperCase() || "U",
    balanceChequing: 2845.67,
    balanceSavings: 12500.00,
    totalInvestments: 8234.50,
    friendCode: "ABCD1234",
    investments: [
      { type: "Stocks", amount: 3500.00, percentage: 42.5, change: 5.2, icon: "📈" },
      { type: "ETFs", amount: 2800.00, percentage: 34.0, change: 3.8, icon: "💼" },
      { type: "Bonds", amount: 1234.50, percentage: 15.0, change: 1.2, icon: "📊" },
      { type: "GICs", amount: 700.00, percentage: 8.5, change: 0.5, icon: "🔒" }
    ],
    recommendedFriends: [
      { id: "1", username: "alex_investor", mutualGoals: 3 },
      { id: "2", username: "sarah_saver", mutualGoals: 2 },
      { id: "3", username: "mike_money", mutualGoals: 4 },
      { id: "4", username: "emma_finance", mutualGoals: 1 }
    ]
  });

  useEffect(() => {
    if (!isYourProfile) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/debug/profiles", { cache: "no-store" });
        const json = await res.json();
        if (json.ok && json.data && json.data.length) {
          const me = json.data[0];
          setUserData((prev: any) => ({
            ...prev,
            username: me.username ?? "you",
            displayName: me.full_name ?? "Angus Bailey",
            balanceChequing: me.balance_chequing ?? prev.balanceChequing,
            balanceSavings: me.balance_savings ?? prev.balanceSavings,
            friendCode: me.friend_code ?? prev.friendCode,
          }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchProfile();
  }, [isYourProfile]);

  if (isYourProfile) {
    // Your own profile view
    return (
      <main className="mx-auto w-full max-w-md p-4 space-y-4">
        {/* Profile Header */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-semibold">
                  {userData.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">Angus Bailey's Portfolio</h1>
                <p className="text-sm text-muted-foreground">Friend Code: {userData.friendCode}</p>
              </div>
            </div>
          </div>

          {/* Total Balance */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
            <p className="text-3xl font-bold">
              ${(userData.balanceChequing + userData.balanceSavings + userData.totalInvestments).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Money
            </Button>
            <Button variant="outline" className="w-full">
              <ArrowUpIcon className="h-4 w-4 mr-2" />
              Move Money
            </Button>
          </div>
        </div>

        {/* Accounts Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="section-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <WalletIcon className="h-4 w-4" />
                Chequing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${userData.balanceChequing.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="section-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <PiggyBankIcon className="h-4 w-4" />
                Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${userData.balanceSavings.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Investment Types */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Angus Bailey's Investments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground mb-3">
              Total: ${userData.totalInvestments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            {userData.investments.map((inv) => (
              <div key={inv.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{inv.icon}</span>
                  <div>
                    <p className="font-medium">{inv.type}</p>
                    <p className="text-sm text-muted-foreground">{inv.percentage}% of portfolio</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${inv.amount.toLocaleString()}</p>
                  <p className={`text-sm flex items-center gap-1 ${inv.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {inv.change >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                    {Math.abs(inv.change)}%
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommended Friends */}
        <Card className="section-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Recommended Friends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userData.recommendedFriends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {friend.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">@{friend.username}</p>
                    <p className="text-xs text-muted-foreground">{friend.mutualGoals} mutual goals</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    );
  }

  // Other user's profile view
  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-4">
      <h1 className="text-xl font-bold">@{resolvedParams.username}</h1>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback>{userData.initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">Investor profile</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button className="w-full">Add friend</Button>
        <Button variant="outline" className="w-full">Message</Button>
      </div>
    </main>
  );
}
