"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

type Tab = "signup" | "signin";
type FieldName = "name" | "university" | "department" | "email" | "password";

const DEPARTMENTS = [
  "Computer Science",
  "Electrical and Electronics Engineering",
  "Computer Engineering",
  "Information Systems / Data Science",
];

const UNIVERSITIES = [
  "University of Lagos",
  "University of Ibadan",
  "Obafemi Awolowo University",
  "University of Nigeria, Nsukka",
  "Ahmadu Bello University",
  "University of Benin",
  "University of Ilorin",
  "Lagos State University",
  "Covenant University",
  "Babcock University",
  "Pan-Atlantic University",
  "Bells University of Technology",
  "Afe Babalola University",
  "Redeemer's University",
  "Nile University of Nigeria",
  "American University of Nigeria",
  "Federal University of Technology, Akure",
  "Federal University of Technology, Minna",
  "Federal University of Technology, Owerri",
];

// A confirmation link that expired or was already used sends people back here with ?error=link.
function LinkProblem() {
  const params = useSearchParams();
  if (params.get("error") !== "link") return null;
  return (
    <p role="alert" className="mt-5 border-l-2 border-ember pl-3 text-sm font-medium text-ember">
      That confirmation link has expired or was already used. If you already confirmed, sign in. If not, create your
      account again and we will send a new link.
    </p>
  );
}

function AuthForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<Tab>("signup");
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [uniOpen, setUniOpen] = useState(false);
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<{ message: string; field: FieldName | null } | null>(null);

  const suggestions = UNIVERSITIES.filter((u) => u.toLowerCase().includes(university.trim().toLowerCase())).slice(0, 5);

  function fail(message: string, field: FieldName | null = null) {
    setProblem({ message, field });
    setLoading(false);
  }
  const invalid = (f: FieldName) => problem?.field === f || undefined;

  function switchTab(next: Tab) {
    if (next === tab) return;
    setProblem(null);
    setTab(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setProblem(null);

    if (tab === "signup") {
      if (!name.trim()) return fail("Enter your name, for example Ada Obi.", "name");
      if (!university.trim()) return fail("Enter your university. Start typing and pick it from the list, or type its full name.", "university");
      if (!department) return fail("Choose your department from the list.", "department");
    }
    if (!email.trim()) return fail("Enter your email, for example you@school.edu.ng.", "email");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return fail("That email does not look right. Check it for typos, for example you@school.edu.ng.", "email");
    }
    if (password.length < 8) return fail("Use at least 8 characters for your password. A short phrase works well.", "password");

    setLoading(true);

    if (tab === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { display_name: name.trim(), university: university.trim(), department },
        },
      });
      if (err) return fail(`${err.message}. Check your details and try again.`);
      if (data.user && data.user.identities?.length === 0) {
        setTab("signin");
        return fail("That email already has an account. Sign in with your password instead.", "email");
      }
      router.push(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      if (err.message.toLowerCase().includes("not confirmed")) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      return fail("That email and password do not match. Check both, or create an account if you are new.", "password");
    }
    router.push("/roadmap");
    router.refresh();
  }

  return (
    <>
      <h1 className="display-md mt-6">{tab === "signup" ? "Create your account" : "Sign in"}</h1>
      <p className="mt-2 text-text-soft">Pick right. Learn real. Get hired.</p>

      <Suspense fallback={null}>
        <LinkProblem />
      </Suspense>

      <div role="group" aria-label="Sign up or sign in" className="mt-6 flex gap-2">
        {(["signup", "signin"] as Tab[]).map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={tab === t} onClick={() => switchTab(t)}>
            {t === "signup" ? "Sign up" : "Sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {tab === "signup" && (
          <>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                className="field"
                placeholder="Ada Obi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                aria-invalid={invalid("name")}
                aria-describedby={problem?.field === "name" ? "form-problem" : undefined}
              />
            </div>

            <div className="relative">
              <label htmlFor="university" className="mb-1.5 block text-sm font-medium">
                University
              </label>
              <input
                id="university"
                className="field"
                placeholder="Start typing, then pick yours"
                value={university}
                onChange={(e) => {
                  setUniversity(e.target.value);
                  setUniOpen(true);
                }}
                onFocus={() => setUniOpen(true)}
                onBlur={() => setTimeout(() => setUniOpen(false), 120)}
                onKeyDown={(e) => e.key === "Escape" && setUniOpen(false)}
                autoComplete="off"
                role="combobox"
                aria-expanded={uniOpen && suggestions.length > 0}
                aria-controls="uni-list"
                aria-autocomplete="list"
                aria-invalid={invalid("university")}
                aria-describedby={problem?.field === "university" ? "form-problem" : undefined}
              />
              {uniOpen && suggestions.length > 0 && (
                <ul id="uni-list" role="listbox" aria-label="Universities" className="surface-raised absolute inset-x-0 top-full z-20 mt-2 p-1">
                  {suggestions.map((u) => (
                    <li key={u} role="option" aria-selected={u === university}>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setUniversity(u);
                          setUniOpen(false);
                        }}
                        className="min-h-11 w-full rounded-full px-4 text-left hover:bg-line"
                      >
                        {u}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label htmlFor="department" className="mb-1.5 block text-sm font-medium">
                Department
              </label>
              <select
                id="department"
                className="field"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                aria-invalid={invalid("department")}
                aria-describedby={problem?.field === "department" ? "form-problem" : undefined}
              >
                <option value="">Choose one</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field"
            placeholder="you@school.edu.ng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={invalid("email")}
            aria-describedby={problem?.field === "email" ? "form-problem" : undefined}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              className="field pr-14"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
              aria-invalid={invalid("password")}
              aria-describedby={problem?.field === "password" ? "form-problem" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
              className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-text-soft hover:text-text"
            >
              {showPw ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {problem && (
          <p id="form-problem" role="alert" className="border-l-2 border-ember pl-3 text-sm font-medium text-ember">
            {problem.message}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading
            ? tab === "signup"
              ? "Creating your account"
              : "Signing you in"
            : tab === "signup"
              ? "Create my account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-text-mute">Email and password only. Employers verify without an account.</p>
      <Link href="/tour" className="btn btn-ghost mt-2 w-full">
        Watch the tour instead
      </Link>
    </>
  );
}

export default function AuthPage() {
  return (
    <AuthShell>
      <AuthForm />
    </AuthShell>
  );
}
