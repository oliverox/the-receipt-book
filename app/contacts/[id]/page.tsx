import { ContactDetailClient } from "@/components/contact-detail-client"

export default async function ContactDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <ContactDetailClient contactId={params.id} />
}