import { Bell, ChevronDown, Search } from "lucide-react";

interface HeaderProps {
  user?: { email?: string; role?: string };
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
}

export default function Header({
  user = { email: "Admin", role: "Administrator" },
  searchPlaceholder = "Search...",
  onSearch,
}: HeaderProps) {
  const emailName = user.email?.split("@")[0] ?? "Admin";
  const avatarLetter = emailName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center gap-2  border-slate-200/90 bg-white shadow-sm ">
      {/* Search Input */}
      <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:inline-flex">
            ctrl + K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-1">
        <button
          className="relative rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="mx-2 h-6 w-px bg-slate-200" />

        {/* User Profile */}
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {avatarLetter}
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-sm font-semibold leading-none text-slate-900">
              {emailName}
            </p>
            <p className="mt-0.5 text-xs capitalize text-slate-500">
              {(user.role || "user").replace("_", " ")}
            </p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
        </div>
      </div>
    </header>
  );
}
