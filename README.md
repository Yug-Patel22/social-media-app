# Social Media Platform (MERN + Clerk + Socket.IO)

Instagram-inspired (not cloned) social app with:
- Auth: Clerk
- Backend: Node.js + Express + MongoDB Atlas + Socket.IO
- Frontend: React (Vite) + JavaScript
- Media storage: Cloudinary (free tier)
- Features: stories, posts, private account follow requests (request/accept), real-time chat for connected users

## 1. Project Structure

- `server`: Express API + Socket server
- `client`: React Vite app

## 2. Setup

### Install dependencies
```bash
npm install
npm install --workspace server
npm install --workspace client
```

### Server env (`server/.env`)
Use `server/.env.example`.

### Client env (`client/.env`)
Use `client/.env.example`.

## 3. Run

```bash
npm run dev:server
npm run dev:client
```

Server default: `http://localhost:5000`
Client default: `http://localhost:5173`

## 4. Important Clerk Notes

This template uses Clerk on the frontend and expects `x-clerk-id` header for API authorization in dev mode.
For production-grade security, switch `x-clerk-id` flow to JWT verification using Clerk session tokens.

## 5. Core Flows

1. Sign in with Clerk.
2. Client calls `POST /api/auth/sync` to create/update MongoDB user profile.
3. Create stories/posts with Cloudinary upload.
4. For private users: follow sends request, recipient accepts/rejects.
5. Chat allowed only for users with an accepted follow relationship.
