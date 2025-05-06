"use client"

import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { formatDate } from "@/lib/utils"
import { Receipt } from "@/lib/definitions"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ReceiptListProps {
  receipts: Receipt[];
}

export function ReceiptList({ receipts = [] }: ReceiptListProps) {
  // Get organization settings for currency
  const orgSettings = useQuery(api.settings.getOrganizationSettings)
  
  // Default currency symbol
  const currencySymbol = orgSettings?.currencySettings?.symbol || "$"
  return (
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
          {receipts && receipts.map((receipt) => (
            <TableRow key={receipt._id}>
              <TableCell>
                <Link href={`/receipts/${receipt._id}`} className="font-medium hover:underline">
                  {receipt.receiptId}
                </Link>
              </TableCell>
              <TableCell>{formatDate(receipt.date)}</TableCell>
              <TableCell>{receipt.recipientName}</TableCell>
              <TableCell>{receipt.currency || currencySymbol} {receipt.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <Link href={`/receipts/${receipt._id}`}>
                      <DropdownMenuItem>View details</DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem>Download PDF</DropdownMenuItem>
                    <DropdownMenuItem>Send by email</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Void receipt</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
