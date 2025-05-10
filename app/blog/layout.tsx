import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Receipt Reimagined | Digital Receipt Pro Blog",
  description: "Expert tips, guides and insights to help you manage receipts better, go paperless, and gain business intelligence from your transactions.",
  keywords: ["receipt management", "digital receipts", "business receipts", "paperless", "business intelligence", "expense tracking"],
  openGraph: {
    title: "Receipt Reimagined | Digital Receipt Pro Blog",
    description: "Expert tips, guides and insights to help you manage receipts better, go paperless, and gain business intelligence from your transactions.",
    url: "https://digitalreceiptpro.com/blog",
    siteName: "Digital Receipt Pro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Receipt Reimagined | Digital Receipt Pro Blog",
    description: "Expert tips, guides and insights to help you manage receipts better, go paperless, and gain business intelligence from your transactions.",
  },
  alternates: {
    canonical: "https://digitalreceiptpro.com/blog",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}