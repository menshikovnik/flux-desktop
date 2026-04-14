import { FormEvent, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginUser, normalizeApiError, registerUser, restoreAccessToken } from "../api";
import { useAuth } from "../auth";

type AuthMode = "login" | "register";

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const colors = ["", "#ef4444", "#f59e0b", "#f59e0b", "#10b981", "#10b981"];
  const labels = ["", "Weak", "Fair", "Fair", "Strong", "Strong"];

  return {
    score,
    width: `${(score / 5) * 100}%`,
    color: colors[score],
    label: labels[score],
  };
}

export function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState<null | AuthMode>(null);
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({
    login: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const passwordStrength = useMemo(
    () => getPasswordStrength(registerForm.password),
    [registerForm.password],
  );
  const passwordsMismatch =
    registerForm.confirmPassword.length > 0 &&
    registerForm.password !== registerForm.confirmPassword;

  if (restoreAccessToken() && !entering) {
    return <Navigate replace to="/" />;
  }

  function startWorkspaceEntry(nextUser: string, nextMode: AuthMode) {
    setUser(nextUser);
    setEntering(nextMode);
    window.setTimeout(() => {
      navigate("/", { replace: true });
    }, 980);
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const identifier = loginForm.login.trim();
      await loginUser(
        identifier.includes("@")
          ? { email: identifier, password: loginForm.password }
          : { username: identifier, password: loginForm.password },
      );

      startWorkspaceEntry(
        identifier.includes("@") ? identifier.split("@")[0] : identifier,
        "login",
      );
    } catch (error) {
      setError(normalizeApiError(error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords don't match.");
      setLoading(false);
      return;
    }

    try {
      await registerUser({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
      });

      startWorkspaceEntry(registerForm.username.trim(), "register");
    } catch (error) {
      setError(normalizeApiError(error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={[
        "auth-page-root relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080811] px-6 py-10",
        entering ? "is-entering" : "",
      ].join(" ")}
    >
      <div className="auth-page-grid absolute inset-0" />
      <div className="auth-page-orb auth-page-orb--primary" />
      <div className="auth-page-orb auth-page-orb--secondary" />

      <section className="auth-page-card relative z-10 w-full max-w-[400px] rounded-[24px] border border-white/10 bg-white/[0.03] px-10 py-9 backdrop-blur-[16px]">
        <div className="mb-7 flex items-center gap-[9px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#6C63FF] text-white">
            <svg fill="currentColor" viewBox="0 0 24 24" className="h-[15px] w-[15px]">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="font-['Syne',sans-serif] text-[19px] font-bold tracking-[-0.3px] text-white">
            Flux
          </span>
        </div>

        <div className="mb-7 flex rounded-[11px] bg-white/[0.04] p-1">
          <button
            className={[
              "auth-tab flex-1 rounded-[8px] border px-3 py-[7px] text-[13px] font-medium transition-all",
              mode === "login"
                ? "border-[#6C63FF]/30 bg-[#6C63FF]/20 text-[#a89fff]"
                : "border-transparent bg-transparent text-white/30",
            ].join(" ")}
            onClick={() => {
              setMode("login");
              setError("");
            }}
            type="button"
          >
            Sign in
          </button>
          <button
            className={[
              "auth-tab flex-1 rounded-[8px] border px-3 py-[7px] text-[13px] font-medium transition-all",
              mode === "register"
                ? "border-[#6C63FF]/30 bg-[#6C63FF]/20 text-[#a89fff]"
                : "border-transparent bg-transparent text-white/30",
            ].join(" ")}
            onClick={() => {
              setMode("register");
              setError("");
            }}
            type="button"
          >
            Register
          </button>
        </div>

        <div className="auth-panel animate-[authPanelIn_220ms_ease_both]" key={mode}>
          <h1 className="mb-[5px] font-['Syne',sans-serif] text-[24px] font-bold tracking-[-0.5px] text-white">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mb-6 text-[13px] text-white/30">
            {mode === "login"
              ? "Sign in to continue to Flux"
              : "Start tracking your work with Flux"}
          </p>

          {error ? (
            <div className="mb-[14px] rounded-[9px] border border-red-500/20 bg-red-500/10 px-[13px] py-[9px] text-[12.5px] text-red-300">
              {error}
            </div>
          ) : null}

          {mode === "login" ? (
            <form className="space-y-[14px]" onSubmit={handleLoginSubmit}>
              <label className="block">
                <span className="mb-[6px] block text-[10.5px] font-medium uppercase tracking-[0.07em] text-white/35">
                  Username or email
                </span>
                <input
                  autoComplete="username"
                  className="w-full rounded-[9px] border border-white/10 bg-white/[0.05] px-[13px] py-[9px] text-[13.5px] text-white outline-none transition placeholder:text-white/20 focus:border-[#6C63FF]/50 focus:bg-[#6C63FF]/[0.07]"
                  onChange={(event) => setLoginForm((current) => ({ ...current, login: event.target.value }))}
                  placeholder="nick or nick@example.com"
                  value={loginForm.login}
                />
              </label>

              <label className="block">
                <span className="mb-[6px] block text-[10.5px] font-medium uppercase tracking-[0.07em] text-white/35">
                  Password
                </span>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-[9px] border border-white/10 bg-white/[0.05] px-[13px] py-[9px] text-[13.5px] text-white outline-none transition placeholder:text-white/20 focus:border-[#6C63FF]/50 focus:bg-[#6C63FF]/[0.07]"
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="........"
                  type="password"
                  value={loginForm.password}
                />
              </label>

              <button
                className="mt-[6px] flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#6C63FF] px-4 py-[10px] text-[13.5px] font-medium text-white transition hover:opacity-90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={loading}
                type="submit"
              >
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <form className="space-y-[14px]" onSubmit={handleRegisterSubmit}>
              <label className="block">
                <span className="mb-[6px] block text-[10.5px] font-medium uppercase tracking-[0.07em] text-white/35">
                  Username
                </span>
                <input
                  autoComplete="username"
                  className="w-full rounded-[9px] border border-white/10 bg-white/[0.05] px-[13px] py-[9px] text-[13.5px] text-white outline-none transition placeholder:text-white/20 focus:border-[#6C63FF]/50 focus:bg-[#6C63FF]/[0.07]"
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, username: event.target.value }))
                  }
                  placeholder="nickmenshikov"
                  value={registerForm.username}
                />
              </label>

              <label className="block">
                <span className="mb-[6px] block text-[10.5px] font-medium uppercase tracking-[0.07em] text-white/35">
                  Email
                </span>
                <input
                  autoComplete="email"
                  className="w-full rounded-[9px] border border-white/10 bg-white/[0.05] px-[13px] py-[9px] text-[13.5px] text-white outline-none transition placeholder:text-white/20 focus:border-[#6C63FF]/50 focus:bg-[#6C63FF]/[0.07]"
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="nick@example.com"
                  type="email"
                  value={registerForm.email}
                />
              </label>

              <label className="block">
                <span className="mb-[6px] block text-[10.5px] font-medium uppercase tracking-[0.07em] text-white/35">
                  Password
                </span>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-[9px] border border-white/10 bg-white/[0.05] px-[13px] py-[9px] text-[13.5px] text-white outline-none transition placeholder:text-white/20 focus:border-[#6C63FF]/50 focus:bg-[#6C63FF]/[0.07]"
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="........"
                  type="password"
                  value={registerForm.password}
                />

                {registerForm.password ? (
                  <div className="mt-[7px] flex items-center gap-2">
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full transition-[width,background] duration-300"
                        style={{
                          width: passwordStrength.width,
                          background: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span
                      className="min-w-[36px] text-[11px]"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-[6px] block text-[10.5px] font-medium uppercase tracking-[0.07em] text-white/35">
                  Confirm password
                </span>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-[9px] border border-white/10 bg-white/[0.05] px-[13px] py-[9px] text-[13.5px] text-white outline-none transition placeholder:text-white/20 focus:border-[#6C63FF]/50 focus:bg-[#6C63FF]/[0.07]"
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="........"
                  type="password"
                  value={registerForm.confirmPassword}
                />
                {passwordsMismatch ? (
                  <div className="mt-1 text-[11px] text-red-400">Passwords don't match</div>
                ) : null}
              </label>

              <button
                className="mt-[6px] flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#6C63FF] px-4 py-[10px] text-[13.5px] font-medium text-white transition hover:opacity-90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={loading || passwordsMismatch}
                type="submit"
              >
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-[12px] text-white/20">
            {mode === "login" ? "No account? " : "Already have an account? "}
            <button
              className="text-[#a89fff] hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              type="button"
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </div>
        </div>
      </section>

      {entering ? (
        <div className="auth-entry-transition fixed inset-0 z-20 flex items-center justify-center">
          <div className="auth-entry-transition__veil" />
          <div className="auth-entry-transition__card">
            <div className="auth-entry-transition__glow" />
            <div className="auth-entry-transition__pulse" />
            <span className="auth-entry-transition__eyebrow">Flux</span>
            <strong>
              {entering === "login" ? "Welcome back" : "Workspace created"}
            </strong>
            <p>
              {entering === "login"
                ? "Opening your projects and syncing your tasks."
                : "Launching your workspace and preparing your first project flow."}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
