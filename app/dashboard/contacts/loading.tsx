import Link from "next/link"
import { Filter, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Loading() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Contacts" text="Manage your contributor contacts.">
        <Link href="/dashboard/contacts/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </Link>
      </DashboardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." className="pl-8" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
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
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-5 w-28 animate-pulse bg-muted rounded-md"></div>
                </TableCell>
                <TableCell><div className="h-5 w-32 animate-pulse bg-muted rounded-md"></div></TableCell>
                <TableCell><div className="h-5 w-24 animate-pulse bg-muted rounded-md"></div></TableCell>
                <TableCell><div className="h-5 w-20 animate-pulse bg-muted rounded-md"></div></TableCell>
                <TableCell><div className="h-5 w-16 animate-pulse bg-muted rounded-md"></div></TableCell>
                <TableCell>
                  <div className="h-8 w-8 animate-pulse bg-muted rounded-full mx-auto"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardShell>
  )
}