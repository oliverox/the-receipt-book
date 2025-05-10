import { Metadata } from "next";
import { createBlogMeta } from "@/lib/meta-utils";

export const metadata: Metadata = createBlogMeta({
  title: "The Complete Guide to Going Paperless with Digital Receipts",
  description: "Learn how to eliminate paper receipts, streamline your business operations, and contribute to a greener planet with our comprehensive guide.",
  keywords: ["paperless receipts", "digital receipts", "receipt management", "eco-friendly business", "paperless guide", "business efficiency"],
  ogImageUrl: "/blog/paperless-guide.jpg",
  canonicalUrl: "https://digitalreceiptpro.com/blog/paperless-receipts-guide",
  publishDate: "2025-05-08T10:00:00Z",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}