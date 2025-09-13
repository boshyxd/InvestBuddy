"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FriendsPage() {
  // Placeholder lists
  const friends = [
    { username: "alex", initials: "A" },
    { username: "sam", initials: "S" },
  ];
  const requests = [
    { username: "jordan", initials: "J" },
    { username: "casey", initials: "C" },
  ];

  // Invite state
  const myCode = "INVITE1234";
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/invite/${myCode}`;
    return `${window.location.origin}/invite/${myCode}`;
  }, [myCode]);

  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Friends</h1>
        <Button asChild size="sm" variant="outline" className="rounded-full shadow-md hover:shadow-lg transition-all">
          <Link href="/goals/new">Start a goal</Link>
        </Button>
      </div>

      {/* Requests */}
      <section aria-labelledby="requests-heading" className="space-y-3">
        <h2 id="requests-heading" className="text-lg font-semibold">Requests</h2>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending requests.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li key={r.username} className="flex items-center justify-between p-3 hover:bg-gray-50/50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-center leading-10 text-sm font-semibold text-primary shadow-sm">
                      {r.initials}
                    </div>
                    <span className="font-medium">@{r.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="rounded-full shadow-sm hover:shadow-md transition-all">Accept</Button>
                    <Button size="sm" variant="outline" className="rounded-full hover:shadow-sm transition-all">Decline</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Friends list */}
      <section aria-labelledby="friends-heading" className="space-y-3">
        <h2 id="friends-heading" className="text-lg font-semibold">Your friends</h2>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">You haven't added any friends yet.</p>
          ) : (
            <ul className="space-y-3">
              {friends.map((f) => (
                <li key={f.username} className="flex items-center justify-between p-3 hover:bg-gray-50/50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/30 to-accent/20 text-center leading-10 text-sm font-semibold shadow-sm">
                      {f.initials}
                    </div>
                    <span className="font-medium">@{f.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-full hover:shadow-sm transition-all">
                      <Link href={`/u/${f.username}`}>View</Link>
                    </Button>
                    <Button asChild size="sm" className="rounded-full shadow-sm hover:shadow-md transition-all">
                      <Link href="/goals/new">Invite</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Invite widget */}
      <section aria-labelledby="invite-heading" className="space-y-3">
        <h2 id="invite-heading" className="text-lg font-semibold">Invite friends</h2>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="friend-code" className="text-sm font-medium">Friend code</Label>
            <div className="flex items-center gap-2">
              <Input
                id="friend-code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter friend code"
                aria-describedby="friend-code-help"
                className="rounded-xl shadow-sm"
              />
              <Button disabled={!codeInput} className="rounded-xl shadow-md hover:shadow-lg transition-all">Add friend</Button>
            </div>
            <p id="friend-code-help" className="text-xs text-muted-foreground">Paste a code you received from a friend.</p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="share-link" className="text-sm font-medium">Share your link</Label>
            <div className="flex items-center gap-2">
              <Input id="share-link" readOnly value={shareUrl} className="rounded-xl shadow-sm" />
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {}
                }}
                aria-live="polite"
                className="rounded-xl hover:shadow-md transition-all"
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Anyone with this link can add you as a friend.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
