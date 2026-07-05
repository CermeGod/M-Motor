"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type AppSidebarProps = {
  active: "dashboard" | "clients" | "catalog" | "settings" | "admin";
};

const items: Array<{ key: AppSidebarProps["active"]; label: string; href: string; icon: ReactNode }> = [
  {
    key: "dashboard",
    label: "Cotizaciones",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5z" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.6 1.6 0 0 1-2.2 2.2l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V19a1.6 1.6 0 0 1-3.2 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.6 1.6 0 1 1-2.2-2.2l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H5a1.6 1.6 0 0 1 0-3.2h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.6 1.6 0 1 1 2.2-2.2l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V5a1.6 1.6 0 0 1 3.2 0v.1a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1a1.6 1.6 0 1 1 2.2 2.2l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H19a1.6 1.6 0 0 1 0 3.2h-.1a1 1 0 0 0-.9.6z" />
      </svg>
    ),
  },
  {
    key: "clients",
    label: "Clientes",
    href: "/clients",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19c1.5-3 3.7-4.5 7-4.5s5.5 1.5 7 4.5" />
      </svg>
    ),
  },
  {
    key: "catalog",
    label: "Catálogo",
    href: "/catalog",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 13h18l-1.4-4.2a2 2 0 0 0-1.9-1.4H6.3a2 2 0 0 0-1.9 1.4L3 13z" />
        <path d="M5 13v2.5a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 15.5V13" />
        <circle cx="8" cy="18.2" r="1.2" />
        <circle cx="16" cy="18.2" r="1.2" />
      </svg>
    ),
  },
];

export function AppSidebar({ active }: AppSidebarProps) {
  const [nearEdge, setNearEdge] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [username, setUsername] = useState("usuario");
  const [role, setRole] = useState("VENDEDOR");

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      setNearEdge(event.clientX <= 72);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.username) setUsername(data.username);
        if (data?.role) setRole(data.role);
      })
      .catch(() => undefined);
  }, []);

  const isExpanded = nearEdge || hovering;
  const userInitial = username.trim().charAt(0) ? username.trim().charAt(0).toUpperCase() : "?";

  const allItems = [...items];
  if (role === "ADMIN") {
    allItems.push({
      key: "admin" as any,
      label: "Admin",
      href: "/admin",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
    });
  }

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-30 w-3" />
      <aside
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#041523] text-white shadow-lg transition-[width] duration-200 ${
          isExpanded ? "w-[220px]" : "w-[72px]"
        }`}
      >
        <div className="flex flex-col items-center border-b border-[#123048] py-5">
          {isExpanded ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4FAEC7] text-xl font-bold text-[#0E3F5D]">{userInitial}</div>
              <div className="mt-2 text-xs text-[#9bc3d6]">@{username}</div>
            </>
          ) : (
            <div className="text-2xl leading-none text-[#b5d6e5]">☰</div>
          )}
        </div>

        <nav className="space-y-3 p-3 text-xs font-semibold">
          {allItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center rounded-md py-2 ${isExpanded ? "justify-start px-3" : "justify-center px-2"} ${
                active === item.key ? "bg-[#1b3f58]" : "hover:bg-[#123048]"
              }`}
            >
              <span className="text-xl leading-none text-[#e2f2fa]">{item.icon}</span>
              {isExpanded && <span className="ml-2 whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-[#123048] p-3">
          <Link
            href="/settings"
            className={`flex items-center rounded-md py-2 text-xs font-semibold ${isExpanded ? "justify-start px-3" : "justify-center px-2"} ${
              active === "settings" ? "bg-[#1b3f58]" : "hover:bg-[#123048]"
            }`}
          >
            <span className="text-[#e2f2fa]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5z" />
                <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.6 1.6 0 0 1-2.2 2.2l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V19a1.6 1.6 0 0 1-3.2 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.6 1.6 0 1 1-2.2-2.2l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H5a1.6 1.6 0 0 1 0-3.2h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.6 1.6 0 1 1 2.2-2.2l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V5a1.6 1.6 0 0 1 3.2 0v.1a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1a1.6 1.6 0 1 1 2.2 2.2l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H19a1.6 1.6 0 0 1 0 3.2h-.1a1 1 0 0 0-.9.6z" />
              </svg>
            </span>
            {isExpanded && <span className="ml-2 whitespace-nowrap">Configuraciones</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
