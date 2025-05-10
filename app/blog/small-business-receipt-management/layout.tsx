import { Metadata } from "next";
import { createBlogMeta } from "@/lib/meta-utils";

export const metadata: Metadata = createBlogMeta({
  title: "Receipt Management Best Practices for Small Businesses",
  description: "Implement these simple strategies to organize your receipts, streamline tax preparation, and maintain audit-ready records year-round.",
  keywords: ["small business", "receipt management", "business receipts", "tax preparation", "expense tracking", "audit preparation", "digital receipts"],
  ogImageUrl: "/blog/small-business.jpg",
  canonicalUrl: "https://digitalreceiptpro.com/blog/small-business-receipt-management",
  publishDate: "2025-04-30T10:00:00Z",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}