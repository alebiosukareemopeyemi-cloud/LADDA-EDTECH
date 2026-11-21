"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailOpen } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

const COOLDOWN = 60;

function VerifyEmail() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const supabase = useMemo(() => createClient(), []);

  const [seconds, setSeconds] = useState(COOLDOWN);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Resend cooldown
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  async function resend() {
    if (!email || seconds > 0 || sending) return;
    setSending(true);
    setMsg(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSending(false);
    if (error) {
      setMsg({ text: "We could not resend yet. Wait a minute, then select Resend email again.", ok: false });
      return;
    }
    setMsg({ text: "Sent again. Check your inbox and your spam folder.", ok: true });
    setSeconds(COOLDOWN);
  }

  return (
    <>
      <MailOpen className="mt-8 size-10 text-volt" aria-hidden="true" />
      <h1 className="display-md mt-4">Check your email</h1>
      <p className="mt-3 text-text-soft">
        We sent a link to <span className="font-semibold text-text">{email || "your email"}</span>. Select it to confirm your
        account, in this same browser.
      </p>

      <ul className="mt-5 space-y-2 border-y border-line py-4 text-sm text-text-soft">
        <li>It usually arrives within a minute or two.</li>
        <li>If you do not see it, check your spam or promotions folder.</li>
        <li>The link works once. If it fails, resend it below.</li>
      </ul>

      <div role="status" className="min-h-6">
        {msg && <p className={`mt-4 text-sm font-medium ${msg.ok ? "text-volt" : "text-ember"}`}>{msg.text}</p>}
      </div>

      <button
        type="button"
        onClick={resend}
        disabled={seconds > 0 || sending || !email}
        className="btn btn-primary btn-lg mt-4 w-full"
      >
        {sending ? "Sending" : seconds > 0 ? `Resend email in ${seconds}s` : "Resend email"}
      </button>

      {!email && (
        <p className="mt-3 text-sm font-medium text-ember">We do not have your email. Go back and enter it again.</p>
      )}

      <Link href="/auth" className="btn btn-secondary mt-3 w-full">
        Use a different email
      </Link>
      <Link href="/tour" className="btn btn-ghost mt-2 w-full">
        Watch the tour while you wait
      </Link>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
