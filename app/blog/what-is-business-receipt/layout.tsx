import { Metadata } from "next";
import { createBlogMeta } from "@/lib/meta-utils";

export const metadata: Metadata = createBlogMeta({
  title: "What is a Business Receipt? A Complete Guide",
  description: "Understanding the essentials of business receipts, their legal importance, and how digital technologies are transforming receipt management for modern businesses.",
  keywords: ["business receipt", "receipt definition", "types of receipts", "legal requirements", "digital receipts", "tax documentation"],
  ogImageUrl: "/blog/business-receipt.jpg",
  canonicalUrl: "https://digitalreceiptpro.com/blog/what-is-business-receipt",
  publishDate: "2025-05-12T10:00:00Z",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}