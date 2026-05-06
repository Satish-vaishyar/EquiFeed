"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsSecure(window.isSecureContext);
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const win = window as Window & {
      __equifeedDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
    };
    if (win.__equifeedDeferredInstallPrompt) {
      setDeferredPrompt(win.__equifeedDeferredInstallPrompt);
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const onEquifeedInstallAvailable = () => {
      const promptEvent = win.__equifeedDeferredInstallPrompt;
      if (promptEvent) {
        setDeferredPrompt(promptEvent);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("equifeed-beforeinstallprompt", onEquifeedInstallAvailable);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("equifeed-beforeinstallprompt", onEquifeedInstallAvailable);
    };
  }, []);

  if (isInstalled) {
    return null;
  }

  async function downloadManifest() {
    try {
      const response = await fetch("/manifest.webmanifest", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Manifest download failed");
      }
      const text = await response.text();
      const blob = new Blob([text], { type: "application/manifest+json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "EquiFeed.webmanifest";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Download failed. Try again in a moment.");
    }
  }

  return (
    <button
      type="button"
      className="install-prompt-button"
      onClick={async () => {
        if (deferredPrompt) {
          await deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          setDeferredPrompt(null);
          return;
        }

        if (!isSecure) {
          await downloadManifest();
          window.alert("Install from browser menu works on https:// or localhost.");
          return;
        }

        await downloadManifest();
        window.alert("Use browser menu to install: Add to Home screen / Install app.");
      }}
    >
      <Download size={16} />
      <span>{deferredPrompt ? "Install" : "Download App"}</span>
    </button>
  );
}
