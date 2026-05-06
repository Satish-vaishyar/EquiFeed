"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

const App = dynamic(() => import("../src/App"), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: "100dvh",
      background: "#080808",
      display: "grid",
      placeItems: "center",
      color: "#00ff88",
      fontFamily: "var(--app-font-mono)",
      fontSize: 11,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    }}>
      Loading EquiFeed
    </div>
  ),
});

export default function ClientEntry() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent fail keeps UI stable when service workers are blocked.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return <App />;
}
