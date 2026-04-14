"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold text-red-400">Something went wrong</h2>
          <p className="max-w-md text-center text-sm text-neutral-400">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
