"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  AppWindow,
  Bell,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileClock,
  FileText,
  Gauge,
  Laptop,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  Shield,
  ShoppingCart,
  Sun,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { signOutAction } from "@/app/(auth)/login/actions";

const navigationGroups: {
  label: string;
  items: {
    label: string;
    href: string;
    icon: LucideIcon;
    permission: string;
  }[];
}[] = [
  {
    label: "WORKSPACE",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { label: "Assets", href: "/assets", icon: Laptop, permission: "assets.view" },
      { label: "People", href: "/employees", icon: Users, permission: "employees.view" },
      { label: "Network & firewall", href: "/network", icon: Shield, permission: "firewall.view" },
      { label: "Inventory", href: "/inventory", icon: Boxes, permission: "inventory.view" },
      { label: "Purchases", href: "/purchases", icon: ShoppingCart, permission: "purchase.view" },
      { label: "Software & licenses", href: "/software", icon: AppWindow, permission: "software.view" },
      { label: "IT finance", href: "/finance", icon: Gauge, permission: "finance.view" },
      { label: "Support & maintenance", href: "/maintenance", icon: Wrench, permission: "maintenance.view" },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { label: "Reports", href: "/reports", icon: FileText, permission: "reports.view" },
      { label: "Audit log", href: "/audit", icon: FileClock, permission: "audit_logs.view" },
    ],
  },
];

type Theme = "light" | "dark" | "system";
type Popover = "search" | "notifications" | "profile" | null;

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: {
    displayName: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [popover, setPopover] = useState<Popover>(null);
  const [theme, setTheme] = useState<Theme>("system");
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      root.dataset.theme = theme;
      const isDark = theme === "dark" || (theme === "system" && systemTheme.matches);
      root.classList.toggle("dark", isDark);
      if (theme === "system") {
        root.style.colorScheme = "light dark";
      } else {
        root.style.colorScheme = theme;
      }
    };

    applyTheme();
    systemTheme.addEventListener("change", applyTheme);
    return () => systemTheme.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape") {
        setPopover(null);
        setMobileSearchOpen(false);
        searchInputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, []);

  const visibleNavigation = useMemo(
    () =>
      navigationGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) => !user || user.permissions.includes(item.permission),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [user],
  );
  const searchableNavigation = useMemo(
    () =>
      visibleNavigation.flatMap((group) => group.items).filter((item) =>
        item.label.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query, visibleNavigation],
  );

  function cycleTheme() {
    setTheme((current) =>
      current === "system" ? "light" : current === "light" ? "dark" : "system",
    );
  }

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div className={`app-frame${collapsed ? " sidebar-is-collapsed" : ""}`}>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}

      <aside className={`sidebar${mobileOpen ? " sidebar-mobile-open" : ""}`}>
        <div className="sidebar-brand-row">
          <Link className="sidebar-brand" href="/" aria-label="Nexus IT Hub dashboard">
            <BrandMark />
            <span className="sidebar-brand-name">
              nexus<span>it hub</span>
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            className="icon-button mobile-close"
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">N</div>
          <div className="workspace-info">
            <span className="workspace-name">Workspace</span>
            <span className="workspace-state">
            <span className={`status-dot${user ? "" : " status-dot-muted"}`} />
            {user ? "Connected" : "Not connected"}
            </span>
          </div>
          <ChevronDown size={15} className="workspace-chevron" />
        </div>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          {visibleNavigation.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = isActive(href, pathname);
                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`nav-link${active ? " nav-link-active" : ""}`}
                    href={href}
                    aria-label={label}
                    key={href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? label : undefined}
                  >
                    <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
                    <span className="nav-link-label">{label}</span>
                    {active && <span className="nav-active-mark" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {(!user || user.permissions.includes("users.manage")) && <Link
            className={`nav-link${isActive("/settings", pathname) ? " nav-link-active" : ""}`}
            href="/settings"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings2 size={18} strokeWidth={1.75} />
            <span className="nav-link-label">Settings</span>
          </Link>}
          <div className="sidebar-help">
            <div className="help-icon"><CircleHelp size={17} /></div>
            <div className="help-copy">
              <span>Need a hand?</span>
              <small>Setup guide</small>
            </div>
            <ChevronRight className="help-chevron" size={15} />
          </div>
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            type="button"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            <span className="nav-link-label">Collapse sidebar</span>
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              aria-label="Open navigation"
              className="icon-button mobile-menu-button"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <Menu size={19} />
            </button>
            <div className="breadcrumbs">
              <span className="breadcrumb-root">Workspace</span>
              <ChevronRight size={14} />
              <span className="breadcrumb-current">
                {pathname === "/"
                  ? "Dashboard"
                  : navigationGroups
                      .flatMap((group) => group.items)
                      .find((item) => isActive(item.href, pathname))?.label ??
                    "Workspace"}
              </span>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              aria-expanded={mobileSearchOpen}
              aria-label="Open search"
              className="icon-button mobile-search-trigger"
              onClick={() => {
                setMobileSearchOpen(true);
                setPopover("search");
                requestAnimationFrame(() => searchInputRef.current?.focus());
              }}
              type="button"
            >
              <Search size={17} />
            </button>
            <div className={`global-search-wrap${mobileSearchOpen ? " mobile-search-open" : ""}`}>
              <Search size={16} aria-hidden="true" />
              <input
                aria-label="Search workspace"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPopover("search");
                }}
                onFocus={() => setPopover("search")}
                placeholder="Search anything..."
                ref={searchInputRef}
                value={query}
              />
              <kbd>⌘ K</kbd>
              <button
                aria-label="Close search"
                className="mobile-search-close"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setPopover(null);
                  searchInputRef.current?.blur();
                }}
                type="button"
              >
                <X size={16} />
              </button>
              {popover === "search" && (
                <div className="topbar-popover search-popover">
                  <div className="popover-heading">
                    {query ? "NAVIGATION RESULTS" : "QUICK NAVIGATION"}
                  </div>
                  {searchableNavigation.length > 0 ? (
                    searchableNavigation.slice(0, 5).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          className="search-result"
                          href={item.href}
                          key={item.href}
                          onClick={() => {
                            setPopover(null);
                            setMobileSearchOpen(false);
                          }}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                          <ChevronRight size={14} />
                        </Link>
                      );
                    })
                  ) : (
                    <p className="popover-empty">No workspace sections match that search.</p>
                  )}
                  {query && (
                    <p className="popover-footnote">
                      Record search becomes available after data is connected.
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              aria-label={`Theme: ${theme}. Click to change.`}
              className="icon-button theme-button"
              onClick={cycleTheme}
              size="icon"
              title={`Theme: ${theme}`}
              type="button"
              variant="ghost"
            >
              <ThemeIcon size={18} strokeWidth={1.75} />
            </Button>

            <div className="popover-anchor">
              <button
                aria-expanded={popover === "notifications"}
                aria-label="Notifications"
                className="icon-button notification-button"
                onClick={() =>
                  setPopover((current) =>
                    current === "notifications" ? null : "notifications",
                  )
                }
                type="button"
              >
                <Bell size={18} strokeWidth={1.75} />
              </button>
              {popover === "notifications" && (
                <div className="topbar-popover notification-popover">
                  <div className="notification-popover-heading">
                    <strong>Notifications</strong>
                    <span>INBOX</span>
                  </div>
                  <div className="notification-empty-icon"><Bell size={20} /></div>
                  <strong className="notification-empty-title">You&apos;re all caught up</strong>
                  <p>
                    Alerts will appear here when your workspace is connected and
                    records are available.
                  </p>
                </div>
              )}
            </div>

            <div className="popover-anchor">
              <button
                aria-expanded={popover === "profile"}
                aria-label="Account menu"
                className="profile-button"
                onClick={() =>
                  setPopover((current) => current === "profile" ? null : "profile")
                }
                type="button"
              >
                <span className="profile-avatar"><Users size={15} /></span>
                <span className="profile-name">{user?.displayName ?? "Not signed in"}</span>
                <ChevronDown className="profile-chevron" size={14} />
              </button>
              {popover === "profile" && (
                <div className="topbar-popover profile-popover">
                  {user ? (
                    <>
                      <div className="profile-popover-title">{user.email}</div>
                      <p>{user.roles.join(", ") || "No roles assigned"}</p>
                      <form action={signOutAction}>
                        <button className="profile-settings-link" type="submit">
                          Sign out <ChevronRight size={14} />
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <div className="profile-popover-title">Preview workspace</div>
                      <p>Authentication is not connected yet.</p>
                      <Link
                        href="/login"
                        className="profile-settings-link"
                        onClick={() => setPopover(null)}
                      >
                        Sign in <ChevronRight size={14} />
                      </Link>
                      <Link
                        href="/settings"
                        className="profile-settings-link"
                        onClick={() => setPopover(null)}
                      >
                        Workspace setup <ChevronRight size={14} />
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          {!user && (
            <div className="preview-notice" role="status">
              <span className="preview-notice-icon"><Archive size={14} /></span>
              <span>
                <strong>Frontend preview</strong>
                <span className="preview-notice-separator">·</span>
                Data and sign-in are not connected. No sample records are shown.
              </span>
              <Link href="/settings" className="preview-notice-link">Workspace setup <ChevronRight size={14} /></Link>
            </div>
          )}
          {children}
          <footer className="app-footer">
            <span>© 2026 Nexus IT Hub</span>
            <span>
              <span className="footer-status-dot" />
              {user ? "Authenticated workspace" : "Frontend preview"}
            </span>
            <span>Version 1.0</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
