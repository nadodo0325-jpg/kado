"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type Platform = "ios" | "android" | "desktop" | "unknown";

const DISMISS_KEY = "kado_pwa_install_prompt_dismissed_until";
const DISMISS_DAYS = 7;

function detectPlatform(): Platform {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const userAgent = window.navigator.userAgent.toLowerCase();

  const isIos =
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIos) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  return "desktop";
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isDismissedRecently() {
  const dismissedUntil = window.localStorage.getItem(DISMISS_KEY);

  if (!dismissedUntil) {
    return false;
  }

  return Date.now() < Number(dismissedUntil);
}

function dismissForSevenDays() {
  const dismissedUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  window.localStorage.setItem(DISMISS_KEY, String(dismissedUntil));
}

export function PwaInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    setPlatform(detectPlatform());
    setIsInstalled(isStandaloneMode());
    setIsDismissed(isDismissedRecently());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function installApp() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  }

  function dismissPrompt() {
    dismissForSevenDays();
    setIsDismissed(true);
  }

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <section className="mt-6 border border-[var(--kado-border)] bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--kado-border)] px-4 py-3">
        <div>
          <p className="kado-mono text-xs text-[var(--kado-muted)]">
            INSTALL
          </p>
          <h3 className="mt-1 text-sm font-semibold">把 Kado 加到主畫面</h3>
        </div>

        <button
          type="button"
          onClick={dismissPrompt}
          className="kado-transition border border-[var(--kado-border)] px-2 py-1 text-xs text-[var(--kado-muted)] hover:bg-zinc-50"
        >
          稍後
        </button>
      </div>

      <div className="px-4 py-3">
        {platform === "ios" ? (
          <IosInstallGuide />
        ) : (
          <BrowserInstallGuide
            platform={platform}
            canInstall={Boolean(deferredPrompt)}
            onInstall={installApp}
          />
        )}
      </div>
    </section>
  );
}

function IosInstallGuide() {
  return (
    <div>
      <p className="text-sm leading-6 text-[var(--kado-muted)]">
        iPhone / iPad 請使用 Safari 開啟，點選下方分享按鈕，再選擇「加入主畫面」。
      </p>

      <div className="mt-3 grid gap-2 text-sm">
        <div className="grid grid-cols-[auto_1fr] gap-3 border border-[var(--kado-border)] p-3">
          <div className="text-xl">1</div>
          <div>
            <p className="font-semibold">點 Safari 底部分享按鈕 📤</p>
            <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
              如果你不是用 Safari，請先用 Safari 開啟 Kado。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 border border-[var(--kado-border)] p-3">
          <div className="text-xl">2</div>
          <div>
            <p className="font-semibold">選擇「加入主畫面」</p>
            <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
              完成後，Kado 會像 App 一樣出現在手機桌面。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserInstallGuide({
  platform,
  canInstall,
  onInstall,
}: {
  platform: Platform;
  canInstall: boolean;
  onInstall: () => void;
}) {
  return (
    <div>
      <p className="text-sm leading-6 text-[var(--kado-muted)]">
        {platform === "android"
          ? "Android Chrome 可以直接把 Kado 安裝到手機主畫面。"
          : "Chrome / Edge 可以把 Kado 安裝成桌面 App。"}
      </p>

      <button
        type="button"
        onClick={onInstall}
        disabled={!canInstall}
        className="kado-transition mt-3 w-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {canInstall ? "安裝 Kado" : "等待瀏覽器開放安裝"}
      </button>

      {!canInstall ? (
        <div className="mt-3 border border-[var(--kado-border)] p-3">
          <p className="text-xs font-semibold">手動安裝方式</p>
          <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
            Chrome / Edge 右上角選單 → 找到「安裝應用程式」或「將頁面新增到主畫面」。
          </p>
        </div>
      ) : null}
    </div>
  );
}