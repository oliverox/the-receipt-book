"use client"

import type React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const userProfile = useQuery(api.auth.getUserProfile)
  
  // Determine organization name
  const orgName = userProfile?.organization?.name || "ReceiptPro"
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-emerald-600"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-xl font-bold">{orgName}</span>
          </div>
          <UserNav />
        </div>
      </header>
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex lg:w-[240px]">
          <DashboardNav />
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden py-6">{children}</main>
      </div>
    </div>
  )
}