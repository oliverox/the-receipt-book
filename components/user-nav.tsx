"use client"

import Link from "next/link"
import { CreditCard, LogOut, Settings } from "lucide-react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserNav() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const userProfile = useQuery(api.auth.getUserProfile)
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!isLoaded || !isSignedIn) return "U"
    
    const nameParts = user?.fullName?.split(" ") || []
    if (nameParts.length === 0) return "U"
    
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase()
    }
    
    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase()
  }
  
  // Determine organization name
  const orgName = userProfile?.organization?.name || "My Organization"
  
  // Determine user info
  const userEmail = user?.primaryEmailAddress?.emailAddress || userProfile?.email || ""
  const userName = user?.fullName || userProfile?.name || "User"
  
  // Get avatar image
  const avatarUrl = user?.imageUrl || undefined
  
  // Handle logout
  const handleLogout = () => {
    signOut()
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{orgName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/settings" passHref>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings?tab=billing" passHref>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}