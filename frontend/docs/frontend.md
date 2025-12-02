# Frontend Documentation

**Last Updated:** 2025-12-02

This document provides a high-level overview of the frontend system for the LexNova Legal platform. For a complete and detailed analysis of the architecture, please refer to the main project review document.

**[Comprehensive Project Review](../../docs/COMPREHENSIVE_REVIEW.md)**

---

## 1. Technology Stack

-   **Framework:** React 18 with TypeScript and Vite
-   **Styling:** Tailwind CSS
-   **Routing:** `react-router-dom`
-   **State Management:** Zustand
-   **API Communication:** Axios
-   **Real-Time:** `@livekit/components-react` and `livekit-client`

## 2. Architecture & User Flow

The frontend is a single-page application (SPA) that provides two distinct experiences based on user type.

### a. Lawyer Experience

1.  **Login:** Lawyers authenticate through a secure login portal at `/login`.
2.  **Dashboard:** After logging in, they are directed to the `/dashboard`. This is the central hub where they can:
    -   Create new verification sessions for clients.
    -   Configure the AI agent's behavior (voice, strictness).
    -   Upload legal scripts for each session.
    -   View the status of all sessions.
    -   Start or join live sessions.
3.  **Supervisor UI:** When joining a live session, the lawyer enters a "God Mode" interface. This UI allows them to watch the participants and the AI agent, view a live transcript, and see the agent's progress through the script in real-time.

### b. Client Experience

1.  **Join:** Clients (e.g., bride and groom) access the application via the `/client-login` page.
2.  **Authentication:** They enter the 6-character `session_code` provided by their lawyer, along with their name and role.
3.  **Enter Room:** Upon successful authentication, they are immediately navigated into the LiveKit audio/video room to await the start of the session.

## 3. State Management

Global application state is managed by two primary `zustand` stores:

-   `useAuthStore`: Manages the lawyer's authentication token and user profile. It persists state to `localStorage` to keep the user logged in.
-   `useSessionStore`: Manages all data and API interactions related to sessions. It provides functions for fetching, creating, and updating sessions, ensuring the UI is always reactive to data changes.

## 4. Key Components

-   `Login.tsx` / `ClientLogin.tsx`: Separate, tailored authentication forms.
-   `LawyerDashboard.tsx`: A complex, feature-rich component for all session management tasks.
-   `LiveKitRoom.tsx`: The core real-time component. It not only renders the video/audio call but also includes the sophisticated "supervisor" panel, which listens for and displays data sent from the AI agent over the LiveKit data channel.