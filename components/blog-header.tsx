import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function BlogHeader() {
  const { isSignedIn } = useAuth();
  
  return (
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
            className="text-sm font-medium hover:text-emerald-600 transition-colors"
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
  );
}