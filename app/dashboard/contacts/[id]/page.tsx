import { ContactDetailClient } from "@/components/contact-detail-client"

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  return <ContactDetailClient contactId={params.id} />
}