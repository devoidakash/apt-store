import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { ChevronDown, LogOut, type LucideIcon } from "lucide-react";

interface SidebarLink {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  children?: SidebarLink[];
}

interface SidebarProps {
  links?: SidebarLink[];
  onLogout?: () => void;
}

export default function Sidebar({ links = [], onLogout }: SidebarProps) {
  const location = useLocation();

  return (
    <nav className="relative z-40 flex h-full w-60 shrink-0 flex-col border-r border-slate-200/90 bg-white shadow-sm">
      {/* Brand Logo */}
      <div className="flex h-14 items-center border-b border-slate-200/80 px-6">
        <img
          src="/apt-store.png"
          alt="APT Store"
          className="h-7 w-7 object-contain"
        />
        <span className="ml-3 text-xl font-bold tracking-tight text-slate-800">
          APT Store
        </span>
      </div>

      {/* Navigation */}
      <div className="custom-scrollbar flex-1 overflow-y-auto py-6">
        <div className="mb-4 px-6">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Navigation
          </span>
        </div>

        <ul className="space-y-1.5 px-4">
          {links.map((link) => (
            <NavItem
              key={link.to}
              link={link}
              currentPath={location.pathname}
              currentSearch={location.search}
            />
          ))}
        </ul>
      </div>

      {/* Logout */}
      {onLogout && (
        <div className="border-t border-slate-200/80 bg-slate-50/60 p-4">
          <button
            onClick={onLogout}
            aria-label="Logout"
            className="group flex min-h-11 w-full items-center rounded-xl px-4 text-rose-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span className="ml-3 text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
}

function NavItem({
  link,
  currentPath,
  currentSearch,
}: {
  link: SidebarLink;
  currentPath: string;
  currentSearch: string;
}) {
  const children = link.children ?? [];
  const hasChildren = children.length > 0;
  const [isExpanded, setIsExpanded] = useState<boolean | null>(null);
  const MainIcon = link.icon;

  const isRouteMatch = (to: string, end = true) => {
    const url = new URL(to, "http://localhost");
    const currentParams = new URLSearchParams(currentSearch);
    const normalizedCurrentPath = currentPath.replace(/\/$/, "");
    const normalizedTargetPath = url.pathname.replace(/\/$/, "");

    if (
      normalizedCurrentPath !== normalizedTargetPath &&
      (end || !normalizedCurrentPath.startsWith(`${normalizedTargetPath}/`))
    ) {
      return false;
    }
    if (!url.search) return true;

    for (const [key, value] of url.searchParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  };

  const hasActiveChild = hasChildren
    ? children.some((child) => isRouteMatch(child.to))
    : false;

  const shouldShowChildren = isExpanded ?? hasActiveChild;
  const isMainActive = isRouteMatch(link.to, link.end ?? true);

  if (hasChildren) {
    return (
      <li className="space-y-1">
        <button
          onClick={() => setIsExpanded(!shouldShowChildren)}
          className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
            hasActiveChild
              ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
              : "text-slate-600 hover:bg-indigo-50/80 hover:text-indigo-700"
          }`}
        >
          <div className="flex items-center">
            <MainIcon
              className={`h-5 w-5 shrink-0 ${
                hasActiveChild
                  ? "text-indigo-600"
                  : "text-slate-500 group-hover:text-indigo-600"
              }`}
              strokeWidth={2}
            />
            <span className="ml-3 text-sm font-medium">{link.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveChild && (
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${
                shouldShowChildren ? "rotate-180" : ""
              }`}
              strokeWidth={2}
            />
          </div>
        </button>

        {shouldShowChildren && (
          <ul className="ml-6 space-y-1 border-l border-indigo-100">
            {children.map((child) => {
              const ChildIcon = child.icon;
              const isChildActive = isRouteMatch(child.to);

              return (
                <li key={child.to}>
                  <NavLink
                    to={child.to}
                    className={`group/sub flex items-center rounded-r-lg px-4 py-2.5 text-sm transition-all ${
                      isChildActive
                        ? "ml-[-1.5px] border-l-2 border-indigo-500 bg-indigo-50 font-semibold text-indigo-700"
                        : "text-slate-500 hover:bg-indigo-50/80 hover:text-indigo-700"
                    }`}
                  >
                    {ChildIcon && (
                      <ChildIcon
                        className={`mr-3 h-4 w-4 shrink-0 opacity-90 ${
                          isChildActive
                            ? "text-indigo-600"
                            : "text-slate-500 group-hover/sub:text-indigo-600"
                        }`}
                        strokeWidth={2}
                      />
                    )}
                    <span>{child.label}</span>
                    {isChildActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={link.to}
        end={link.end ?? true}
        className={`group flex items-center rounded-xl transition-all duration-200 ${"px-4 py-3"} ${
          isMainActive
            ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
            : "text-slate-600 hover:bg-indigo-50/80 hover:text-indigo-700"
        }`}
      >
        <MainIcon
          className={`h-5 w-5 shrink-0 ${
            isMainActive
              ? "text-indigo-600"
              : "text-slate-500 group-hover:text-indigo-600"
          }`}
          strokeWidth={2}
        />
        <span className="ml-3 text-sm font-medium">{link.label}</span>
        {isMainActive && (
          <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" />
        )}
      </NavLink>
    </li>
  );
}
