import { Database } from "lucide-react";
import { Link } from "react-router";
import BackButton from "../navigation/BackButton";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="w-full max-w-md text-center">
        <header className="border border-slate-200 bg-white px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold text-slate-500">404</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The page you’re looking for doesn’t exist or may have moved.
          </p>
        </header>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/repositories/new"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Database aria-hidden="true" className="h-4 w-4" />
            Go to repository
          </Link>
          <BackButton
            fallbackTo="/"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Go back
          </BackButton>
        </div>
      </section>
    </main>
  );
}
