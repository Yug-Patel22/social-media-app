import { Navigate, Route, Routes, Link } from "react-router-dom";
import { SignedIn, SignedOut, SignIn, SignUp } from "@clerk/clerk-react";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import FeedPage from "./pages/FeedPage";
import ExplorePage from "./pages/ExplorePage";
import ChatPage from "./pages/ChatPage";
import CreatePage from "./pages/CreatePage";
import UsernameSetupPage from "./pages/UsernameSetupPage";
import BioSetupPage from "./pages/BioSetupPage";

function SignedInApp() {
  const {
    clerkId,
    notifications,
    loading,
    me,
    profileError,
    retryProfileLoad,
    unreadMessageCount
  } = useApp();

  if (loading) return <div className="center">Loading...</div>;

  if (!me) {
    return (
      <div className="center">
        <div className="profile-error-card">
          <h3>Could not load profile</h3>
          <p>{profileError || "We could not fetch your user profile."}</p>
          <button onClick={retryProfileLoad}>Retry</button>
        </div>
      </div>
    );
  }

  if (!me.usernameSet) {
    return <UsernameSetupPage />;
  }

  if (me.bioPromptDone === false) {
    return <BioSetupPage />;
  }

  return (
    <Layout
      notifications={notifications}
      me={me}
      unreadMessageCount={unreadMessageCount}
    >
      <Routes>
        <Route path="/" element={<FeedPage clerkId={clerkId} me={me} />} />
        <Route path="/explore" element={<ExplorePage clerkId={clerkId} meId={me._id} />} />
        <Route path="/create" element={<CreatePage clerkId={clerkId} />} />
        <Route path="/chat" element={<ChatPage clerkId={clerkId} me={me} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function Landing() {
  return (
    <div className="landing">
      <div className="hero">
        <p className="eyebrow">Real-time Social App</p>
        <h1>PulseGram</h1>
        <p>Stories, posts, private follow requests, and live chat with connected followers.</p>
        <div className="hero-actions">
          <Link to="/sign-in" className="btn-link">Sign In</Link>
          <Link to="/sign-up" className="btn-link ghost-link">Create Account</Link>
        </div>
      </div>
    </div>
  );
}

function PublicAuth() {
  return (
    <div className="auth-wrap">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SignedOut>
        <PublicAuth />
      </SignedOut>
      <SignedIn>
        <SignedInApp />
      </SignedIn>
    </AppProvider>
  );
}
