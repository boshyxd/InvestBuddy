"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Tables } from "@/lib/types/supabase";

export default function FriendsPage() {
  const supabase = createSupabaseBrowserClient();

  const [me, setMe] = useState<Tables<"profiles"> | null>(null);
  const [friends, setFriends] = useState<{ id: string; username: string; initials: string }[]>([]);
  const [requests, setRequests] = useState<{ id: string; username: string; initials: string; friendshipId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [myCode, setMyCode] = useState<string>("");

  const shareUrl = useMemo(() => {
    const code = myCode || "";
    if (typeof window === "undefined") return `/invite/${code}`;
    return `${window.location.origin}/invite/${code}`;
  }, [myCode]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Try to get current auth user
        const { data: auth } = await supabase.auth.getUser();
        let profile: Tables<"profiles"> | null = null;
        if (auth.user?.id) {
          const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
          profile = data ?? null;
        }
        // Dev fallback: pick first profile
        if (!profile) {
          const { data } = await supabase.from("profiles").select("*").limit(1);
          profile = data?.[0] ?? null;
        }
        setMe(profile);
        setMyCode(profile?.friend_code ?? "");

        if (!profile) return;

        // Pending requests where I am addressee
        const { data: reqs } = await supabase
          .from("friendships")
          .select("id, status, requester:requester_id(id, username)")
          .eq("addressee_id", profile.id)
          .eq("status", "pending");
        setRequests(
          (reqs ?? [])
            .filter((r: any) => r.requester)
            .map((r: any) => ({
              id: r.requester.id,
              username: r.requester.username ?? "user",
              initials: (r.requester.username?.[0] ?? "U").toUpperCase(),
              friendshipId: r.id,
            }))
        );

        // Accepted friendships where I am either side
        const { data: frs } = await supabase
          .from("friendships")
          .select("id, requester:requester_id(id, username), addressee:addressee_id(id, username)")
          .eq("status", "accepted")
          .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

        const friendList = (frs ?? []).map((row: any) => {
          const other = row.requester?.id === profile!.id ? row.addressee : row.requester;
          return {
            id: other?.id ?? row.id,
            username: other?.username ?? "user",
            initials: (other?.username?.[0] ?? "U").toUpperCase(),
          };
        });
        setFriends(friendList);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptRequest = async (friendshipId: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    // refresh
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: reqs } = await supabase
      .from("friendships")
      .select("id, status, requester:requester_id(id, username)")
      .eq("addressee_id", me?.id)
      .eq("status", "pending");
    setRequests(
      (reqs ?? []).map((r: any) => ({
        id: r.requester.id,
        username: r.requester.username ?? "user",
        initials: (r.requester.username?.[0] ?? "U").toUpperCase(),
        friendshipId: r.id,
      }))
    );
  };

  const declineRequest = async (friendshipId: string) => {
    await supabase.from("friendships").update({ status: "declined" }).eq("id", friendshipId);
    setRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
  };

  const addFriendByCode = async () => {
    if (!me || !codeInput) return;
    const { data: target } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("friend_code", codeInput)
      .maybeSingle();

    if (!target || target.id === me.id) return;
    const insert = await supabase.from("friendships").insert({
      requester_id: me.id,
      addressee_id: target.id,
      status: "pending",
    });
    if (!("error" in insert) || !insert.error) {
      setCodeInput("");
    }
  };

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
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending requests.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li key={r.friendshipId} className="flex items-center justify-between p-3 hover:bg-gray-50/50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-center leading-10 text-sm font-semibold text-primary shadow-sm">
                      {r.initials}
                    </div>
                    <span className="font-medium">@{r.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="rounded-full shadow-sm hover:shadow-md transition-all" onClick={() => acceptRequest(r.friendshipId)}>Accept</Button>
                    <Button size="sm" variant="outline" className="rounded-full hover:shadow-sm transition-all" onClick={() => declineRequest(r.friendshipId)}>Decline</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Friends list */}
      <section aria-labelledby="friends-heading" className="space-y-3">
        <h2 id="friends-heading" className="text-lg font-semibold">Angus Bailey's friends</h2>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : friends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Angus Bailey hasn't added any friends yet.</p>
          ) : (
            <ul className="space-y-3">
              {friends.map((f) => (
                <li key={f.id} className="flex items-center justify-between p-3 hover:bg-gray-50/50 rounded-xl transition-colors">
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
              <Button disabled={!codeInput || !me} onClick={addFriendByCode} className="rounded-xl shadow-md hover:shadow-lg transition-all">Add friend</Button>
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
            <p className="text-xs text-muted-foreground">Anyone with this link can add Angus Bailey as a friend.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
