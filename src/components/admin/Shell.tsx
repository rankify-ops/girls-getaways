"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IBell, IBox, IChart, IClose, ICog, IDoc, IExternal, IGrid, IInbox, IMenu, IPin, ISearch, IUsers,
} from "./AdminIcons";

/*
 * Portal shell: fixed espresso sidebar + sticky translucent topbar, matching
 * the approved prototype. The sidebar collapses behind a hamburger under 900px.
 *
 * Nav groups mirror the prototype's, but sections that aren't built yet are
 * marked "Soon" rather than shown with invented counts.
 */

type Item = { href: string; label: string; icon: typeof IGrid; soon?: boolean };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Website",
    items: [
      { href: "/admin", label: "Dashboard", icon: IGrid },
      { href: "/admin/packages", label: "Packages", icon: IBox },
      { href: "/admin/destinations", label: "Destinations", icon: IPin },
      { href: "/admin/content", label: "Homepage content", icon: IDoc },
    ],
  },
  {
    title: "Sales operations",
    items: [
      { href: "/admin/enquiries", label: "Enquiries", icon: IInbox, soon: true },
      { href: "/admin/bookings", label: "Bookings", icon: IUsers, soon: true },
      { href: "/admin/reports", label: "Reports", icon: IChart, soon: true },
    ],
  },
  {
    title: "Manage",
    items: [{ href: "/admin/settings", label: "Settings", icon: ICog }],
  },
];

export function Shell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/admin";
  const [open, setOpen] = useState(false);
  const current = (href: string) =>
    href === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(href);

  return (
    <div className="adm-shell">
      <aside className="adm-side" data-open={open}>
        <div className="adm-brand">
          <span className="adm-mark">gg</span>
          <span className="min-w-0">
            <span className="adm-brand-name block truncate">Girls Getaways</span>
            <span className="adm-brand-sub block">Website portal</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto text-[#a89c94] lg:hidden"
            aria-label="Close menu"
          >
            <IClose size={18} />
          </button>
        </div>

        <div className="adm-search">
          <ISearch size={15} />
          <span>Search…</span>
        </div>

        <nav className="adm-nav" aria-label="Portal">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="adm-group">{g.title}</p>
              {g.items.map((it) => {
                const Icon = it.icon;
                if (it.soon) {
                  return (
                    <span key={it.label} className="adm-link cursor-default opacity-55">
                      <Icon size={16} />
                      {it.label}
                      <span className="adm-soon">Soon</span>
                    </span>
                  );
                }
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    aria-current={current(it.href) ? "page" : undefined}
                    className="adm-link"
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={16} />
                    {it.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <a href="/" target="_blank" rel="noreferrer" className="adm-link mx-3 mb-1">
          <IExternal size={16} />
          View website
        </a>

        <div className="adm-user">
          <span className="adm-avatar">GG</span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] text-white">Girls Getaways</span>
            <span className="block truncate text-[11px] text-[#a89c94]">Not signed in yet</span>
          </span>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-[#2b2422]/45 lg:hidden"
        />
      )}

      <div className="adm-main">
        <header className="adm-top">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="adm-icon-btn lg:hidden"
            aria-label="Open menu"
          >
            <IMenu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="adm-h1 adm-display truncate">{title}</h1>
            {subtitle && <p className="adm-sub mt-1 truncate">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="adm-icon-btn" aria-hidden>
              <IBell size={18} />
            </span>
            {actions}
          </div>
        </header>
        <main className="adm-content">{children}</main>
      </div>
    </div>
  );
}
