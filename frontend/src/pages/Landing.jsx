import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function Landing({ initialMode = "login" }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(
    initialMode === "register" || location.pathname === "/register"
      ? "register"
      : "login"
  );

  // Redirect authenticated users to /home
  useEffect(() => {
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  // Sync mode with URL if navigated directly
  useEffect(() => {
    if (location.pathname === "/register") {
      setMode("register");
    } else if (location.pathname === "/login") {
      setMode("login");
    }
  }, [location.pathname]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const identifier = loginIdentifier.trim();
    if (!identifier || !loginPassword) {
      setLoginError("Please enter your email or username and password.");
      return;
    }

    try {
      setLoginLoading(true);
      setLoginError("");
      await login({
        email: identifier,
        password: loginPassword,
      });
      toast.success("Welcome back to Nexo!");
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Invalid credentials. Please try again.";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const username = regUsername.trim();
    const email = regEmail.trim();

    if (!username || !email || !regPassword) {
      setRegError("All required fields must be filled.");
      return;
    }

    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }

    try {
      setRegLoading(true);
      setRegError("");
      await register({
        name: regName.trim() || undefined,
        username,
        email,
        password: regPassword,
      });
      toast.success("Account created successfully!");
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to create account. Please check your information.";
      setRegError(msg);
      toast.error(msg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <main className="h-[100dvh] w-full flex items-center justify-center bg-[#F7F6F3] dark:bg-[#0A0A0A] transition-colors overflow-hidden max-md:overflow-y-auto max-md:h-auto max-md:min-h-[100dvh] p-0 md:p-4 lg:p-6">
      <div className="w-full md:max-w-[1080px] md:max-h-[92vh] md:rounded-[28px] overflow-hidden shadow-2xl md:border border-[#E8E4DD] dark:border-[#222222] bg-[#E85507] grid grid-cols-1 md:grid-cols-12 min-h-[100dvh] md:min-h-[580px] md:h-[88vh]">
        {/* ================= LEFT SECTION: BRAND HERO ================= */}
        <section className="relative md:col-span-6 lg:col-span-7 bg-gradient-to-br from-[#E64400] via-[#D83A00] to-[#8C1E00] p-8 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden text-white select-none">
          {/* Subtle glowing orb effect in the background */}
          <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 right-0 size-80 rounded-full bg-orange-400/20 blur-2xl" />

          {/* Top Brand Header: Official Emblem + Wordmark */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="size-11 sm:size-12 rounded-2xl bg-black/20 p-1.5 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <img
                src="/logo.png"
                alt="Nexo emblem"
                className="size-full object-contain filter drop-shadow brightness-110"
              />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow">
              Nexo
            </span>
          </div>

          {/* Central Hero Headline */}
          <div className="relative z-10 my-10 sm:my-14 lg:my-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white drop-shadow-md">
              Connect
              <br />
              Share
              <br />
              Grow
            </h1>

            <p className="mt-5 text-sm sm:text-base font-normal text-white/90 max-w-sm leading-relaxed drop-shadow">
              Your world, your people, all in one place.
            </p>
          </div>

          {/* Bottom Ancient / Mountain Landscape Scenic Silhouette */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-44 sm:h-52 overflow-hidden opacity-35 mix-blend-multiply">
            <svg
              viewBox="0 0 1000 360"
              preserveAspectRatio="none"
              className="size-full fill-[#380B00]"
            >
              {/* Back subtle ridge */}
              <path
                opacity="0.4"
                d="M0,260 Q180,180 350,230 T700,200 Q880,160 1000,240 L1000,360 L0,360 Z"
              />
              {/* Middle mountain peaks */}
              <path
                opacity="0.7"
                d="M0,290 L120,220 L280,270 L460,170 L620,260 L780,210 L920,280 L1000,250 L1000,360 L0,360 Z"
              />
              {/* Front foothills with trees silhouette */}
              <path d="M0,320 Q120,290 260,310 T550,290 Q720,270 880,310 T1000,300 L1000,360 L0,360 Z" />
            </svg>
          </div>
        </section>

        {/* ================= RIGHT SECTION: AUTHENTICATION PANEL ================= */}
        <section className="md:col-span-6 lg:col-span-5 bg-white dark:bg-[#151515] p-6 sm:p-8 lg:p-9 flex flex-col justify-center transition-colors">
          <div className="w-full max-w-md mx-auto">
            {/* Tab Switcher: Login / Register */}
            <div className="flex border-b border-[#EEECE8] dark:border-[#262626] mb-7">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setLoginError("");
                  setRegError("");
                }}
                className={`flex-1 py-3.5 text-center text-sm font-semibold transition-colors relative ${
                  mode === "login"
                    ? "text-[#FF4D00]"
                    : "text-[#85858D] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Login
                {mode === "login" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4D00] rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setLoginError("");
                  setRegError("");
                }}
                className={`flex-1 py-3.5 text-center text-sm font-semibold transition-colors relative ${
                  mode === "register"
                    ? "text-[#FF4D00]"
                    : "text-[#85858D] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Register
                {mode === "register" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4D00] rounded-full" />
                )}
              </button>
            </div>

            {/* ================= LOGIN FORM ================= */}
            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div
                    role="alert"
                    className="p-3 text-xs rounded-xl bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"
                  >
                    {loginError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="login-identifier"
                    className="block text-xs font-semibold text-[#1B1C20] dark:text-neutral-200 mb-1.5"
                  >
                    Email or username
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    placeholder="Enter your email or username"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E1DB] dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1E] text-sm text-[#1B1C20] dark:text-white placeholder-[#9A9CA3] dark:placeholder-neutral-500 outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/15 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#1B1C20] dark:text-neutral-200 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-[#E4E1DB] dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1E] text-sm text-[#1B1C20] dark:text-white placeholder-[#9A9CA3] dark:placeholder-neutral-500 outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/15 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85858D] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:text-white p-1"
                      title={showLoginPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showLoginPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-[#FF4D00] hover:bg-[#E64400] text-white text-sm font-semibold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>

                <p className="pt-3 text-center text-xs text-[#85858D] dark:text-neutral-400">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setLoginError("");
                    }}
                    className="font-semibold text-[#FF4D00] hover:underline cursor-pointer"
                  >
                    Register
                  </button>
                </p>
              </form>
            ) : (
              /* ================= REGISTER FORM ================= */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {regError && (
                  <div
                    role="alert"
                    className="p-3 text-xs rounded-xl bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"
                  >
                    {regError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-[#1B1C20] dark:text-neutral-200 mb-1"
                  >
                    Full name <span className="text-[#85858D] font-normal">(optional)</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E1DB] dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1E] text-sm text-[#1B1C20] dark:text-white placeholder-[#9A9CA3] dark:placeholder-neutral-500 outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/15 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-username"
                    className="block text-xs font-semibold text-[#1B1C20] dark:text-neutral-200 mb-1"
                  >
                    Username
                  </label>
                  <input
                    id="reg-username"
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                    placeholder="Choose a username"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E1DB] dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1E] text-sm text-[#1B1C20] dark:text-white placeholder-[#9A9CA3] dark:placeholder-neutral-500 outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/15 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-[#1B1C20] dark:text-neutral-200 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="Enter your email address"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E1DB] dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1E] text-sm text-[#1B1C20] dark:text-white placeholder-[#9A9CA3] dark:placeholder-neutral-500 outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/15 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-semibold text-[#1B1C20] dark:text-neutral-200 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-[#E4E1DB] dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1E] text-sm text-[#1B1C20] dark:text-white placeholder-[#9A9CA3] dark:placeholder-neutral-500 outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/15 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85858D] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:text-white p-1"
                      title={showRegPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-confirm"
                    className="block text-xs font-semibold text-[#1B1C20] dark:text-neutral-200 mb-1"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm"
                      type={showRegConfirmPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat your password"
                      className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-[#E4E1DB] dark:border-[#2E2E2E] bg-white dark:bg-[#1C1C1E] text-sm text-[#1B1C20] dark:text-white placeholder-[#9A9CA3] dark:placeholder-neutral-500 outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/15 transition"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowRegConfirmPassword(!showRegConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85858D] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:text-white p-1"
                      title={
                        showRegConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      tabIndex={-1}
                    >
                      {showRegConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-[#FF4D00] hover:bg-[#E64400] text-white text-sm font-semibold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
                >
                  {regLoading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>

                <p className="pt-2 text-center text-xs text-[#85858D] dark:text-neutral-400">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setRegError("");
                    }}
                    className="font-semibold text-[#FF4D00] hover:underline cursor-pointer"
                  >
                    Login
                  </button>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
