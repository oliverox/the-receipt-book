"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Home, Settings, Users, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 py-6">
      <Link href="/dashboard">
        <Button variant="ghost" className={cn("w-full justify-start", pathname === "/dashboard" && "bg-muted")}>
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/receipts">
        <Button
          variant="ghost"
          className={cn("w-full justify-start", pathname.includes("/receipts") && "bg-muted")}
        >
          <FileText className="mr-2 h-4 w-4" />
          Receipts
        </Button>
      </Link>
      <Link href="/contacts">
        <Button
          variant="ghost"
          className={cn("w-full justify-start", pathname.includes("/contacts") && "bg-muted")}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Contacts
        </Button>
      </Link>
      <Link href="/team">
        <Button
          variant="ghost"
          className={cn("w-full justify-start", pathname === "/team" && "bg-muted")}
        >
          <Users className="mr-2 h-4 w-4" />
          Team
        </Button>
      </Link>
      <Link href="/settings">
        <Button
          variant="ghost"
          className={cn("w-full justify-start", pathname === "/settings" && "bg-muted")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </Link>
    </nav>
  )
}