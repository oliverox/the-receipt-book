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
import { version } from "@/lib/version"

interface DashboardSidebarProps {
  children?: React.ReactNode
}

export function DashboardSidebar({ children }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r">
      {children}
      <SidebarContent className="pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" className="w-full">
              <SidebarMenuButton
                isActive={pathname === "/dashboard"}
                tooltip="Dashboard"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/receipts" className="w-full">
              <SidebarMenuButton
                isActive={pathname.includes("/receipts")}
                tooltip="Receipts"
              >
                <FileText className="h-4 w-4" />
                <span>Receipts</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/contacts" className="w-full">
              <SidebarMenuButton
                isActive={pathname.includes("/contacts")}
                tooltip="Contacts"
              >
                <UserPlus className="h-4 w-4" />
                <span>Contacts</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/team" className="w-full">
              <SidebarMenuButton
                isActive={pathname === "/team"}
                tooltip="Team"
              >
                <Users className="h-4 w-4" />
                <span>Team</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/settings" className="w-full">
              <SidebarMenuButton
                isActive={pathname === "/settings"}
                tooltip="Settings"
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