import Link from "next/link";
import Image from "next/image";

export function BlogFooter() {
  return (
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
  );
}