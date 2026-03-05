"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-[0_1px_12px_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-[1.25rem] tracking-[-0.02em] text-gray-900 hover:opacity-70 transition-opacity"
        >
          Loadr
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7 text-[0.875rem] font-medium text-gray-500">
          <a href="#services" className="hover:text-gray-900 transition-colors">Services</a>
          <a href="#coverage" className="hover:text-gray-900 transition-colors">Coverage</a>
          <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
        </div>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="bg-gray-900 text-white text-[0.8125rem] font-semibold px-5 py-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            Get a Quote
          </a>
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {mobileOpen ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex flex-col gap-4">
          <a href="#services" className="text-sm font-medium text-gray-700 hover:text-gray-900" onClick={() => setMobileOpen(false)}>Services</a>
          <a href="#coverage" className="text-sm font-medium text-gray-700 hover:text-gray-900" onClick={() => setMobileOpen(false)}>Coverage</a>
          <a href="#about" className="text-sm font-medium text-gray-700 hover:text-gray-900" onClick={() => setMobileOpen(false)}>About</a>
        </div>
      )}
    </nav>
  );
}
