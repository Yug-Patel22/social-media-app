import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { withClerkHeader } from "../lib/api";
import ChatPanel from "../components/ChatPanel";
import { useApp } from "../context/AppContext";

export default function ChatPage({ clerkId, me }) {
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const { unreadByUser, clearUserUnread } = useApp();
  const [searchParams] = useSearchParams();

  const initialUserId = searchParams.get("userId");

  const load = async () => {
    const [convRes, friendsRes] = await Promise.all([
      api.get("/chat/conversations", withClerkHeader(clerkId)),
      api.get("/users/friends", withClerkHeader(clerkId))
    ]);

    setConversations(convRes.data);
    setFriends(friendsRes.data);
  };

  useEffect(() => {
    if (clerkId) load();
  }, [clerkId]);

  return (
    <ChatPanel
      clerkId={clerkId}
      conversations={conversations}
      friends={friends}
      meId={me?._id}
      unreadByUser={unreadByUser}
      clearUserUnread={clearUserUnread}
      initialUserId={initialUserId}
    />
  );
}
