"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ReceiptList } from "@/components/receipt-list"

export function ReceiptsClient() {
  // Get receipts from Convex
  const recentReceipts = useQuery(api.receipts.listReceipts, { 
    limit: 50
  })
  
  return (
    <ReceiptList receipts={recentReceipts?.receipts || []} />
  )
}