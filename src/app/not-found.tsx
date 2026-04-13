import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600">404</h1>
        <p className="mt-4 text-lg text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
