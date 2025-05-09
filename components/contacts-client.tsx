"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Plus, Search } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardHeader } from "@/components/dashboard-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ContactsClient() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<Id<"contactTypes"> | null>(null)
  
  // Get contact types for filter dropdown
  const contactTypes = useQuery(api.contacts.listContactTypes) || []
  
  // Get contacts with search and type filter if provided
  const contactsData = useQuery(api.contacts.listContacts, { 
    search: searchQuery.length > 1 ? searchQuery : undefined,
    contactTypeId: selectedType || undefined,
    limit: 50
  })
  
  // Get organization settings for currency
  const orgSettings = useQuery(api.settings.getOrganizationSettings)
  const currencySymbol = orgSettings?.currencySettings?.symbol || "$"
  
  const contacts = contactsData?.contacts || []
  
  // Format currency for display - now uses the currencySymbol from the component scope
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString()}`
  }

  return (
    <>
      <DashboardHeader heading="Contacts" text="Manage your contributor contacts.">
        <Link href="/contacts/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </Link>
      </DashboardHeader>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex flex-col sm:flex-row w-full gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedType?.toString() || 'all'}
            onValueChange={(value) => setSelectedType(value === 'all' ? null : value as Id<"contactTypes">)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {contactTypes.map(type => (
                <SelectItem key={type._id} value={type._id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {contacts.length === 0 ? (
        <div className="rounded-md border flex flex-col items-center justify-center h-64 p-4 text-center">
          <h3 className="text-lg font-medium mb-2">No contacts found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery.length > 0
              ? "Try a different search term or clear filters"
              : "Start by adding a contact or create one when creating a new receipt"}
          </p>
          <Link href="/contacts/new" className="w-full sm:w-auto">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add a Contact
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile view - Card layout */}
          <div className="md:hidden space-y-3">
            {contacts.map((contact) => (
              <div key={contact._id} className="rounded-md border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Link href={`/contacts/${contact._id}`} className="font-medium hover:underline truncate flex-1">
                    {contact.name}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <Link href={`/contacts/${contact._id}`}>
                        <DropdownMenuItem>View details</DropdownMenuItem>
                      </Link>
                      <Link href={`/contacts/${contact._id}/edit`}>
                        <DropdownMenuItem>Edit contact</DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>View receipts</DropdownMenuItem>
                      <DropdownMenuItem>Create receipt</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {contact.contactType.name}
                  </span>
                  <span className="font-medium text-sm">
                    {formatCurrency(contact.totalContributions || 0)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {contact.email && <div className="truncate">{contact.email}</div>}
                  {contact.phone && <div>{contact.phone}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view - Table layout */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total Contributions</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell>
                      <Link href={`/contacts/${contact._id}`} className="font-medium hover:underline">
                        {contact.name}
                      </Link>
                    </TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>{contact.phone || "-"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {contact.contactType.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(contact.totalContributions || 0)}
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
                          <Link href={`/contacts/${contact._id}`}>
                            <DropdownMenuItem>View details</DropdownMenuItem>
                          </Link>
                          <Link href={`/contacts/${contact._id}/edit`}>
                            <DropdownMenuItem>Edit contact</DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View receipts</DropdownMenuItem>
                          <DropdownMenuItem>Create receipt</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  )
}