"use client"

import { FileText } from "lucide-react"

interface ReceiptTemplatePreviewProps {
  template: string
}

export function ReceiptTemplatePreview({ template }: ReceiptTemplatePreviewProps) {
  // Mock receipt data for preview
  const receipt = {
    receiptNumber: "REC-2024-0042",
    date: "2024-05-04",
    contributor: {
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      phone: "+91 98765 43210",
      address: "123 Main St, Mumbai, Maharashtra",
    },
    items: [
      { category: "National Fund", amount: 1000 },
      { category: "Continental Fund", amount: 2000 },
    ],
    total: 3000,
    status: "Active",
    notes: "Monthly contribution",
  }

  // Modern template
  if (template === "modern") {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6 max-w-full overflow-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-bold">ReceiptPro</span>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-emerald-600">RECEIPT</h2>
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
            <p className="font-medium">{receipt.contributor.name}</p>
            <p className="text-sm">{receipt.contributor.email}</p>
            <p className="text-sm">{receipt.contributor.phone}</p>
            <p className="text-sm text-muted-foreground">{receipt.contributor.address}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Donation Details</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Fund Category</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {receipt.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2 text-right">₹{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-medium">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">₹{receipt.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-center mb-1">Thank you for your contribution!</p>
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

  // Classic template
  if (template === "classic") {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6 max-w-full overflow-auto">
        <div className="text-center mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold mb-1">Acme Organization</h1>
          <p className="text-sm text-muted-foreground">123 Main Street, Mumbai, Maharashtra, India</p>
          <p className="text-sm text-muted-foreground">contact@acme.org | +91 98765 43210</p>
          <h2 className="text-lg font-bold mt-4">RECEIPT</h2>
          <p className="text-sm">
            {receipt.receiptNumber} | {receipt.date}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2 pb-1 border-b">Contributor Information</h3>
          <p className="font-medium">{receipt.contributor.name}</p>
          <p className="text-sm">{receipt.contributor.email}</p>
          <p className="text-sm">{receipt.contributor.phone}</p>
          <p className="text-sm text-muted-foreground">{receipt.contributor.address}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2 pb-1 border-b">Fund Contributions</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 text-left font-medium">Fund Category</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receipt.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-2">{item.category}</td>
                  <td className="py-2 text-right">₹{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">₹{receipt.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t text-center">
          <div className="mb-2 h-12 border-b border-dashed border-slate-300 w-32 mx-auto"></div>
          <p className="text-sm font-medium">John Doe</p>
          <p className="text-xs text-muted-foreground mb-4">Treasurer</p>
          <p className="text-sm">Thank you for your contribution!</p>
        </div>
      </div>
    )
  }

  // Minimal template
  if (template === "minimal") {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6 max-w-full overflow-auto">
        <div className="text-center mb-8">
          <FileText className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
          <h1 className="text-xl font-bold">Receipt of Contribution</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {receipt.receiptNumber} | {receipt.date}
          </p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <div className="flex justify-between mb-4 pb-2 border-b">
            <span className="text-sm text-muted-foreground">Contributor:</span>
            <span className="text-sm font-medium text-right">{receipt.contributor.name}</span>
          </div>

          {receipt.items.map((item, index) => (
            <div key={index} className="flex justify-between mb-2">
              <span className="text-sm">{item.category}:</span>
              <span className="text-sm">₹{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}

          <div className="flex justify-between mt-4 pt-2 border-t font-medium">
            <span>Total:</span>
            <span>₹{receipt.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="text-center mt-8 pt-6 border-t max-w-xs mx-auto">
          <div className="mb-2 h-12 border-b border-dashed border-slate-300 w-32 mx-auto"></div>
          <p className="text-sm font-medium">John Doe, Treasurer</p>
          <p className="text-sm text-muted-foreground mt-4">Acme Organization</p>
          <p className="text-xs text-muted-foreground mt-6">Thank you for your contribution!</p>
        </div>
      </div>
    )
  }

  return null
}
