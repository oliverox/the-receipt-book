import { ReceiptDetailClient } from "@/components/receipt-detail-client"

export default function ReceiptDetailPage({ params }: { params: { id: string } }) {
  return <ReceiptDetailClient receiptId={params.id} />
}