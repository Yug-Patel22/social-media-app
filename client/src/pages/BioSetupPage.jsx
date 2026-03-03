import { useEffect, useState } from "react";
import api, { withClerkHeader } from "../lib/api";
import { useApp } from "../context/AppContext";

export default function BioSetupPage() {
  const { clerkId, refreshMe, me } = useApp();
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return undefined;
    }

    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const uploadAvatarIfNeeded = async () => {
    if (!avatarFile) return;
    const fd = new FormData();
    fd.append("image", avatarFile);
    await api.post("/users/me/avatar", fd, {
      ...withClerkHeader(clerkId),
      headers: { ...withClerkHeader(clerkId).headers, "Content-Type": "multipart/form-data" }
    });
  };

  const skip = async () => {
    try {
      setSaving(true);
      setError("");
      await uploadAvatarIfNeeded();
      await api.patch("/users/me", { bioPromptDone: true }, withClerkHeader(clerkId));
      await refreshMe();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not skip right now.");
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!bio.trim() && !avatarFile) return;

    try {
      setSaving(true);
      setError("");
      await uploadAvatarIfNeeded();
      await api.patch("/users/me", { bio: bio.trim(), bioPromptDone: true }, withClerkHeader(clerkId));
      await refreshMe();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save profile setup.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bio-setup-wrap">
      <form className="bio-setup-card" onSubmit={submit}>
        <h2>Set up profile photo and bio</h2>
        <p>Use your default photo or upload a new one. Bio is optional.</p>

        <div className="bio-avatar-block">
          <img
            src={avatarPreview || me?.avatarUrl || "https://placehold.co/120x120?text=User"}
            alt="Profile preview"
            className="bio-avatar-preview"
          />
          <label className="avatar-upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            />
            {avatarFile ? "Selected" : "Upload New Photo"}
          </label>
        </div>

        <textarea
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Photographer | Developer | Traveler..."
        />

        {error ? <p className="error-text">{error}</p> : null}

        <div className="bio-actions">
          <button type="button" className="ghost" onClick={skip} disabled={saving}>Skip</button>
          <button type="submit" disabled={saving || (!bio.trim() && !avatarFile)}>{saving ? "Saving..." : "Save & Continue"}</button>
        </div>
      </form>
    </div>
  );
}
