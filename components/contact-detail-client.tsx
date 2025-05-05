"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Mail, Phone, UserPlus } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { formatDate } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ContactDetailClientProps {
  contactId: string
}

export function ContactDetailClient({ contactId }: ContactDetailClientProps) {
  const router = useRouter()
  
  // Skip the query for the 'new' path to avoid the error
  // This should never happen with our new routing, but keeping as a safeguard
  const skipQuery = contactId === 'new';
  
  // Get contact details
  const contact = useQuery(
    api.contacts.getContact, 
    skipQuery ? "skip" : { contactId: contactId as Id<"contacts"> }
  )
  
  // Get receipts for this contact
  const receiptsData = useQuery(
    api.receipts.listReceipts, 
    skipQuery ? "skip" : { contactId: contactId as Id<"contacts">, limit: 5 }
  )
  
  const receipts = receiptsData?.receipts || []
  
  // Get organization settings for currency
  const orgSettings = useQuery(api.settings.getOrganizationSettings)
  const currencySymbol = orgSettings?.currencySettings?.symbol || "$"
  
  // If we somehow got to this page with a 'new' ID, redirect to the new contact page
  if (skipQuery) {
    router.push('/contacts/new');
    return null;
  }
  
  // Loading state
  if (!contact) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Loading Contact..."
          text="Please wait while we load the contact details."
        >
          <Link href="/contacts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contacts
            </Button>
          </Link>
        </DashboardHeader>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-[400px] animate-pulse bg-muted rounded-md"></div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={contact.name}
        text={`Contact details for ${contact.name}`}
      >
        <div className="flex gap-2">
          <Link href="/contacts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contacts
            </Button>
          </Link>
          <Link href={`/contacts/${contactId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href="/receipts/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="mr-2 h-4 w-4" />
              New Receipt
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.contactType.name}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{contact.email}</span>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{contact.phone}</span>
                </div>
              )}
              
              {contact.address && (
                <div className="flex">
                  <span className="mr-2">📍</span>
                  <span>{contact.address}</span>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Contributions</p>
              <p className="text-2xl font-bold">{currencySymbol}{contact.totalContributions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              {contact.lastReceiptDate && (
                <p className="text-xs text-muted-foreground">
                  Last receipt: {formatDate(contact.lastReceiptDate)}
                </p>
              )}
            </div>
            
            {contact.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{contact.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Receipts</CardTitle>
            <Link href="/receipts/new">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="mr-2 h-3 w-3" />
                New Receipt
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {receipts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No receipts found for this contact</p>
                <Link href="/receipts/new">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    Create First Receipt
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt._id}>
                      <TableCell>
                        <Link href={`/receipts/${receipt._id}`} className="hover:underline">
                          {receipt.receiptId}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(receipt.date)}</TableCell>
                      <TableCell>
                        {receipt.currency || currencySymbol}
                        {receipt.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full ${
                            receipt.status === "draft" 
                              ? "bg-amber-500" 
                              : receipt.status === "sent" 
                                ? "bg-emerald-500" 
                                : receipt.status === "viewed" 
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                          } mr-2`} />
                          <span className="capitalize">{receipt.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}