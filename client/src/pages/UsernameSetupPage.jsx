import { useMemo, useState } from "react";
import api, { withClerkHeader } from "../lib/api";
import { useApp } from "../context/AppContext";

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 20);

export default function UsernameSetupPage() {
  const { clerkId, me, refreshMe } = useApp();
  const [username, setUsername] = useState(me?.username || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => normalize(username), [username]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (preview.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    try {
      setSaving(true);
      await api.patch("/users/me", { username: preview }, withClerkHeader(clerkId));
      await refreshMe();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not set username.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="username-setup-wrap">
      <form className="username-setup-card" onSubmit={submit}>
        <h2>Choose your unique username</h2>
        <p>This is how other users will find and mention you.</p>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. yugpatel"
          autoFocus
        />

        <small>Preview: @{preview || "username"}</small>
        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Continue"}</button>
      </form>
    </div>
  );
}
