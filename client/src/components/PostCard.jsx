import { useMemo, useState } from "react";

export default function PostCard({ post, onLike, onComment, meId }) {
  const [text, setText] = useState("");

  const likedByMe = useMemo(
    () => post.likes?.some((id) => String(id) === String(meId)),
    [post.likes, meId]
  );

  return (
    <article className="post-card">
      <header className="post-head">
        <img src={post.author.avatarUrl || post.imageUrl} alt={post.author.username} />
        <div>
          <strong>@{post.author.username}</strong>
          <p>{post.author.fullName || "PulseGram user"}</p>
        </div>
      </header>

      <img src={post.imageUrl} alt={post.caption || "post"} className="post-media" />

      <div className="post-actions enhanced-actions">
        <button className={`like-btn ${likedByMe ? "liked" : ""}`} onClick={() => onLike(post._id)}>
          <span className="heart-icon">{likedByMe ? "♥" : "♡"}</span>
          <span>{post.likes?.length || 0} likes</span>
        </button>
      </div>

      {post.caption ? <p className="post-caption"><strong>@{post.author.username}</strong> {post.caption}</p> : null}

      <form
        className="comment-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onComment(post._id, text);
          setText("");
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment" />
        <button type="submit">Post</button>
      </form>
    </article>
  );
}
