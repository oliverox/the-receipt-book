import { Metadata } from "next";
import { createBlogMeta } from "@/lib/meta-utils";

export const metadata: Metadata = createBlogMeta({
  title: "5 Hidden Business Insights You Can Extract From Your Receipts",
  description: "Discover how receipt data analytics can uncover spending patterns, tax deductions, and business opportunities you might be missing.",
  keywords: ["business analytics", "receipt data", "financial insights", "expense analysis", "business intelligence", "data-driven decisions", "spending patterns"],
  ogImageUrl: "/blog/analytics-insights.jpg",
  canonicalUrl: "https://digitalreceiptpro.com/blog/analytics-business-insights",
  publishDate: "2025-05-05T10:00:00Z",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}