import { useEffect, useState } from "react";

/* Private traffic view backed by the Express server. Behaviour unchanged, restyled. */

type Visit = {
  path: string;
  method: string;
  ip: string;
  city: string;
  region: string;
  country: string;
  device: string;
  timestamp: string;
};

const TOKEN_KEY = "token";

function Login({ onToken }: { onToken: (t: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api-proxy/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      localStorage.setItem(TOKEN_KEY, token);
      onToken(token);
    } catch {
      setError("Invalid credentials.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-[16px] bg-surface-1 px-4 py-3 text-ink shadow-[inset_0_0_0_1px_var(--hairline)] outline-none focus-visible:shadow-[inset_0_0_0_1.5px_var(--accent)]";

  return (
    <main className="grid min-h-[100dvh] place-items-center px-5">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5">
        <h1 className="type-title">Admin.</h1>
        <div className="flex flex-col gap-2">
          <label htmlFor="adm-user" className="text-[0.9rem] font-[560]">Username</label>
          <input id="adm-user" name="username" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className={field} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="adm-pass" className="text-[0.9rem] font-[560]">Password</label>
          <input id="adm-pass" name="password" required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </div>
        {error && <p className="text-[0.9rem] text-danger" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

function Dashboard({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [rows, setRows] = useState<Visit[] | null>(null);

  useEffect(() => {
    fetch("/api-proxy/api/traffic", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401 || r.status === 403) throw new Error("expired");
        return r.json();
      })
      .then(setRows)
      .catch(() => onExpired());
  }, [token, onExpired]);

  return (
    <main className="px-5 py-16 md:px-10">
      <h1 className="type-title">Traffic.</h1>
      {rows === null ? (
        <p className="mt-8 text-muted">Loading visits…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-muted">No visits recorded yet.</p>
      ) : (
        <div className="mt-10 overflow-x-auto rounded-[16px] shadow-[inset_0_0_0_1px_var(--hairline)]">
          <table className="w-full min-w-[900px] text-left text-[0.9rem]">
            <thead className="type-meta text-muted">
              <tr>
                {["IP address", "City", "Region", "Country", "Path", "Method", "Device", "Time (Bangkok)"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((v, i) => (
                <tr key={i} className="border-t border-hairline">
                  <td className="px-4 py-3 font-mono">{v.ip}</td>
                  <td className="px-4 py-3">{v.city}</td>
                  <td className="px-4 py-3">{v.region}</td>
                  <td className="px-4 py-3">{v.country}</td>
                  <td className="px-4 py-3 font-mono">{v.path}</td>
                  <td className="px-4 py-3 font-mono">{v.method}</td>
                  <td className="px-4 py-3">{v.device}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{v.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  if (!token) return <Login onToken={setToken} />;
  return (
    <Dashboard
      token={token}
      onExpired={() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }}
    />
  );
}
