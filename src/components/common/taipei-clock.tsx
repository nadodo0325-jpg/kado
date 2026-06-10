"use client";

import { useEffect, useState } from "react";

function formatTaipeiDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";

  return `${year} 年 ${month} 月 ${day} 日 ${weekday} ${hour}:${minute}`;
}

export function TaipeiClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="shrink-0 border border-[var(--kado-border)] bg-white px-3 py-2 text-right">
      <p className="kado-mono whitespace-nowrap text-xs text-[var(--kado-muted)]">
        SYSTEM TIME
      </p>
      <p
        className="mt-1 whitespace-nowrap text-xs font-medium"
        suppressHydrationWarning
      >
        {formatTaipeiDateTime(now)}
      </p>
    </div>
  );
}