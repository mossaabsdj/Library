import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <h1 className="text-4xl font-black mb-2">404</h1>
      <p className="text-muted-foreground mb-4">
        Page non trouvée / Page Not Found
      </p>
      <Link
        href="/pos"
        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
      >
        Retour à la caisse (POS)
      </Link>
    </div>
  );
}
