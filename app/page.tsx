"use client";

import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/data";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-miss-bg flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-miss" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Data Error</h2>
          <p className="text-ink-secondary text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <LoadingSkeleton />;
  }

  return <Dashboard data={data} />;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
      <div className="skeleton h-10 w-96 mb-2" />
      <div className="skeleton h-5 w-64 mb-10" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-[420px] rounded-2xl mb-10" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  );
}
