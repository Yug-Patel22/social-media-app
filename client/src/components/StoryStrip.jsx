import { useRef } from "react";

export default function StoryStrip({ stories, me, onAddStory, onOpenStory }) {
  const fileInputRef = useRef(null);

  const latestByUser = Object.values(
    stories.reduce((acc, story) => {
      const key = String(story.author?._id || story.author?.username);
      if (!acc[key] || new Date(story.createdAt) > new Date(acc[key].createdAt)) {
        acc[key] = story;
      }
      return acc;
    }, {})
  );

  const myStory = latestByUser.find((s) => String(s.author?._id) === String(me?._id));
  const myAvatar = me?.avatarUrl || myStory?.mediaUrl || "";

  return (
    <section className="stories" aria-label="Stories">
      <article
        className="story-item story-own"
        title={myStory ? "View your story" : "Add your story"}
        onClick={() => {
          if (myStory) onOpenStory(String(me?._id));
          else fileInputRef.current?.click();
        }}
      >
        <div className="story-ring own-ring">
          {myAvatar ? <img src={myAvatar} alt="Your story" /> : <div className="story-fallback">You</div>}
          <button
            className="story-plus"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            aria-label="Add story"
          >
            +
          </button>
        </div>
        <p>Your story</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAddStory(file);
            e.target.value = "";
          }}
        />
      </article>

      {latestByUser
        .filter((story) => String(story.author?._id) !== String(me?._id))
        .map((story) => (
          <article
            key={story._id}
            className="story-item"
            title={`@${story.author.username}`}
            onClick={() => onOpenStory(String(story.author?._id))}
          >
            <div className="story-ring">
              <img src={story.author.avatarUrl || story.mediaUrl} alt={story.author.username} />
            </div>
            <p>@{story.author.username}</p>
          </article>
        ))}
    </section>
  );
}
