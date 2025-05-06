"use client"

import { FileText } from "lucide-react"
// We handle date formatting in the parent component

interface ReceiptProps {
  receipt: {
    receiptNumber: string
    receiptType: string
    date: string
    recipient: {
      name: string
      email: string
      phone: string
      address: string
    }
    items: Array<{
      category: string
      name?: string
      quantity?: number
      unitPrice?: number
      amount: number
    }>
    total: number
    subtotal?: number
    tax?: {
      amount: number
      percentage: number
      name: string
    }
    status: string
    notes?: string
  }
}

export function ReceiptPreview({ receipt }: ReceiptProps) {
  // Note: date formatting is handled by the parent component
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 max-w-full overflow-auto">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8 text-emerald-600" />
          <span className="text-xl font-bold">ReceiptPro</span>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-emerald-600">{receipt.receiptType.toUpperCase()} RECEIPT</h2>
          <p className="text-sm">{receipt.receiptNumber}</p>
          <p className="text-sm">{receipt.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">From</h3>
          <p className="font-medium">Acme Organization</p>
          <p className="text-sm">contact@acme.org</p>
          <p className="text-sm">+91 98765 43210</p>
          <p className="text-sm text-muted-foreground">123 Main Street, Mumbai, Maharashtra, India</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">To</h3>
          <p className="font-medium">{receipt.recipient.name}</p>
          <p className="text-sm">{receipt.recipient.email}</p>
          <p className="text-sm">{receipt.recipient.phone}</p>
          <p className="text-sm text-muted-foreground">{receipt.recipient.address}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          {receipt.receiptType === "Donation" 
            ? "Donation Details" 
            : receipt.receiptType === "Sales" 
              ? "Items" 
              : "Services"}
        </h3>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {receipt.receiptType === "Sales" ? (
                  <>
                    <th className="px-4 py-2 text-left font-medium">Item</th>
                    <th className="px-4 py-2 text-center font-medium">Qty</th>
                    <th className="px-4 py-2 text-right font-medium">Unit Price</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2 text-left font-medium">Category</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {receipt.receiptType === "Sales" ? (
                // Sales receipt items display
                receipt.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{item.name || item.category}</td>
                    <td className="px-4 py-2 text-center">{item.quantity || 1}</td>
                    <td className="px-4 py-2 text-right">₹ {(item.unitPrice || (item.amount / (item.quantity || 1))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-right">₹ {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : (
                // Donation or service receipt items display
                receipt.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{item.name || item.category}</td>
                    <td className="px-4 py-2 text-right">₹ {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
              {receipt.receiptType === "Sales" && receipt.subtotal && receipt.tax ? (
                // Sales receipt with tax
                <>
                  <tr className="font-medium">
                    <td className="px-4 py-2" colSpan={3}>Subtotal</td>
                    <td className="px-4 py-2 text-right">₹ {receipt.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="font-medium">
                    <td className="px-4 py-2" colSpan={3}>{receipt.tax.name} ({receipt.tax.percentage}%)</td>
                    <td className="px-4 py-2 text-right">₹ {receipt.tax.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="bg-slate-50 font-medium">
                    <td className="px-4 py-2" colSpan={3}>Total</td>
                    <td className="px-4 py-2 text-right">₹ {receipt.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </>
              ) : (
                // Standard total row for non-sales receipts or sales without tax
                <tr className="bg-slate-50 font-medium">
                  <td className="px-4 py-2" colSpan={receipt.receiptType === "Sales" ? 3 : 1}>Total</td>
                  <td className="px-4 py-2 text-right">₹ {receipt.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {receipt.notes && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
          <p className="text-sm">{receipt.notes}</p>
        </div>
      )}

      <div className="mt-8 pt-6 border-t">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-center mb-1">
              {receipt.receiptType === "Donation" 
                ? "Thank you for your contribution!"
                : receipt.receiptType === "Sales"
                  ? "Thank you for your purchase!"
                  : "Thank you for your business!"}
            </p>
            <p className="text-xs text-muted-foreground">
              This is a computer-generated receipt and does not require a physical signature.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-2 h-12 border-b border-dashed border-slate-300 w-32"></div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">Treasurer</p>
          </div>
        </div>
      </div>
    </div>
  )
}
