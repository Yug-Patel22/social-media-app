import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import api, { withClerkHeader } from "../lib/api";
import { connectSocket } from "../lib/socket";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user, isSignedIn } = useUser();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [profileError, setProfileError] = useState("");
  const [unreadByUser, setUnreadByUser] = useState({});

  const fetchMe = useCallback(async (clerkId) => {
    const { data } = await api.get("/users/me", withClerkHeader(clerkId));
    setMe(data);
    return data;
  }, []);

  const runSync = useCallback(async () => {
    if (!isSignedIn || !user) {
      setMe(null);
      setProfileError("");
      setUnreadByUser({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setProfileError("");

    const payload = {
      username: user.username || "",
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      avatarUrl: user.imageUrl || ""
    };

    try {
      await api.post("/auth/sync", payload, withClerkHeader(user.id));
    } catch (error) {
      console.error("Profile sync request failed", error?.response?.data || error.message);
    }

    try {
      const current = await fetchMe(user.id);
      const s = connectSocket(current._id);

      s.off("follow:update");
      s.on("follow:update", (evt) => setNotifications((prev) => [evt, ...prev].slice(0, 20)));

      s.off("chat:new_message");
      s.on("chat:new_message", (msg) => {
        const senderId = String(msg?.sender?._id || msg?.sender || "");
        if (senderId && senderId !== String(current._id)) {
          setUnreadByUser((prev) => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
          setNotifications((prev) => [{ type: "new_message", from: msg.sender }, ...prev].slice(0, 20));
        }
      });

      setProfileError("");
    } catch (error) {
      console.error("Failed to load profile", error?.response?.data || error.message);
      setMe(null);
      setProfileError(error?.response?.data?.message || "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user, fetchMe]);

  useEffect(() => {
    runSync();
  }, [runSync]);

  const refreshMe = async () => {
    if (!user?.id) return null;
    return fetchMe(user.id);
  };

  const clearUserUnread = (userId) => {
    const key = String(userId || "");
    if (!key) return;
    setUnreadByUser((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const unreadMessageCount = useMemo(
    () => Object.values(unreadByUser).reduce((sum, n) => sum + Number(n || 0), 0),
    [unreadByUser]
  );

  const value = useMemo(
    () => ({
      me,
      clerkId: user?.id,
      loading,
      notifications,
      setNotifications,
      signedIn: isSignedIn,
      refreshMe,
      profileError,
      retryProfileLoad: runSync,
      unreadByUser,
      unreadMessageCount,
      clearUserUnread
    }),
    [
      me,
      user,
      loading,
      notifications,
      isSignedIn,
      fetchMe,
      profileError,
      runSync,
      unreadByUser,
      unreadMessageCount
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
