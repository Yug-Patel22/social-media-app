import { useEffect, useState } from "react";
import dayjs from "dayjs";
import api, { withClerkHeader } from "../lib/api";

export default function CreatePage({ clerkId }) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [myPosts, setMyPosts] = useState([]);

  const loadMyPosts = async () => {
    const { data } = await api.get("/posts/me", withClerkHeader(clerkId));
    setMyPosts(data);
  };

  useEffect(() => {
    if (clerkId) loadMyPosts();
  }, [clerkId]);

  const uploadPost = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      fd.append("caption", caption || "");

      await api.post("/posts", fd, {
        ...withClerkHeader(clerkId),
        headers: { ...withClerkHeader(clerkId).headers, "Content-Type": "multipart/form-data" }
      });

      setCaption("");
      setFile(null);
      e.target.reset();
      await loadMyPosts();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="create-page premium-create-page">
      <section className="post-create-card">
        <div className="post-create-head">
          <h2>Create Post</h2>
          <p>Share a moment with your followers using a clean image post.</p>
        </div>

        <form className="post-create-form" onSubmit={uploadPost}>
          <label className="upload-zone">
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <span>{file ? file.name : "Select an image for your post"}</span>
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a beautiful caption..."
            rows={4}
          />

          <button type="submit" disabled={uploading}>{uploading ? "Publishing..." : "Publish Post"}</button>
        </form>
      </section>

      <section className="stories-history-card">
        <h3>Your Previous Posts</h3>
        <div className="stories-history-grid">
          {myPosts.length === 0 ? <p className="muted">No posts created yet.</p> : null}
          {myPosts.map((post) => (
            <article key={post._id} className="story-history-item">
              <img src={post.imageUrl} alt={`Post by ${post.author?.username || "you"}`} />
              <div>
                <strong>@{post.author?.username || "you"}</strong>
                <small>{dayjs(post.createdAt).format("DD MMM, hh:mm A")}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
