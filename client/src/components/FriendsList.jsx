export default function FriendsList({ friends, activeUserId, onSelect, unreadByUser = {} }) {
  return (
    <section className="friends-section">
      <h4>Friends</h4>
      <div className="friends-scroll">
        {friends.length === 0 ? <p className="muted">No friends yet</p> : null}
        {friends.map((friend) => {
          const unread = unreadByUser[String(friend._id)] || 0;
          return (
            <button
              key={friend._id}
              className={`friend-chip ${String(activeUserId) === String(friend._id) ? "active" : ""}`}
              onClick={() => onSelect(friend)}
            >
              <div className="friend-avatar-wrap">
                <img src={friend.avatarUrl || "https://placehold.co/80x80?text=U"} alt={friend.username} />
                {unread > 0 ? <span className="friend-unread-dot" /> : null}
              </div>
              <span>@{friend.username}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
