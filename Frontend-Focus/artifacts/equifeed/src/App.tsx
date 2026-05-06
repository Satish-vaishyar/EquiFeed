"use client";

import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { BottomNav } from "./components/layout/BottomNav";
import { useUserStore } from "./store/userStore";

import SignIn from "./views/SignIn";
import SignUp from "./views/SignUp";
import Onboarding from "./views/Onboarding";
import Home from "./views/Home";
import Explore from "./views/Explore";
import Create from "./views/Create";
import Trends from "./views/Trends";
import Analytics from "./views/Analytics";
import Profile from "./views/Profile";
import UserProfile from "./views/UserProfile";

const queryClient = new QueryClient();

function AppLayout() {
  const { isLoaded, isSignedIn } = useUser();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const onboardingComplete = useUserStore((s) => s.onboardingComplete);
  const syncAuthenticatedUser = useUserStore((s) => s.syncAuthenticatedUser);
  const clearLocalUser = useUserStore((s) => s.signOut);
  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        clearLocalUser();
        setSyncing(false);
        return;
      }

      // If local store already shows onboarding complete, skip the heavy sync
      // to avoid overwriting freshly-completed onboarding state.
      // We still sync in the background but don't block rendering.
      setSyncing(true);
      setSyncError(null);

      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Database sync failed");
        }
        const data = await response.json();
        if (!cancelled) {
          syncAuthenticatedUser(data.user, data.onboardingComplete);
        }
      } catch (err) {
        if (!cancelled) setSyncError(err instanceof Error ? err.message : "Network error");
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    void syncUser();

    return () => {
      cancelled = true;
    };
  }, [clearLocalUser, isLoaded, isSignedIn, syncAuthenticatedUser]);

  // Show a spinner only during initial Clerk load — not during DB sync
  // so that new users navigated to /onboarding aren't blocked.
  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100dvh", background: "#080808", display: "grid", placeItems: "center" }}>
        <p style={{ color: "#00ff88", fontFamily: "var(--app-font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Loading EquiFeed
        </p>
      </div>
    );
  }

  // Not signed in with Clerk at all → show auth screens
  if (!isSignedIn) {
    return (
      <Switch>
        <Route path="/" component={SignIn} />
        <Route path="/sign-in" component={SignIn} />
        <Route path="/sign-up" component={SignUp} />
        <Route path="/sign-up/continue" component={SignUp} />
        <Route>
          <SignIn />
        </Route>
      </Switch>
    );
  }

  // Signed in but not yet synced with DB (or sync failed) — still allow onboarding
  // so new users aren't stuck behind a loader or error screen.
  if (syncing || !isAuthenticated || !onboardingComplete) {
    // If DB sync errored but the local store says onboarding is done, let them through.
    // This handles offline or temporary DB issues for returning users.
    if (syncError && onboardingComplete && isAuthenticated) {
      // Fall through to main app below
    } else {
      return (
        <Switch>
          <Route path="/onboarding" component={Onboarding} />
          <Route>
            {/* Show a subtle sync indicator but still redirect to onboarding */}
            <Redirect to="/onboarding" />
          </Route>
        </Switch>
      );
    }
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          <Route path="/create" component={Create} />
          <Route path="/trends" component={Trends} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/:username" component={UserProfile} />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter>
        <AppLayout />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
