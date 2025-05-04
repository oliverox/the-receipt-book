import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"

export default function Loading() {
  return (
    <DashboardShell>
      <DashboardHeader heading="New Contact" text="Create a new contact entry for your organization.">
        <Link href="/dashboard/contacts">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
      </DashboardHeader>

      <div className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse bg-muted rounded-md"></div>
                <div className="h-10 w-full animate-pulse bg-muted rounded-md"></div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse bg-muted rounded-md"></div>
                  <div className="h-10 w-full animate-pulse bg-muted rounded-md"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse bg-muted rounded-md"></div>
                  <div className="h-10 w-full animate-pulse bg-muted rounded-md"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse bg-muted rounded-md"></div>
                <div className="h-10 w-full animate-pulse bg-muted rounded-md"></div>
              </div>

              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse bg-muted rounded-md"></div>
                <div className="h-10 w-full animate-pulse bg-muted rounded-md"></div>
              </div>

              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse bg-muted rounded-md"></div>
                <div className="h-24 w-full animate-pulse bg-muted rounded-md"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <div className="h-10 w-20 animate-pulse bg-muted rounded-md"></div>
          <div className="h-10 w-32 animate-pulse bg-muted rounded-md"></div>
        </div>
      </div>
    </DashboardShell>
  )
}