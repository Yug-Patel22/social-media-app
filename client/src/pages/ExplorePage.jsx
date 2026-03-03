import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { withClerkHeader } from "../lib/api";

export default function ExplorePage({ clerkId, meId }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();

  const friendIds = useMemo(() => new Set(friends.map((f) => String(f._id))), [friends]);

  const search = async (value) => {
    const q = String(value || "").trim();
    if (!q) {
      setUsers([]);
      return;
    }

    const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`, withClerkHeader(clerkId));
    setUsers(data.filter((u) => String(u._id) !== String(meId)));
  };

  const loadPending = async () => {
    const { data } = await api.get("/users/follow/pending", withClerkHeader(clerkId));
    setPending(data);
  };

  const loadFriends = async () => {
    const { data } = await api.get("/users/friends", withClerkHeader(clerkId));
    setFriends(data);
  };

  useEffect(() => {
    if (clerkId) {
      loadPending();
      loadFriends();
    }
  }, [clerkId]);

  useEffect(() => {
    if (!clerkId) return;
    const t = setTimeout(() => {
      search(query);
    }, 250);

    return () => clearTimeout(t);
  }, [query, clerkId, meId]);

  const follow = async (id) => {
    await api.post(`/users/follow/${id}`, {}, withClerkHeader(clerkId));
    search(query);
  };

  const respond = async (requestId, action) => {
    await api.post(`/users/follow/respond/${requestId}`, { action }, withClerkHeader(clerkId));
    loadPending();
    loadFriends();
  };

  return (
    <div className="explore-grid">
      <section className="card">
        <h2>Discover Users</h2>
        <div className="row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
          />
        </div>
        {query.trim() && users.length === 0 ? <p className="muted">No users found.</p> : null}
        {users.map((u) => {
          const isFriend = friendIds.has(String(u._id));
          return (
            <div key={u._id} className="user-row">
              <span>@{u.username}</span>
              {isFriend ? (
                <button onClick={() => navigate(`/chat?userId=${u._id}`)}>Message</button>
              ) : (
                <button onClick={() => follow(u._id)}>{u.isPrivate ? "Request" : "Follow"}</button>
              )}
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>Pending Requests</h2>
        {pending.map((r) => (
          <div key={r._id} className="user-row">
            <span>@{r.requester.username}</span>
            <div className="row">
              <button onClick={() => respond(r._id, "accepted")}>Accept</button>
              <button className="ghost" onClick={() => respond(r._id, "rejected")}>Reject</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
