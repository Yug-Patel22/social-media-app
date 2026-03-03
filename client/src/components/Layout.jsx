import { NavLink } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/create", label: "Create" },
  { to: "/chat", label: "Messages" }
];

const formatNote = (note) => {
  if (note.type === "follow_request") return "New follow request";
  if (note.type === "request_response") return `Request ${note.status}`;
  if (note.type === "new_follower") return "New follower";
  if (note.type === "new_message") return "New message received";
  return note.type;
};

export default function Layout({ children, notifications, me, unreadMessageCount }) {
  return (
    <div className="app-shell">
      <aside className="left-nav">
        <h1 className="brand">PulseGram</h1>
        <nav className="menu">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="nav-link"
            >
              <span>{item.label}</span>
              {item.to === "/chat" && unreadMessageCount > 0 ? (
                <span className="nav-badge">{unreadMessageCount > 9 ? "9+" : unreadMessageCount}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="account-row">
          <span>@{me?.username || "user"}</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>

      <main className="content">{children}</main>

      <aside className="right-rail">
        <section className="rail-card">
          <h4>Account</h4>
          <div className="account-preview-row">
            <img src={me?.avatarUrl || "https://placehold.co/96x96?text=User"} alt={me?.username || "user"} className="account-preview-avatar" />
            <div>
              <strong>@{me?.username || "user"}</strong>
              <p className="muted">{me?.fullName || "Complete your profile"}</p>
            </div>
          </div>
          <p className="muted">{me?.bio || "Add bio from profile settings"}</p>
        </section>

        <section className="rail-card">
          <h4>Live Activity {unreadMessageCount > 0 ? <span className="live-dot" /> : null}</h4>
          <ul className="notif-list">
            {notifications.length === 0 ? <li className="muted">No updates yet</li> : null}
            {notifications.slice(0, 8).map((n, i) => (
              <li key={`${n.type}-${i}`}>{formatNote(n)}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
