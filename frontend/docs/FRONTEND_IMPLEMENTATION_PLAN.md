# Frontend Implementation Plan

**Goal:** Transform the current high-fidelity Vite prototype into a fully functional production application connected to the FastAPI backend and LiveKit infrastructure.

**Reference Documents:**

- `docs/frontend.md` (Design System)
- `docs/comprehensive-plan.md` (Architecture)
- `REPORT.md` (Current Status)

## 1. Architecture & Tech Stack

We will maintain the current **Vite + React** setup (as per the prototype) but refactor the internal logic to match the production requirements.

- **Framework:** Vite + React (SPA)
- **State Management:** Zustand (replacing local state)
- **API Client:** Axios (connecting to FastAPI)
- **Real-time:** LiveKit SDK (`livekit-client`, `@livekit/components-react`)
- **Styling:** Tailwind CSS + Framer Motion (existing)

## 2. Phase 1: Foundation & Infrastructure

### 1.1 Dependencies

Install required production libraries:

```bash
npm install livekit-client @livekit/components-react axios zustand jwt-decode clsx tailwind-merge
```

### 1.2 Environment Configuration

Create `.env` for frontend configuration:

```env
VITE_API_URL=http://localhost:8000/api
VITE_LIVEKIT_URL=ws://localhost:7880
```

### 1.3 API Client Setup

Create `src/services/api.ts`:

- Axios instance with base URL.
- Request interceptor to inject JWT token from `localStorage`.
- Response interceptor for error handling (401 redirects).

### 1.4 State Management (Zustand)

Create `src/store/useAuthStore.ts`:

- Manage `user`, `token`, `isAuthenticated`.
- Actions: `login`, `logout`.

Create `src/store/useSessionStore.ts`:

- Manage `sessions` list, `currentSession`.
- Actions: `fetchSessions`, `createSession`, `uploadScript`.

## 3. Phase 2: Authentication & Dashboard

### 2.1 Authentication Flow

- **Refactor Login Page:**
  - Connect form submission to `useAuthStore.login`.
  - Handle success/error states.
  - Redirect to `/dashboard` on success.
- **Protected Routes:**
  - Create `ProtectedRoute` component.
  - Wrap dashboard and room routes.

### 2.2 Dashboard Logic

- **Session List:**
  - Fetch real data from `GET /api/sessions`.
  - Replace mock data in `LawyerDashboard.tsx`.
- **Create Session:**
  - Connect "New Verification" modal to `POST /api/sessions`.
- **Script Upload:**
  - Implement file upload to `POST /api/sessions/{id}/script`.
  - Show upload progress and success state.

## 4. Phase 3: LiveKit Integration (The Core)

### 3.1 Room Connection

- **Start Interview:**
  - Call `POST /api/sessions/{id}/start` to get the LiveKit token.
  - Redirect to `/room/{token}` (or pass token via state).
- **LiveKit Provider:**
  - Wrap the room component with `<LiveKitRoom>`.
  - Pass `token` and `serverUrl`.

### 3.2 Real-time Components

- **Refactor `LiveKitRoom.tsx`:**
  - Remove `SIMULATED_CONVERSATION`.
  - Use `useTracks` to get video/audio tracks.
  - Use `useParticipants` to list users.
- **AI Participant Tile:**
  - Identify the AI participant (e.g., by identity or metadata).
  - Implement `AIParticipantTile` using `useAudioTrack` to drive the visualizer (Framer Motion bars) based on real audio volume.
- **Video Grid:**
  - Render `VideoTrack` for Bride and Groom.

### 3.3 Data Sync (Script Progress)

- Listen for LiveKit **Data Packets** from the backend (AI Agent).
- Update the "Script Tracker" UI when the agent sends a "current_step" update.

## 5. Phase 4: Polish & Deployment

### 5.1 Error Handling

- Add toast notifications (Sonner/Toaster) for API errors.
- Handle network disconnections in the room.

### 5.2 Dockerization

- Create `Dockerfile` for the frontend (Multi-stage build).
  - Stage 1: Build (npm run build).
  - Stage 2: Serve (Nginx).
- Update `docker-compose.yml` to include the frontend service.

## 6. Implementation Checklist

- [ ] **Setup**: Install dependencies & configure Axios.
- [ ] **Auth**: Implement Login & Protected Routes.
- [ ] **Dashboard**: Connect Session List & Create Session API.
- [ ] **Upload**: Implement Script Upload API.
- [ ] **Room**: Replace mocks with `LiveKitRoom` & `VideoTrack`.
- [ ] **AI UI**: Build reactive `AIParticipantTile`.
- [ ] **Docker**: Add Nginx Dockerfile.

## 7. Migration Strategy (Vite vs Next.js)

*Note: The original plan mentioned Next.js, but the prototype is in Vite. To accelerate delivery, we will complete the MVP in Vite. Migration to Next.js can be done in a future phase if Server-Side Rendering (SSR) becomes a requirement.*
