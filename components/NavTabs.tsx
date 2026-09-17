"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/dashboard", "Dashboard"],
  ["/today", "Today"],
  ["/coach", "Coach"],
  ["/program", "Program"],
  ["/checkin", "Check-in"],
  ["/nutrition", "Nutrition"],
  ["/wind", "Wind-down"],
  ["/settings", "Settings"],
];

export default function NavTabs() {
  const path = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map(([href, label]) => (
        <Link key={href} href={href} data-on={path === href}>{label}</Link>
      ))}
    </nav>
  );
}
