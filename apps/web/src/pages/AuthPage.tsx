import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/authStore";
import { Button } from "../components/ui/Button";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@carboniq.app");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await api.login({ email, password })
          : await api.signup({ name, email, password });
      login(result.token, result.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-7 h-7 rounded-full bg-lime/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-lime" />
          </div>
          <span className="font-display font-semibold text-[19px] tracking-tight text-cream">CarbonIQ</span>
        </div>

        <div className="bg-panel border border-line rounded-2xl shadow-card p-7">
          <h1 className="font-display text-[20px] font-semibold text-cream mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-[14px] text-sage mb-6">
            {mode === "login" ? "Sign in to see your climate twin." : "Start tracking what your data already knows."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <Field label="Name" value={name} onChange={setName} type="text" placeholder="Asha Rao" />
            )}
            <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
            <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />

            {error && <p className="text-[13px] text-coral">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full justify-center mt-2">
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-[13px] text-sage mt-5 text-center">
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-lime font-medium hover:underline"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-[12px] text-sage text-center mt-5">
          Demo account pre-filled — password is <span className="num-mono">demo1234</span>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-cream mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-void text-[14px] text-cream placeholder:text-sage/60 focus:outline-none focus:border-lime transition-colors"
      />
    </label>
  );
}
