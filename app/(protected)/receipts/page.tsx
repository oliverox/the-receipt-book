import Link from "next/link"
import { CalendarDays, Download, Filter, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardHeader } from "@/components/dashboard-header"
import { ReceiptsClient } from "@/components/receipts-client"

export default function ReceiptsPage() {
  return (
    <>
      <DashboardHeader heading="Receipts" text="View and manage all your organization's receipts.">
        <Link href="/receipts/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            New Receipt
          </Button>
        </Link>
      </DashboardHeader>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mb-4">
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search receipts..." className="pl-8 w-full" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none justify-center">
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none justify-center">
              <CalendarDays className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Date Range</span>
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto mt-2 sm:mt-0 justify-center">
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
      <ReceiptsClient />
    </>
  )
}