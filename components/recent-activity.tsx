"use client"

import { FileText, Mail, UserPlus, Settings, LayoutTemplate, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

// Helper function to format timestamps relatively
const formatTimestamp = (timestamp: number) => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return "recently"
  }
}

// Helper function to get icon by action type
const getIconForAction = (action: string) => {
  switch (action) {
    case "create_receipt":
      return <FileText className="h-4 w-4 text-emerald-600" />
    case "send_receipt":
      return <Mail className="h-4 w-4 text-blue-600" />
    case "invite_user":
    case "update_user_role":
      return <UserPlus className="h-4 w-4 text-purple-600" />
    case "update_settings":
    case "update_organization":
      return <Settings className="h-4 w-4 text-orange-600" />
    case "create_fund_category":
      return <LayoutTemplate className="h-4 w-4 text-indigo-600" />
    default:
      return <ArrowRight className="h-4 w-4 text-gray-600" />
  }
}

// Helper function to get user-friendly message for each action
const getActivityMessage = (activity: {
  action: string, 
  details?: string, 
  resourceDetails?: {
    receiptNumber?: string,
    name?: string
  }
}) => {
  const { action, details, resourceDetails } = activity
  
  switch (action) {
    case "create_receipt":
      return <>created receipt <span className="font-semibold">{resourceDetails?.receiptNumber || "receipt"}</span></>
    case "send_receipt":
      return <>sent receipt <span className="font-semibold">{resourceDetails?.receiptNumber || "receipt"}</span> by email</>
    case "invite_user":
      return <>invited <span className="font-semibold">{details?.split("with role")[0] || "a user"}</span> as a collaborator</>
    case "update_user_role":
      return <>updated user role to <span className="font-semibold">{details?.split("to ")[1] || "new role"}</span></>
    case "update_settings":
      return <>updated organization settings</>
    case "update_organization":
      return <>updated organization profile</>
    case "create_fund_category":
      return <>created fund category <span className="font-semibold">{resourceDetails?.name || "category"}</span></>
    default:
      return <>{action.replace(/_/g, " ")}</>
  }
}

export function RecentActivity() {
  // Get activity logs
  const recentActivity = useQuery(api.activity.getRecentActivity, { 
    limit: 10 
  })
  
  // Loading state
  if (recentActivity === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Recent actions performed by you and your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div className="flex items-start" key={i}>
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="ml-4 space-y-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Recent actions performed by you and your team.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div className="flex items-start" key={activity._id}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  {getIconForAction(activity.action)}
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">
                    {activity.user.name}{" "}
                    {getActivityMessage(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <Link href="/receipts/new">
                  <Button variant="outline" size="sm" className="mt-1">
                    Create your first receipt
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}