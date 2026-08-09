"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOut({ name }: { name: string }) {
  const router = useRouter();
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {name && <span className="muted" style={{ fontSize: 12.5 }}>{name}</span>}
      <button className="btn ghost" style={{ padding: "6px 12px", fontSize: 12 }}
        onClick={async () => { await createClient().auth.signOut(); router.push("/login"); router.refresh(); }}>
        Sign out
      </button>
    </span>
  );
}
