"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Mail, Printer, Share2, Trash2 } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { formatDate } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { DashboardHeader } from "@/components/dashboard-header"

interface ReceiptDetailClientProps {
  receiptId: string | Id<"receipts">
}

export function ReceiptDetailClient({ receiptId }: ReceiptDetailClientProps) {
  const router = useRouter()
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false)
  const [isVoiding, setIsVoiding] = useState(false)

  // Get receipt data from Convex
  const receiptData = useQuery(api.receipts.getReceipt, { 
    receiptId: receiptId as Id<"receipts"> 
  })

  // Get organization settings for currency
  const orgSettings = useQuery(api.settings.getOrganizationSettings)
  
  // Default currency symbol and code
  const currencySymbol = orgSettings?.currencySettings?.symbol || "$"

  // Handle loading state
  if (!receiptData) {
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
              <CardContent className="p-6">
                <div className="h-[400px] animate-pulse bg-muted rounded-md"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  const { receipt, items } = receiptData

  // Check if receipt has tax information
  const hasTaxInfo = 'taxAmount' in receipt && 
                    typeof receipt.taxAmount === 'number' && 
                    'taxPercentage' in receipt && 
                    typeof receipt.taxPercentage === 'number' && 
                    'taxName' in receipt && 
                    typeof receipt.taxName === 'string';

  // Create formatted receipt object
  const formattedReceipt = {
    receiptNumber: receipt.receiptId,
    receiptType: receipt.receiptType.name,
    date: formatDate(receipt.date),
    recipient: {
      name: receipt.recipientName,
      email: receipt.recipientEmail || "",
      phone: receipt.recipientPhone || "",
      address: "", // Add address field to schema if needed
    },
    items: items.map(item => ({
      category: item.itemCategory.name,
      name: item.name || "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
    total: receipt.totalAmount,
    status: receipt.status,
    notes: receipt.notes || "",
    // Add sales tax information only if available and for sales receipts
    ...(receipt.receiptType.name === "Sales" && hasTaxInfo && {
      subtotal: receipt.totalAmount - (typeof receipt.taxAmount === 'number' ? receipt.taxAmount : 0),
      tax: {
        amount: receipt.taxAmount as number,
        percentage: receipt.taxPercentage as number,
        name: receipt.taxName as string
      }
    })
  }

  const handleVoidReceipt = () => {
    setIsVoiding(true)

    // In a real app, you would call a mutation here
    // For example: useMutation(api.receipts.voidReceipt)
    setTimeout(() => {
      setIsVoiding(false)
      setIsVoidDialogOpen(false)
      router.push("/receipts")
    }, 1500)
  }

  return (
    <>
      <DashboardHeader
        heading={`Receipt #${formattedReceipt.receiptNumber}`}
        text="View receipt details and download or share the receipt."
      >
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/receipts" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto justify-center sm:justify-start">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Receipts</span>
            </Button>
          </Link>
          <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto justify-center sm:justify-start">
            <Mail className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-6 md:grid-cols-1">
        <div className="space-y-6">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle>Receipt Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Receipt Number</p>
                  <p className="text-sm sm:text-base truncate">{formattedReceipt.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Receipt Type</p>
                  <p className="text-sm sm:text-base">{formattedReceipt.receiptType}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-sm sm:text-base">{formattedReceipt.date}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Status</p>
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full ${
                      formattedReceipt.status === "draft"
                        ? "bg-amber-500"
                        : formattedReceipt.status === "sent"
                          ? "bg-emerald-500"
                          : formattedReceipt.status === "viewed"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                    } mr-2`} />
                    <p className="text-sm sm:text-base capitalize">{formattedReceipt.status}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-sm sm:text-base font-bold">{receipt.currency || currencySymbol} {formattedReceipt.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Recipient Information</p>
                <p className="font-medium text-sm sm:text-base">{formattedReceipt.recipient.name}</p>
                <p className="text-sm sm:text-base">{formattedReceipt.recipient.email}</p>
                {formattedReceipt.recipient.phone && (
                  <p className="text-sm sm:text-base">{formattedReceipt.recipient.phone}</p>
                )}
                {formattedReceipt.recipient.address && (
                  <p className="text-xs sm:text-sm text-muted-foreground">{formattedReceipt.recipient.address}</p>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                  {formattedReceipt.receiptType === "Donation"
                    ? "Categories"
                    : formattedReceipt.receiptType === "Sales"
                      ? "Items"
                      : "Services"}
                </p>
                <div className="space-y-2">
                  {formattedReceipt.receiptType === "Sales" ? (
                    // Display sales receipt items with quantity and unit price
                    <div>
                      {/* Desktop view for sales items */}
                      <div className="hidden sm:grid sm:grid-cols-4 gap-2 mb-2 text-xs text-muted-foreground">
                        <p>Item</p>
                        <p className="text-right">Qty</p>
                        <p className="text-right">Unit Price</p>
                        <p className="text-right">Amount</p>
                      </div>
                      <div className="sm:hidden mb-2 text-xs font-medium text-muted-foreground">Items</div>

                      {formattedReceipt.items.map((item, index) => (
                        <div key={index}>
                          {/* Desktop view - grid layout */}
                          <div className="hidden sm:grid sm:grid-cols-4 gap-2 text-sm">
                            <p>{item.name || item.category}</p>
                            <p className="text-right">{item.quantity || 1}</p>
                            <p className="text-right">{receipt.currency || currencySymbol} {item.unitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || (item.amount / (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-right">{receipt.currency || currencySymbol} {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>

                          {/* Mobile view - card layout */}
                          <div className="sm:hidden border rounded-md p-2 mb-2 text-sm">
                            <div className="flex justify-between">
                              <p className="font-medium">{item.name || item.category}</p>
                              <p className="font-medium">{receipt.currency || currencySymbol} {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <p>Qty: {item.quantity || 1}</p>
                              <p>Unit: {receipt.currency || currencySymbol} {item.unitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || (item.amount / (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Display donation or service receipt items
                    formattedReceipt.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm sm:text-base">
                        <p>{item.name || item.category}</p>
                        <p>{receipt.currency || currencySymbol} {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    ))
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-sm sm:text-base">
                    <p>Total</p>
                    <p>{receipt.currency || currencySymbol} {formattedReceipt.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              {formattedReceipt.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Notes</p>
                    <p className="text-xs sm:text-sm">{formattedReceipt.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto sm:justify-start">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto sm:justify-start">
              <Printer className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto sm:justify-start">
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto sm:justify-start text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Void Receipt</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Void Receipt</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to void this receipt? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsVoidDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleVoidReceipt} disabled={isVoiding}>
                    {isVoiding ? "Voiding..." : "Void Receipt"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  )
}