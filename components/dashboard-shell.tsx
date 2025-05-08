"use client"

import type React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Image from "next/image"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { UserNav } from "@/components/user-nav"
import { SidebarInset, SidebarProvider, SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const userProfile = useQuery(api.auth.getUserProfile)
  
  // Determine organization name
  const orgName = userProfile?.organization?.name || "Digital Receipt Pro"
  
  return (
    <div className="flex min-h-screen flex-col">
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <DashboardSidebar>
            <SidebarHeader className="border-b px-4 py-2">
              <div className="flex items-center gap-3 h-8">
                <Image
                  src="/logo.png"
                  alt="Digital Receipt Pro Logo"
                  width={20}
                  height={20}
                  className="h-6 w-auto"
                />
                <span className="font-bold">Digital Receipt Pro</span>
              </div>
            </SidebarHeader>
          </DashboardSidebar>
          <SidebarInset>
            <header className="z-40 border-b bg-background">
              <div className="w-full px-4 sm:px-6 flex h-12 items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <span className="text-xl font-bold">{orgName}</span>
                </div>
                <UserNav />
              </div>
            </header>
            <main className="flex w-full flex-1 flex-col overflow-auto p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}