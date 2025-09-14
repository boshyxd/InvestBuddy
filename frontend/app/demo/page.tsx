"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  const [status, setStatus] = useState<string>("Idle");

  const startCompounding = () => {
    try {
      setStatus("Connecting to VR listener...");
      const ws = new WebSocket("ws://127.0.0.1:8787", "investbuddy.v1");
      ws.onopen = () => {
        const payload = { type: "scenario", name: "compounding" } as const;
        ws.send(JSON.stringify(payload));
        setStatus("Started Compounding Garden ✔");
        setTimeout(() => ws.close(), 250);
      };
      ws.onerror = () => {
        setStatus("Could not reach Godot listener at ws://127.0.0.1:8787");
      };
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-bold">Demo Controls</h1>
      <p className="text-sm text-muted-foreground">
        Start the Compounding Garden scenario in your VR scene via localhost.
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={startCompounding}>Start Compounding Garden</Button>
        <span className="text-xs text-muted-foreground">{status}</span>
      </div>
    </main>
  );
}
