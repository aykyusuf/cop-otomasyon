"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Route,
  BarChart3,
  Settings,
  Trash2,
  Award,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SimulationControls } from "./simulation-controls";

const navItems = [
  { title: "Ana Sayfa", href: "/dashboard", icon: LayoutDashboard },
  { title: "Harita", href: "/dashboard/harita", icon: Map },
  { title: "Rotalar", href: "/dashboard/rotalar", icon: Route },
  { title: "Analitik", href: "/dashboard/analitik", icon: BarChart3 },
  { title: "Teşvik", href: "/dashboard/tesvik", icon: Award },
  { title: "Ayarlar", href: "/dashboard/ayarlar", icon: Settings },
];


export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-bold text-sm">EcoTrack</h2>
            <p className="text-xs text-muted-foreground">Atık Yönetimi</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SimulationControls />
      </SidebarFooter>
    </Sidebar>
  );
}
