"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Settings,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { ParticlesBackground } from "@/components/particles-background";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Digital Receipt Pro Logo"
              width={486}
              height={569}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold">Digital Receipt Pro</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#business-impact"
              className="text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              Business Impact
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#latest-blog"
              className="text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              Latest Blog
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
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
        <section className="py-20 md:py-28 relative overflow-hidden min-h-[500px] flex items-center">
          <div className="absolute inset-0 z-0">
            <ParticlesBackground className="w-full h-full" />
          </div>
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex flex-col items-center text-center relative z-[2]">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="text-emerald-600">Digital Receipt Pro</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg md:text-xl text-gray-500">
              Digital receipts, real insights — Replace paper trails with digital insights that drive
              business decisions.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <FileText className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  Instant Digital Delivery
                </h3>
                <p className="text-muted-foreground">
                  Create and email professional digital receipts instantly with
                  a single click. Your customers receive beautifully formatted
                  receipts in seconds.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <Users className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  Professional Templates
                </h3>
                <p className="text-muted-foreground">
                  Comprehensive selection of business receipt templates with
                  automatic tax calculation, custom branding, and itemized
                  details.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <Settings className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Customer Management</h3>
                <p className="text-muted-foreground">
                  Track customer purchase history, manage business
                  relationships, and maintain complete records of all
                  transactions in one secure place.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border-2 border-emerald-600 relative">
                <span className="absolute top-2 right-2 text-xs text-amber-600 font-medium">Coming Soon</span>
                <svg
                  className="h-10 w-10 text-emerald-600 mb-4"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 21h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zM5 5h3.5v14H5V5zm5 0h3.5v14H10V5zm5 0h4v14h-4V5z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">AI-Powered Analytics</h3>
                <p className="text-muted-foreground">
                  Transform receipt data into actionable business intelligence. Visualize spending patterns,
                  predict future trends, and identify cost-saving opportunities with our
                  advanced analytics dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="business-impact" className="py-20 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-6">
              Real Business Impact
            </h2>
            <p className="text-center text-lg mb-12 max-w-3xl mx-auto">
              See how Digital Receipt Pro transforms your operations and delivers measurable ROI
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
                <h3 className="text-4xl font-bold text-emerald-600 mb-2">40%</h3>
                <p className="font-semibold mb-2">Time Saved</p>
                <p className="text-muted-foreground">Reduce manual receipt processing time by automating document management</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
                <h3 className="text-4xl font-bold text-emerald-600 mb-2">25%</h3>
                <p className="font-semibold mb-2">Cost Reduction</p>
                <p className="text-muted-foreground">Identify spending patterns and opportunities to reduce unnecessary expenses</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
                <h3 className="text-4xl font-bold text-emerald-600 mb-2">100%</h3>
                <p className="font-semibold mb-2">Audit Readiness</p>
                <p className="text-muted-foreground">Always have your receipt records organized, searchable and available for audits</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold">1</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Sign Up</h3>
                <p className="text-muted-foreground">
                  Create your business account in seconds
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold">2</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Customize</h3>
                <p className="text-muted-foreground">
                  Set up your business branding and receipt templates
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold">3</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Create Receipts</h3>
                <p className="text-muted-foreground">
                  Generate professional receipts for any transaction
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold">4</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Deliver Instantly</h3>
                <p className="text-muted-foreground">
                  Email digital receipts to customers with one click
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 bg-slate-50 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              Simple Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-3xl font-bold mb-4">
                  $29
                  <span className="text-base font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Up to 250 receipts/month</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>2 team members</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Standard receipt templates</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => window.location.href = isSignedIn ? '/dashboard' : '/sign-up'}
                >
                  {isSignedIn ? 'Go to Dashboard' : 'Get Started'}
                </Button>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-lg shadow-sm border-2 border-emerald-600 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <p className="text-3xl font-bold mb-4">
                  $59
                  <span className="text-base font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Up to 1,000 receipts/month</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>5 team members</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Advanced receipt templates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Email & WhatsApp integration</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => window.location.href = isSignedIn ? '/dashboard' : '/sign-up'}
                >
                  {isSignedIn ? 'Go to Dashboard' : 'Get Started'}
                </Button>
              </div>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-3xl font-bold mb-4">
                  $99
                  <span className="text-base font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Unlimited receipts</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Unlimited team members</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Custom receipt templates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => window.location.href = isSignedIn ? '/dashboard' : '/sign-up'}
                >
                  {isSignedIn ? 'Go to Dashboard' : 'Contact Sales'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="latest-blog" className="py-20">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-6">
              Latest Post
            </h2>
            <p className="text-center text-lg max-w-3xl mx-auto mb-12 text-gray-500">
              Explore expert tips, guides, and insights to help you manage receipts better
            </p>

            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md">
              <div className="md:flex">
                <div className="md:w-2/5 relative h-64 md:h-auto">
                  <Image
                    src="/blog/business-receipt.jpg"
                    alt="What is a Business Receipt? A Complete Guide"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-8 md:w-3/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                      Fundamentals
                    </span>
                    <span className="text-xs text-gray-500">May 12, 2025 • 4 min read</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    What is a Business Receipt? A Complete Guide
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Understanding the essentials of business receipts, their legal importance, and how digital technologies are transforming receipt management for modern businesses.
                  </p>
                  <Link href="/blog/what-is-business-receipt">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Read Article
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/blog">
                <Button variant="outline">
                  View All Articles
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-10">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Image
              src="/logo.png"
              alt="Digital Receipt Pro Logo"
              width={486}
              height={569}
              className="h-8 w-auto"
            />
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
