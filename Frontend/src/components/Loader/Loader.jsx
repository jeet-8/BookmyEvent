import React from "react";

const Loader = () => (
  <main
    role="status"
    aria-label="Loading BookmyEvent"
    className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0f1d] px-6 text-white"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/30 blur-3xl opacity-20"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-orange-500/30 blur-3xl opacity-20"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-3xl opacity-20"
    />

    <div className="relative z-10 flex flex-col items-center">
      <div className="mb-5 flex items-center justify-center gap-3">
        <svg
          aria-hidden="true"
          viewBox="0 0 72 72"
          className="h-16 w-16 overflow-visible"
          fill="none"
        >
          <path
            d="M11 19a5 5 0 0 1 5-5h39a5 5 0 0 1 5 5v7a7 7 0 0 0 0 14v7a5 5 0 0 1-5 5H16a5 5 0 0 1-5-5v-7a7 7 0 0 0 0-14v-7Z"
            className="fill-cyan-400/15 stroke-cyan-300"
            strokeWidth="2.5"
            style={{ filter: "drop-shadow(0 0 12px rgba(6,182,212,0.65))" }}
          />
          <path
            d="M26 20v3m0 5v3m0 5v3m0 5v3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeOpacity=".75"
            strokeWidth="2"
          />
          <path
            d="m49 12 3.7 7.5 8.3 1.2-6 5.9 1.4 8.3-7.4-3.9-7.4 3.9 1.4-8.3-6-5.9 8.3-1.2L49 12Z"
            className="fill-orange-400 stroke-orange-300"
            strokeLinejoin="round"
            strokeWidth="1.5"
            style={{ filter: "drop-shadow(0 0 12px rgba(249,115,22,0.65))" }}
          />
        </svg>
        <span className="font-sans text-3xl font-semibold tracking-wide">
          bookmyEvent
        </span>
      </div>

      <div
        aria-hidden="true"
        className="relative mt-3 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300 border-r-orange-400 shadow-[0_0_18px_rgba(6,182,212,0.25)]"
      >
        <span className="absolute inset-1 rounded-full border border-dashed border-white/20" />
      </div>
      <span className="sr-only">Loading, please wait</span>
    </div>
  </main>
);

export default Loader;
