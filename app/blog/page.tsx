"use client";

import Link from "next/link";
import Image from "next/image";

import { BlogHeader } from "@/components/blog-header";
import { BlogFooter } from "@/components/blog-footer";

export default function BlogPage() {
  
  const blogPosts = [
    {
      id: "what-is-business-receipt",
      title: "What is a Business Receipt? A Complete Guide",
      excerpt: "Understanding the essentials of business receipts, their legal importance, and how digital technologies are transforming receipt management for modern businesses.",
      date: "May 12, 2025",
      readTime: "4 min read",
      image: "/blog/business-receipt.jpg",
      category: "Fundamentals"
    },
    {
      id: "paperless-receipts-guide",
      title: "The Complete Guide to Going Paperless with Digital Receipts",
      excerpt: "Learn how to eliminate paper receipts, streamline your business operations, and contribute to a greener planet with our comprehensive guide.",
      date: "May 8, 2025",
      readTime: "6 min read",
      image: "/blog/paperless-guide.jpg",
      category: "Guides"
    },
    {
      id: "analytics-business-insights",
      title: "5 Hidden Business Insights You Can Extract From Your Receipts",
      excerpt: "Discover how receipt data analytics can uncover spending patterns, tax deductions, and business opportunities you might be missing.",
      date: "May 5, 2025",
      readTime: "4 min read",
      image: "/blog/analytics-insights.jpg",
      category: "Analytics"
    },
    {
      id: "small-business-receipt-management",
      title: "Receipt Management Best Practices for Small Businesses",
      excerpt: "Implement these simple strategies to organize your receipts, streamline tax preparation, and maintain audit-ready records year-round.",
      date: "April 30, 2025",
      readTime: "5 min read",
      image: "/blog/small-business.jpg",
      category: "Small Business"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <BlogHeader />
      <main className="flex-1">
        <section className="py-12 md:py-16 bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-emerald-950/30 dark:to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjEiIGZpbGw9IiMxMGI5ODEiIGZpbGwtb3BhY2l0eT0iMC4zIi8+PC9zdmc+')] opacity-90"></div>
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 relative z-10">
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-emerald-950 dark:text-emerald-50">
                Receipts Reimagined
              </h1>
              <p className="max-w-3xl text-lg text-emerald-800 dark:text-emerald-200">
                Expert tips, guides and insights to help you manage receipts better,
                go paperless, and gain business intelligence from your transactions.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`}>
                  <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden h-full hover:shadow-md transition-shadow">
                    <div className="relative w-full h-48 overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-500">{post.date} • {post.readTime}</span>
                      </div>
                      <h2 className="text-xl font-bold mb-2 hover:text-emerald-600 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-gray-500 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <span className="text-emerald-600 font-medium hover:underline">
                        Read more →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <BlogFooter />
    </div>
  );
}