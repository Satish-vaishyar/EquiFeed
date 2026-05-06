import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#080808", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontFamily: "var(--app-font-sans)",
          fontSize: 24,
          fontWeight: 900,
          margin: "0 0 8px",
          background: "linear-gradient(135deg, #00ff88 0%, #00c3ff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          EquiFeed
        </p>
        <p style={{ fontFamily: "var(--app-font-mono)", fontSize: 10, color: "#666", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Finishing sign up
        </p>
      </div>
      <AuthenticateWithRedirectCallback
        continueSignUpUrl="/sign-up/continue"
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/onboarding"
      />
    </div>
  );
}
