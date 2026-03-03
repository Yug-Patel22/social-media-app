import { useMemo, useState, useEffect } from "react";
import api, { withClerkHeader } from "../lib/api";
import StoryStrip from "../components/StoryStrip";
import PostCard from "../components/PostCard";

export default function FeedPage({ clerkId, me }) {
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [viewerUserId, setViewerUserId] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const load = async () => {
    const [s, p] = await Promise.all([
      api.get("/stories", withClerkHeader(clerkId)),
      api.get("/posts/feed", withClerkHeader(clerkId))
    ]);
    setStories(s.data);
    setPosts(p.data);
  };

  useEffect(() => {
    if (clerkId) load();
  }, [clerkId]);

  const addStoryFromHome = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    await api.post("/stories", fd, {
      ...withClerkHeader(clerkId),
      headers: { ...withClerkHeader(clerkId).headers, "Content-Type": "multipart/form-data" }
    });
    load();
  };

  const likePost = async (postId) => {
    await api.post(`/posts/${postId}/like`, {}, withClerkHeader(clerkId));
    load();
  };

  const addComment = async (postId, text) => {
    await api.post(`/posts/${postId}/comment`, { text }, withClerkHeader(clerkId));
    load();
  };

  const storiesByUser = useMemo(() => {
    return stories.reduce((acc, story) => {
      const key = String(story.author?._id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(story);
      return acc;
    }, {});
  }, [stories]);

  const activeStoryList = useMemo(() => {
    if (!viewerUserId) return [];
    return [...(storiesByUser[viewerUserId] || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [viewerUserId, storiesByUser]);

  useEffect(() => {
    if (viewerIndex >= activeStoryList.length && activeStoryList.length > 0) {
      setViewerIndex(activeStoryList.length - 1);
    }
  }, [activeStoryList, viewerIndex]);

  const activeStory = activeStoryList[viewerIndex];

  return (
    <div className="feed-page">
      <StoryStrip
        stories={stories}
        me={me}
        onAddStory={addStoryFromHome}
        onOpenStory={(userId) => {
          setViewerUserId(userId);
          setViewerIndex(0);
        }}
      />

      <section className="posts-stack">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onLike={likePost} onComment={addComment} meId={me?._id} />
        ))}
      </section>

      {activeStory ? (
        <div className="story-viewer-overlay" onClick={() => setViewerUserId(null)}>
          <div className="story-viewer-card" onClick={(e) => e.stopPropagation()}>
            <header className="story-viewer-head">
              <strong>@{activeStory.author.username}</strong>
              <button className="story-close" onClick={() => setViewerUserId(null)}>Close</button>
            </header>

            <img src={activeStory.mediaUrl} alt={`Story by ${activeStory.author.username}`} className="story-viewer-media" />

            <div className="story-viewer-controls">
              <button
                className="ghost"
                disabled={viewerIndex === 0}
                onClick={() => setViewerIndex((prev) => Math.max(0, prev - 1))}
              >
                Previous
              </button>
              <span>{viewerIndex + 1} / {activeStoryList.length}</span>
              <button
                disabled={viewerIndex === activeStoryList.length - 1}
                onClick={() => setViewerIndex((prev) => Math.min(activeStoryList.length - 1, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
