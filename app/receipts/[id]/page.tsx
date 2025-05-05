import { ReceiptDetailClient } from "@/components/receipt-detail-client"

export default async function ReceiptDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <ReceiptDetailClient receiptId={params.id} />
}