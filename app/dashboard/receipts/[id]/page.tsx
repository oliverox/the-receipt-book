import { ReceiptDetailClient } from "@/components/receipt-detail-client"

export default async function ReceiptDetailPage({ params }: { params: { id: string } }) {
  return <ReceiptDetailClient receiptId={params.id} />
}