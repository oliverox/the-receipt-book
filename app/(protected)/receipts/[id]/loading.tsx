import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"

export default function Loading() {
  return (
    <>
      <DashboardHeader
        heading="Loading Receipt..."
        text="Please wait while we load the receipt details."
      >
        <Link href="/receipts">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Receipts
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 animate-pulse bg-muted rounded-md"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-4 w-24 animate-pulse bg-muted rounded-md mb-2"></div>
                  <div className="h-5 w-20 animate-pulse bg-muted rounded-md"></div>
                </div>
                <div>
                  <div className="h-4 w-24 animate-pulse bg-muted rounded-md mb-2"></div>
                  <div className="h-5 w-20 animate-pulse bg-muted rounded-md"></div>
                </div>
                <div>
                  <div className="h-4 w-24 animate-pulse bg-muted rounded-md mb-2"></div>
                  <div className="h-5 w-20 animate-pulse bg-muted rounded-md"></div>
                </div>
                <div>
                  <div className="h-4 w-24 animate-pulse bg-muted rounded-md mb-2"></div>
                  <div className="h-5 w-20 animate-pulse bg-muted rounded-md"></div>
                </div>
              </div>
              <div className="h-px w-full bg-muted"></div>
              <div>
                <div className="h-4 w-40 animate-pulse bg-muted rounded-md mb-2"></div>
                <div className="h-5 w-32 animate-pulse bg-muted rounded-md mb-1"></div>
                <div className="h-4 w-48 animate-pulse bg-muted rounded-md mb-1"></div>
                <div className="h-4 w-36 animate-pulse bg-muted rounded-md"></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <div className="h-9 w-32 animate-pulse bg-muted rounded-md"></div>
            <div className="h-9 w-24 animate-pulse bg-muted rounded-md"></div>
            <div className="h-9 w-24 animate-pulse bg-muted rounded-md"></div>
            <div className="h-9 w-32 animate-pulse bg-muted rounded-md"></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 w-32 animate-pulse bg-muted rounded-md"></div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] animate-pulse bg-muted rounded-md"></div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}