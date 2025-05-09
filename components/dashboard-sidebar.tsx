"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Home, Settings, Users, UserPlus } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { version } from "@/lib/version"

interface DashboardSidebarProps {
  children?: React.ReactNode
  collapsible?: "offcanvas" | "icon" | "none"
}

export function DashboardSidebar({ children, collapsible = "icon" }: DashboardSidebarProps) {
  const pathname = usePathname()

  // Custom classes to center icons in collapsed mode
  const menuIconClass = "group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:items-center"
  const linkClass = "w-full group-data-[state=collapsed]:w-auto group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center"
  const buttonClass = "group-data-[state=collapsed]:!justify-center"

  return (
    <Sidebar className="border-r" collapsible={collapsible}>
      {children}
      <SidebarContent className="pt-2">
        <SidebarMenu>
          <SidebarMenuItem className={menuIconClass}>
            <Link href="/dashboard" className={linkClass}>
              <SidebarMenuButton
                isActive={pathname === "/dashboard"}
                tooltip="Dashboard"
                className={buttonClass}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem className={menuIconClass}>
            <Link href="/receipts" className={linkClass}>
              <SidebarMenuButton
                isActive={pathname.includes("/receipts")}
                tooltip="Receipts"
                className={buttonClass}
              >
                <FileText className="h-4 w-4" />
                <span>Receipts</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem className={menuIconClass}>
            <Link href="/contacts" className={linkClass}>
              <SidebarMenuButton
                isActive={pathname.includes("/contacts")}
                tooltip="Contacts"
                className={buttonClass}
              >
                <UserPlus className="h-4 w-4" />
                <span>Contacts</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem className={menuIconClass}>
            <Link href="/team" className={linkClass}>
              <SidebarMenuButton
                isActive={pathname === "/team"}
                tooltip="Team"
                className={buttonClass}
              >
                <Users className="h-4 w-4" />
                <span>Team</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem className={menuIconClass}>
            <Link href="/settings" className={linkClass}>
              <SidebarMenuButton
                isActive={pathname === "/settings"}
                tooltip="Settings"
                className={buttonClass}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto p-3">
        <div className="text-sidebar-foreground/40 text-[10px] text-center">
          v{version}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}