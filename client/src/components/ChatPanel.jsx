import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import api, { withClerkHeader } from "../lib/api";
import { getSocket } from "../lib/socket";
import FriendsList from "./FriendsList";

export default function ChatPanel({
  clerkId,
  conversations,
  friends,
  meId,
  unreadByUser = {},
  clearUserUnread,
  initialUserId
}) {
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");

  const mergedConversations = useMemo(() => {
    const map = new Map();

    conversations.forEach((c) => {
      map.set(String(c.user._id), c);
    });

    friends.forEach((f) => {
      const key = String(f._id);
      if (!map.has(key)) {
        map.set(key, { user: f, lastMessage: null });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.user.username.localeCompare(b.user.username);
    });
  }, [conversations, friends]);

  useEffect(() => {
    if (!initialUserId || mergedConversations.length === 0) return;
    const target = mergedConversations.find((c) => String(c.user._id) === String(initialUserId));
    if (target) {
      setActive(target);
      clearUserUnread?.(target.user._id);
      api.get(`/chat/${target.user._id}`, withClerkHeader(clerkId)).then(({ data }) => setMessages(data));
    }
  }, [initialUserId, mergedConversations, clerkId, clearUserUnread]);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const onMessage = (msg) => {
      if (!active) return;
      const senderId = String(msg.sender?._id || msg.sender || "");
      const receiverId = String(msg.receiver?._id || msg.receiver || "");
      const activeUserId = String(active.user._id);
      const involvesActive = [senderId, receiverId].includes(activeUserId);

      if (involvesActive) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });

        if (senderId === activeUserId) {
          clearUserUnread?.(activeUserId);
        }
      }
    };

    s.on("chat:new_message", onMessage);
    return () => s.off("chat:new_message", onMessage);
  }, [active, clearUserUnread]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return mergedConversations;
    return mergedConversations.filter((c) => c.user.username.toLowerCase().includes(q));
  }, [mergedConversations, search]);

  const openChat = async (item) => {
    setActive(item);
    clearUserUnread?.(item.user._id);
    const { data } = await api.get(`/chat/${item.user._id}`, withClerkHeader(clerkId));
    setMessages(data);
  };

  const openFriend = async (friend) => {
    await openChat({ user: friend, lastMessage: null });
  };

  const send = async () => {
    if (!active || !text.trim()) return;
    const payload = text;
    setText("");
    await api.post(`/chat/${active.user._id}`, { text: payload }, withClerkHeader(clerkId));
  };

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <h3>Messages</h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversation"
        />

        <FriendsList
          friends={friends}
          activeUserId={active?.user?._id}
          onSelect={openFriend}
          unreadByUser={unreadByUser}
        />

        <div className="chat-list">
          {filtered.map((c) => {
            const unread = unreadByUser[String(c.user._id)] || 0;
            return (
              <button
                key={c.user._id}
                className={`chat-item ${active?.user?._id === c.user._id ? "active" : ""}`}
                onClick={() => openChat(c)}
              >
                <span className="chat-name-row">
                  <span className="chat-name">@{c.user.username}</span>
                  {unread > 0 ? <span className="chat-unread-badge">{unread > 9 ? "9+" : unread}</span> : null}
                </span>
                <span className="chat-last">{c.lastMessage?.text || "Start chat"}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="chat-main">
        <header className="chat-header">
          <strong>{active ? `@${active.user.username}` : "Select a conversation"}</strong>
        </header>

        <div className="messages-wrap">
          {messages.map((m) => {
            const mine = String(m.sender?._id || m.sender) === String(meId);
            return (
              <div key={m._id} className={`bubble-row ${mine ? "mine" : "theirs"}`}>
                <div className="bubble">
                  <p>{m.text}</p>
                  <small>{dayjs(m.createdAt).format("hh:mm A")}</small>
                </div>
              </div>
            );
          })}
        </div>

        {active ? (
          <div className="chat-compose">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message"
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button onClick={send}>Send</button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
