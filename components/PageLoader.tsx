"use client";

import React, { useEffect, useState } from "react";

/**
 * PageLoader — Full-screen branded loading animation for UniLink URMS.
 * Shows on first mount, fades out after the site hydrates.
 */
export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Give the page a moment to hydrate, then fade out
    const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
    const hideTimer = setTimeout(() => setVisible(false), 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8FAFC] transition-all duration-600 ${
        fadeOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ transitionDuration: "600ms" }}
      aria-label="Loading UniLink URMS"
      role="status"
    >
      {/* Ambient gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, #0EA5E9 0%, transparent 70%)",
            animation: "pulse-slow 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, #0D9488 0%, transparent 70%)",
            animation: "pulse-slow 4s ease-in-out infinite 1s",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5"
          style={{
            background:
              "radial-gradient(circle, #0EA5E9 0%, #0D9488 50%, transparent 70%)",
          }}
        />
      </div>

      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#0EA5E9 1px, transparent 1px), linear-gradient(90deg, #0EA5E9 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Main content card */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Spinning ring behind logo */}
        <div className="relative flex items-center justify-center">
          {/* Outer slow ring */}
          <div
            className="absolute w-36 h-36 rounded-full border-2 border-transparent"
            style={{
              background:
                "linear-gradient(white, white) padding-box, linear-gradient(135deg, #0EA5E9, #0D9488, #0EA5E9) border-box",
              animation: "spin-slow 3s linear infinite",
            }}
          />
          {/* Inner fast ring */}
          <div
            className="absolute w-28 h-28 rounded-full border-2 border-transparent"
            style={{
              background:
                "linear-gradient(white, white) padding-box, linear-gradient(225deg, #0D9488, #0EA5E9, #0D9488) border-box",
              animation: "spin-slow 1.5s linear infinite reverse",
            }}
          />
          {/* Corner dots on outer ring */}
          <div className="absolute w-36 h-36" style={{ animation: "spin-slow 3s linear infinite" }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-[#0EA5E9] shadow-lg shadow-sky-400/60" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 rounded-full bg-[#0D9488] shadow-lg shadow-teal-400/60" />
          </div>

          {/* Logo circle */}
          <div className="relative z-10 w-20 h-20 rounded-full bg-white shadow-xl shadow-sky-200/60 flex items-center justify-center border border-[#E2E8F0]">
            <img
              src="/logo1.png"
              alt="UniLink Logo"
              className="w-14 h-14 object-contain"
              style={{ animation: "logo-breathe 2s ease-in-out infinite" }}
            />
          </div>
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-1" style={{ animation: "fade-in-up 0.6s ease 0.2s both" }}>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A] leading-none">
            Uni<span className="text-[#0EA5E9]">Link</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#0D9488]">
            Resource Management
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="w-48 h-1 rounded-full bg-[#E2E8F0] overflow-hidden"
          style={{ animation: "fade-in-up 0.6s ease 0.4s both" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #0EA5E9, #0D9488)",
              animation: "progress-fill 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards",
              width: "0%",
            }}
          />
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5" style={{ animation: "fade-in-up 0.6s ease 0.6s both" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]"
              style={{
                animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes logo-breathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.07); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1;   }
        }
        @keyframes progress-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1);    opacity: 0.2; }
          50%       { transform: scale(1.08); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
