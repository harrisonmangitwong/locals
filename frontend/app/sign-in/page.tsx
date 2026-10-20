import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function SignInPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 text-center"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="w-full max-w-sm flex flex-col items-center rise">
        <h1 className="font-display text-[46px] sm:text-[58px]">Locals</h1>
        <p className="text-[17px] leading-snug mt-3 max-w-[30ch] text-pretty" style={{ color: "var(--text-secondary)" }}>
          Most food apps give you endless recs. Locals tells you where to go tonight.
        </p>
        <GoogleSignInButton label="Continue with Google" className="w-full mt-8 text-[16px]" />
        <Link
          href="/"
          className="min-h-[44px] px-3 mt-2 rounded-full inline-flex items-center text-[15px] font-medium transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ color: "var(--text-secondary)" }}
        >
          Look around first
        </Link>
      </div>
    </main>
  );
}
