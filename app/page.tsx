import Link from "next/link"
import { ArrowRight, CheckCircle, FileText, Settings, Users } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold">ReceiptPro</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-emerald-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-emerald-600 transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-emerald-600 transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Modern Receipt Management for <span className="text-emerald-600">Organizations</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg md:text-xl text-muted-foreground">
              Streamline your contribution receipts with our digital solution. Create, customize, and send professional
              receipts in seconds.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
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
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <FileText className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Customizable Receipts</h3>
                <p className="text-muted-foreground">
                  Create professional receipts with your organization's branding, custom receipt IDs, and multiple fund
                  categories.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <Users className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Team Collaboration</h3>
                <p className="text-muted-foreground">
                  Add team members with different roles to manage receipts, funds, and settings based on permissions.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <Settings className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Advanced Management</h3>
                <p className="text-muted-foreground">
                  Search, filter, and organize receipts. Preview PDFs before sending via email or WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold">1</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Sign Up</h3>
                <p className="text-muted-foreground">Create an account for your organization</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold">2</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Customize</h3>
                <p className="text-muted-foreground">Set up your organization details and receipt templates</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold">3</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Create Receipts</h3>
                <p className="text-muted-foreground">Generate detailed receipts for contributions</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold">4</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Share</h3>
                <p className="text-muted-foreground">Send receipts via email or WhatsApp</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 bg-slate-50 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-3xl font-bold mb-4">
                  $29<span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Up to 100 receipts/month</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>2 team members</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Basic receipt templates</span>
                  </li>
                </ul>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-lg shadow-sm border-2 border-emerald-600 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <p className="text-3xl font-bold mb-4">
                  $59<span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span>Up to 500 receipts/month</span>
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
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
              </div>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-3xl font-bold mb-4">
                  $99<span className="text-base font-normal text-muted-foreground">/month</span>
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
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Contact Sales</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-10">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <FileText className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold">ReceiptPro</span>
          </div>
          <div className="text-center md:text-right text-sm text-muted-foreground">
            <p>© 2024 ReceiptPro. All rights reserved.</p>
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
  )
}
