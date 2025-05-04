import Link from "next/link"
import { CalendarDays, Download, Filter, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Loading() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Receipts" text="View and manage all your organization's receipts.">
        <Link href="/dashboard/receipts/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            New Receipt
          </Button>
        </Link>
      </DashboardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search receipts..." className="pl-8" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <CalendarDays className="mr-2 h-4 w-4" />
            Date Range
          </Button>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-5 w-28 animate-pulse bg-muted rounded-md"></div>
                </TableCell>
                <TableCell><div className="h-5 w-24 animate-pulse bg-muted rounded-md"></div></TableCell>
                <TableCell><div className="h-5 w-32 animate-pulse bg-muted rounded-md"></div></TableCell>
                <TableCell><div className="h-5 w-20 animate-pulse bg-muted rounded-md"></div></TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-gray-300 mr-2" />
                    <div className="h-5 w-16 animate-pulse bg-muted rounded-md"></div>
                  </div>
                </TableCell>
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