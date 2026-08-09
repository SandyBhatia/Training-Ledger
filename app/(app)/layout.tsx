import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavTabs from "@/components/NavTabs";
import SignOut from "@/components/SignOut";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("onboarded, display_name").eq("id", user.id).single();
  if (!profile?.onboarded) redirect("/onboarding");

  return (
    <div>
      <div className="head">
        <span className="brand">TRAINING LEDGER</span>
        <SignOut name={profile?.display_name || ""} />
      </div>
      <NavTabs />
      <main>{children}</main>
    </div>
  );
}
