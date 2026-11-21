import Link from "next/link";
import StatusPage from "@/components/StatusPage";

export default function NotFound() {
  return (
    <StatusPage
      title="This trail ends here"
      actions={
        <>
          <Link href="/" className="btn btn-primary btn-lg">
            Back to home
          </Link>
          <Link href="/dashboard" className="btn btn-secondary btn-lg">
            Go to your dashboard
          </Link>
        </>
      }
    >
      <p>
        We could not find that page. The link may have a typo, or the page may have moved. To check a credential, use
        the <Link href="/verify" className="underline underline-offset-4">credential check</Link>.
      </p>
    </StatusPage>
  );
}
