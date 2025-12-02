# LexNova Legal: Comprehensive Testing Plan

**Version:** 1.0
**Date:** 2025-12-02

## 1. Introduction

This document outlines the testing strategy for the LexNova Legal platform. The goal is to establish a robust testing framework that ensures the application's reliability, correctness, and maintainability. The plan covers three primary areas of testing: Backend, Frontend, and End-to-End (E2E).

## 2. Recommended Tooling

-   **Backend:** [**Pytest**](https://pytest.org) with `pytest-asyncio` for asynchronous code, and FastAPI's `TestClient` for API endpoint testing.
-   **Frontend:** [**Vitest**](https://vitest.dev/) for running tests and [**React Testing Library**](https://testing-library.com/react) for rendering and interacting with components in a Node.js environment.
-   **End-to-End:** [**Playwright**](https://playwright.dev/) for its robust cross-browser support and ability to automate real user scenarios.

## 3. Backend Testing (Pytest)

The backend testing will be located in the `backend/tests/` directory.

### 3.1. Setup

-   A separate testing database should be used. The test suite should create and tear down this database to ensure tests are isolated and repeatable.
-   API tests will use the `TestClient` which wraps the FastAPI application and allows for sending requests without a live server.
-   External services, particularly the Gemini API, should be mocked using `unittest.mock.patch`.

### 3.2. Unit Tests

-   **`utils/`:**
    -   Test `session_codes.py` to ensure session code generation and validation logic is correct.
-   **`auth.py`:**
    -   Test password hashing and verification (`get_password_hash`, `verify_password`).
    -   Test JWT creation and decoding logic.
-   **`database.py` & `models.py`:**
    -   Test database model creation and relationships.
    -   Test individual CRUD operations (if abstracted into a repository/service layer).

### 3.3. Integration Tests (API Level)

These tests will simulate HTTP requests to the API endpoints and assert the responses.

-   **Auth Router (`/api/auth`):**
    -   Test user registration (`/register`) with valid and invalid data (e.g., duplicate email).
    -   Test user login (`/login`) with correct and incorrect credentials.
    -   Test the `/me` endpoint to ensure it returns the correct user for a given token.
-   **Sessions & Documents Routers:**
    -   Test the full session creation workflow: `POST /api/sessions` -> `POST /api/sessions/{id}/script`.
    -   Test that a session's status is correctly updated from `pending` to `ready` after script upload.
-   **Client Auth Router (`/api/client`):**
    -   Test `/api/client/join` with a valid session code, an expired code, and an invalid code.
    -   Test that the endpoint correctly generates a LiveKit token.
-   **Analysis Router (`/api/analyze-script`):**
    -   Test `POST /api/analyze-script` with valid script content.
    -   Mock the Gemini API call to return a predictable JSON response and assert that the endpoint formats it correctly.
    -   Test the endpoint's error handling if the Gemini call fails or returns malformed JSON.
-   **Reports Router (`/api/sessions/{id}/report`):**
    -   Create a session, add several mock transcript entries to the database, then call the report endpoint to verify that all data is returned correctly.

## 4. Frontend Testing (Vitest & React Testing Library)

Frontend tests will live alongside the source files (e.g., `MyComponent.test.tsx`).

### 4.1. Setup

-   Tests will be run in a Node.js environment using Vitest.
-   API calls made via `axios` will be mocked using a library like `msw` (Mock Service Worker) or Vitest's built-in mocking capabilities. This allows testing of components that fetch data without needing a live backend.

### 4.2. Unit / Component Tests

-   **`components/ui/`:** Test simple UI components like `Button.tsx` to ensure they render correctly and handle user interactions (e.g., `onClick`).
-   **`utils/`:** Test utility functions like `sanitize.ts`.
-   **`pages/` & `components/`:**
    -   Test that components render correctly based on different props.
    -   Test that `LawyerDashboard.tsx` correctly displays a list of sessions passed to it.
    -   Test that `SessionReport.tsx` correctly displays the details of a report object.

### 4.3. Integration Tests (Component Workflow)

-   **Login/Authentication:**
    -   Test the `Login.tsx` and `ClientLogin.tsx` forms. Simulate user input, mock the API call to return a successful or failed response, and assert that the application state (`useAuthStore`) and navigation (`useNavigate`) are updated correctly.
-   **Lawyer Dashboard Workflow:**
    -   Test the session creation modal in `LawyerDashboard.tsx`. Simulate filling out the form, uploading a file, and submitting. Mock the `createSession` and `uploadScript` API calls and verify that the session list is refreshed.
    -   Test the script analysis feature. Simulate uploading a file and clicking "Analyze", mock the `/api/analyze-script` endpoint, and assert that the analysis results are displayed correctly.

## 5. End-to-End Testing (Playwright)

E2E tests provide the highest level of confidence by simulating full user journeys in a real browser.

### 5.1. Setup

-   E2E tests will run against a fully running application stack (via `docker-compose up`).
-   Playwright will be configured to have a `baseURL` of `http://localhost:3000`.
-   A mechanism to reset the database state between test runs is crucial for consistency. This can be done via a script or a custom API endpoint.

### 5.2. Test Scenarios

-   **Lawyer Full Workflow:**
    1.  A user successfully registers a new lawyer account.
    2.  The user logs in with the new account and is redirected to the dashboard.
    3.  The user creates a new session for a "Groom" and "Bride".
    4.  The user uploads a PDF script for that session. The session status updates to `ready`.
    5.  The user clicks "Start" on the session and is redirected to the `/room/...` URL. (The test can assert the redirection without needing to fully test the LiveKit component itself).
-   **Client Join Workflow:**
    1.  (Setup): A session with a known `session_code` exists in the database.
    2.  A user navigates to the `/client-login` page.
    3.  The user enters the valid session code and a name.
    4.  The user clicks "Join" and is successfully redirected to the `/room/...` URL.
    5.  Test the inverse: a user with an invalid code sees an error message and is not redirected.
-   **Data Integrity Workflow:**
    1.  (Setup): A session is created.
    2.  The `agent.py` script is run manually or triggered.
    3.  Mock the agent saving transcript entries via the LLM function call (or test the full flow if feasible).
    4.  The lawyer navigates to the dashboard and clicks the "Report" button for the completed session.
    5.  Assert that the transcript entries saved in the database are correctly displayed on the report page.
