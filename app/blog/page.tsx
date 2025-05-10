"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export default function BlogPage() {
  const { isSignedIn } = useAuth();
  
  const blogPosts = [
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Digital Receipt Pro Logo"
                width={486}
                height={569}
                className="h-8 w-auto"
              />
            </Link>
            <span className="text-xl font-bold">Digital Receipt Pro</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/"
              className="text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-emerald-600 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="outline">Log In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-12 md:py-16 bg-slate-50 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Receipt Reimagined
              </h1>
              <p className="max-w-3xl text-lg text-gray-500">
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
      <footer className="border-t py-10">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Digital Receipt Pro Logo"
                width={486}
                height={569}
                className="h-8 w-auto"
              />
            </Link>
            <span className="text-xl font-bold">Digital Receipt Pro</span>
          </div>
          <div className="text-center md:text-right text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Digital Receipt Pro. All rights reserved.</p>
            <p className="mt-1">
              <Link href="#" className="hover:underline">
                Privacy Policy
              </Link>{" "}
              ·{" "}
              <Link href="#" className="hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}