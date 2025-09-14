import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function InviteLanding({ params }: { params: { code: string } }) {
  const inviter = { username: "alex", initials: "A" }; // placeholder
  return (
    <main className="mx-auto w-full max-w-md p-4 space-y-4">
      <h1 className="text-xl font-bold">Add @{inviter.username}</h1>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{inviter.initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">Friend invite</p>
          <p className="text-xs text-muted-foreground">Code: {params.code}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button className="w-full">Add friend</Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/buddies">Back</Link>
        </Button>
      </div>
    </main>
  );
}
