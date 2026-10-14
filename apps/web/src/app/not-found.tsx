import Link from "next/link";

// Fallback for URLs outside any locale (the proxy normally adds one).
export default function GlobalNotFound() {
  return (
      <div style={{ fontFamily: "Georgia, serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Page not found</h1>
        <p>
          <Link href="/">Go home</Link>
        </p>
      </div>
  );
}
