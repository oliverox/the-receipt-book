import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { Separator } from "@/components/ui/separator"

export default function Loading() {
  return (
    <>
      <DashboardHeader heading="Create New Receipt" text="Generate a new receipt for contributions received.">
        <div className="flex gap-2">
          <Link href="/receipts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <div className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
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

              <Separator className="my-4" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-40 animate-pulse bg-muted rounded-md"></div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 animate-pulse bg-muted rounded-md"></div>
                      <div className="h-10 w-full animate-pulse bg-muted rounded-md"></div>
                    </div>
                    <div className="w-1/3 space-y-2">
                      <div className="h-4 w-32 animate-pulse bg-muted rounded-md"></div>
                      <div className="h-10 w-full animate-pulse bg-muted rounded-md"></div>
                    </div>
                    <div className="h-10 w-10 animate-pulse bg-muted rounded-md"></div>
                  </div>

                  <div className="h-10 w-40 animate-pulse bg-muted rounded-md mt-2"></div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <div className="h-6 w-32 animate-pulse bg-muted rounded-md"></div>
                <div className="h-8 w-20 animate-pulse bg-muted rounded-md"></div>
              </div>

              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse bg-muted rounded-md"></div>
                <div className="h-10 w-full animate-pulse bg-muted rounded-md"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <div className="h-10 w-20 animate-pulse bg-muted rounded-md"></div>
          <div className="h-10 w-32 animate-pulse bg-muted rounded-md"></div>
        </div>
      </div>
    </>
  )
}