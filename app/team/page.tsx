"use client"

import { useState } from "react"
import { 
  Check, 
  ChevronsUpDown, 
  Mail, 
  MoreHorizontal, 
  Search, 
  UserPlus, 
  AlertTriangle,
  Clock
} from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Roles with descriptions
const roles = [
  { label: "Admin", value: "admin", description: "Full access to all features" },
  { label: "Member", value: "member", description: "Can create and manage receipts" },
  { label: "Viewer", value: "viewer", description: "Read-only access (doesn't count towards quota)" }
]

// Example job titles
const exampleTitles = [
  "Treasurer",
  "Accountant", 
  "Cashier", 
  "Director",
  "Bookkeeper",
  "Financial Officer",
  "President",
  "Secretary",
  "CEO"
]

export default function TeamPage() {
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRolePopoverOpen, setIsRolePopoverOpen] = useState(false)
  const [isTitlePopoverOpen, setIsTitlePopoverOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form state for adding new team member
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState("")
  const [newUserTitle, setNewUserTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get subscription information
  const subscriptionInfo = useQuery(api.users.getTeamSubscriptionInfo)
  
  // Get team members
  const teamMembers = useQuery(api.users.listOrganizationUsers) || []
  
  // Mutations
  const inviteUser = useMutation(api.users.inviteUser)
  const updateUserProfile = useMutation(api.users.updateUserProfile)
  const deactivateUser = useMutation(api.users.deactivateUser)

  // Filter users based on search
  const filteredTeamMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle invite submission
  const handleInviteSubmit = async () => {
    if (!newUserEmail || !newUserRole) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await inviteUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        title: newUserTitle || undefined,
      })

      if (result.success) {
        toast({
          title: "Invitation sent",
          description: result.message,
        })
        setIsAddDialogOpen(false)
        // Reset form
        setNewUserName("")
        setNewUserEmail("")
        setNewUserRole("")
        setNewUserTitle("")
      } else {
        toast({
          title: "Failed to send invitation",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "There was an error sending the invitation.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle role update
  const handleRoleUpdate = async (userId: string, role: string) => {
    try {
      await updateUserProfile({
        userId,
        role,
      })
      
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      })
    } catch {
      toast({
        title: "Error",
        description: "There was an error updating the role",
        variant: "destructive"
      })
    }
    setIsRolePopoverOpen(false)
  }

  // Handle title update
  const handleTitleUpdate = async (userId: string, title: string) => {
    try {
      await updateUserProfile({
        userId,
        title: title || undefined,
      })
      
      toast({
        title: "Title updated",
        description: "User title has been updated successfully",
      })
    } catch {
      toast({
        title: "Error",
        description: "There was an error updating the title",
        variant: "destructive"
      })
    }
    setIsTitlePopoverOpen(false)
  }

  // Handle remove user
  const handleRemoveUser = async (userId: string) => {
    try {
      await deactivateUser({
        userId,
      })
      
      toast({
        title: "User removed",
        description: "The user has been removed from your organization",
      })
    } catch {
      toast({
        title: "Error",
        description: "There was an error removing the user",
        variant: "destructive"
      })
    }
  }

  // Format date from timestamp
  const formatLastActive = (timestamp: number | undefined) => {
    if (!timestamp) return "Never";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader heading="Team" text="Manage team members who can access your organization.">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!subscriptionInfo?.canAddMoreMembers && !subscriptionInfo?.canAlwaysAddViewers}
              title={!subscriptionInfo?.canAddMoreMembers ? "You can still add Viewers even if your team member limit is reached" : ""}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>Invite a new team member to your organization.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input 
                  id="email" 
                  placeholder="member@example.com" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                <Select 
                  value={newUserRole} 
                  onValueChange={setNewUserRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem 
                        key={role.value} 
                        value={role.value}
                        disabled={role.value !== "viewer" && !subscriptionInfo?.canAddMoreMembers}
                      >
                        <div className="flex flex-col">
                          <span>{role.label}</span>
                          <span className="text-xs text-muted-foreground">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input 
                  id="title" 
                  placeholder="e.g., Treasurer, Accountant" 
                  value={newUserTitle}
                  onChange={(e) => setNewUserTitle(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {exampleTitles.map((title) => (
                    <Badge 
                      key={title} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setNewUserTitle(title)}
                    >
                      {title}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700" 
                onClick={handleInviteSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardHeader>

      <div className="space-y-6">
        {/* Subscription info card */}
        {subscriptionInfo && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Team Subscription</CardTitle>
              <CardDescription>
                Your organization&apos;s team subscription information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <p className="capitalize">{subscriptionInfo.currentTier}</p>
                </div>
                <div>
                  <p className="font-medium">Team Members (Admin/Member)</p>
                  <p>
                    {subscriptionInfo.currentTeamSize} of {subscriptionInfo.maxTeamSize} used
                    {subscriptionInfo.viewerCount > 0 && (
                      <span className="text-muted-foreground ml-1">
                        + {subscriptionInfo.viewerCount} viewer{subscriptionInfo.viewerCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Viewers don&apos;t count towards your quota</p>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  <div className="flex flex-col gap-1 mt-1">
                    {subscriptionInfo.canAddMoreMembers ? (
                      <Badge className="inline-flex w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Team slots available
                      </Badge>
                    ) : (
                      <Badge className="inline-flex w-fit bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Team limit reached
                      </Badge>
                    )}
                    <Badge className="inline-flex w-fit bg-sky-100 text-sky-700 hover:bg-sky-100">
                      Unlimited viewers
                    </Badge>
                  </div>
                </div>
              </div>
              {!subscriptionInfo.canAddMoreMembers && (
                <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-200 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p>
                      You&apos;ve reached the maximum number of team members (Admins/Members) for your {subscriptionInfo.currentTier} plan.
                      To add more team members, please upgrade your subscription.
                    </p>
                    <p className="mt-2 font-medium">
                      You can still add Viewers with read-only access which don&apos;t count towards your plan limit.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeamMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No team members found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeamMembers.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Popover
                        open={isRolePopoverOpen && selectedUserId === member._id}
                        onOpenChange={(open) => {
                          setIsRolePopoverOpen(open)
                          if (open) setSelectedUserId(member._id)
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="ghost" className="flex items-center justify-between font-normal">
                            <span className="capitalize">{member.role}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search role..." />
                            <CommandList>
                              <CommandEmpty>No role found.</CommandEmpty>
                              <CommandGroup>
                                {roles.map((role) => (
                                  <CommandItem
                                    key={role.value}
                                    onSelect={() => handleRoleUpdate(member._id, role.value)}
                                    disabled={role.value !== "viewer" && !subscriptionInfo?.canAddMoreMembers && member.role !== role.value}
                                    className="flex flex-col items-start"
                                  >
                                    <div className="flex items-center w-full">
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          role.value === member.role ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      <span>{role.label}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-6">{role.description}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Popover
                        open={isTitlePopoverOpen && selectedUserId === member._id}
                        onOpenChange={(open) => {
                          setIsTitlePopoverOpen(open)
                          if (open) setSelectedUserId(member._id)
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="ghost" className="flex items-center justify-between font-normal">
                            <span>{member.title || "No title"}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-4" align="start">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="custom-title">Custom Title</Label>
                              <Input 
                                id="custom-title" 
                                placeholder="e.g., Treasurer"
                                defaultValue={member.title || ""}
                                className="mt-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleTitleUpdate(member._id, (e.target as HTMLInputElement).value)
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <Label>Suggested Titles</Label>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {exampleTitles.map((title) => (
                                  <Badge 
                                    key={title} 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleTitleUpdate(member._id, title)}
                                  >
                                    {title}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTitleUpdate(member._id, "")}
                              >
                                Clear Title
                              </Button>
                              <Button 
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => setIsTitlePopoverOpen(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className={`h-2 w-2 rounded-full mr-2 ${
                            member.status === "Active" ? "bg-emerald-500" : 
                            member.status === "Invited" ? "bg-amber-500" : "bg-gray-500"
                          }`}
                        />
                        {member.status || (member.active ? "Active" : "Inactive")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="mr-2 h-3 w-3" />
                        {formatLastActive(member.lastLogin)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {member.status === "Invited" && (
                            <DropdownMenuItem onClick={() => {}}>
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Invitation
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleRemoveUser(member._id)}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardShell>
  )
}