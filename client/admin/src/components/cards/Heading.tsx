import type { ReactNode } from "react";

interface HeadingProps {
  icon: ReactNode;
  name: string;
  info: string;
  action?: ReactNode | null;
  message?: string;
  messageType?: "error" | "success";
}

export default function Heading({
  icon,
  name,
  info,
  action,
  message,
  messageType = "success",
}: HeadingProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        {icon}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            {info}
          </p>
          <h1 className="mt-1 wrap-break-word text-2xl font-semibold text-slate-950">
            {name}
          </h1>
          {message && (
            <p
              role={messageType === "error" ? "alert" : undefined}
              aria-live={messageType === "success" ? "polite" : undefined}
              className={`mt-2 text-sm ${
                messageType === "error" ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
      {action}
    </header>
  );
}
