FRONTEND

This is a high-level frontend design for "VeriAuth AI."
The design philosophy focuses on "Invisible Complexity." It should look like a sleek, high-end legal tool (Dark Mode, Glassmorphism, Crisp Typography) that feels trustworthy, while the AI elements (Audio Visualizers) feel organic and responsive, mimicking the aesthetic of the ElevenLabs platform.

1. The Tech Stack (Frontend)
 • Framework: Next.js 14+ (App Router) - For server components and routing.
 • Styling: Tailwind CSS - Utility-first styling.
 • Component Library: Shadcn UI - For robust, accessible base components (Dialogs, inputs, dropdowns).
 • Video/Audio UI: LiveKit Components React - Pre-built WebRTC grids and control bars, styled to fit our theme.
 • Animations: Framer Motion - For smooth layout transitions and entry animations.
 • Audio Visualization: Framer Motion (Custom bars) or Wavesurfer.js - To visualize the AI speaking (The "ElevenLabs" look).
 • Icons: Lucide React - Clean, consistent iconography.
 • State Management: Zustand - For handling local room state (Mute status, current script step).

2. Design System & Aesthetic ("The ElevenLabs Vibe")
To achieve that modern AI look:
 • Color Palette:
 ◦ Background: bg-zinc-950 (Deep black/grey).
 ◦ Primary: text-white.
 ◦ Accents: A gradient of Violet-500 to Blue-500 (representing the AI).
 ◦ Borders: Very subtle border-zinc-800.
 • Typography: Geist Sans or Inter. Tight tracking, highly readable.
 • Visuals:
 ◦ Glassmorphism: Panels (like the script view) should have a slight backdrop-blur (backdrop-blur-md bg-black/40).
 ◦ The "Orb" or "Wave": The AI Participant isn't a face; it is a reactive waveform that pulses when the ElevenLabs TTS generates audio.

3. Core Page Architecture
A. The Lawyer Dashboard (/dashboard)
 • Layout: Sidebar navigation (Sessions, Scripts, Archive).
 • Main Area: A data table (Shadcn DataTable) listing upcoming marriages.
 • "Create Session" Modal:
 ◦ Script Upload: A specialized drag-and-drop zone (react-dropzone) that accepts PDF/JSON.
 ◦ Visual Feedback: When a file is uploaded, show a "Parsing..." skeleton loader, then display a preview of the extracted text.
B. The Verification Room (/room/[token])
This is the core experience. It is a Split-Screen Layout.
 • Left Panel (The Video Grid):
 ◦ Top: The AI Avatar (A pulsing waveform visualization).
 ◦ Middle: The Bride and Groom video feeds (Side by Side).
 ◦ Bottom: The Lawyer (Self-view, smaller).
 • Right Panel (The "God Mode" Control - Lawyer Only):
 ◦ Script Tracker: Highlights the current sentence the AI is speaking.
 ◦ Live Transcript: Real-time text stream from Deepgram.
 ◦ Intervention Controls: A big red "PAUSE AI" button and a "Manual Override" text input (if the lawyer wants to type a question for the AI to speak immediately).

4. Key Component Designs
1. The AIParticipantTile (The "Face" of the AI)
Instead of a webcam feed, the AI gets a specialized tile.
code Tsx
downloadcontent_copy
expand_less
    // Using Framer Motion for the "ElevenLabs" style equalizer
const AIParticipantTile = ({ isSpeaking, volume }) => {
  return (
    <div className="relative flex items-center justify-center w-full h-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-violet-500/10 blur-3xl" />

      {/*The Visualizer*/}
      <div className="flex gap-1 items-center h-12">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 bg-gradient-to-t from-violet-500 to-blue-500 rounded-full"
            animate={{
              height: isSpeaking ? [10, 40, 15, 50, 10] : 8, // Randomize based on volume
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatType: "mirror",
              delay: i * 0.1
            }}
          />
        ))}
      </div>

      <span className="absolute bottom-4 text-xs font-mono text-zinc-400">
        VERIAUTH AI AGENT • LISTENING
      </span>
    </div>

  );
};
  
2. The ScriptUploader (Document Intelligence)
A clean interface for the lawyer to prepare the AI.
 • UI: A dashed border area.
 • Interaction:
 1 Drag PDF.
 2 Show progress bar (Shadcn Progress).
 3 Critical Step: Display the parsed JSON structure in a Monaco Editor (or a nice readable list) so the lawyer can verify the questions before the meeting starts.
3. The LiveTranscriptOverlay
Text appearing in real-time as users speak.
 • UI: Floating text at the bottom of the video tile (Subtitle style) or a scrolling log in the sidebar.
 • Styling: bg-black/60 rounded-lg px-2 py-1 text-sm text-white backdrop-blur.

5. Frontend Implementation Plan
Phase 1: Setup & Shadcn Integration
 1 Initialize Next.js project.
 2 Install Shadcn UI: npx shadcn-ui@latest init.
 3 Add components: button, card, dialog, input, scroll-area, tabs, avatar.
 4 Setup LiveKit SDK: npm install livekit-client @livekit/components-react.
Phase 2: The Dashboard (Lawyer View)
 1 Build the Session List using Shadcn Table.
 2 Build the Upload Form:
 ◦ On upload -> POST /api/upload-script.
 ◦ On success -> Show the "Start Interview" button.
 3 Generate Magic Links for the couple.
Phase 3: The Video Room (WebRTC)
 1 Create the /room/[token] page.
 2 Wrap the page in LiveKitRoom provider.
 3 Custom Layout: Do not use the default LiveKit VideoConference component. Build a custom grid:
 ◦ Use useTracks hook to get video streams.
 ◦ Map tracks to custom tiles (<ParticipantTile />).
 ◦ Identify the AI participant by its identity (e.g., agent-bot) and render the <AIParticipantTile /> instead of a video element.
Phase 4: AI & Data integration
 1 State Syncing: Use LiveKit's "Data Packet" feature.
 ◦ When the Python backend decides to move to "Question 2", it sends a data packet.
 ◦ Frontend receives packet -> Updates the ScriptTracker component highlight to Question 2.
 2 Audio Viz: Hook the AI's audio track volume to the Framer Motion bars.
6. User Flow (Visual Walkthrough)
 1 Login: Lawyer logs in. Dark grey background, centered card, very minimal.
 2 Dashboard: A list of "Pending Verifications."
 3 Action: Lawyer clicks "New Verification."
 ◦ Drawer slides in from the right.
 ◦ Uploads script.pdf.
 ◦ System parses and shows: "Detected 5 questions."
 ◦ Lawyer clicks "Create."
 4 The Room (Waiting): Lawyer joins. Sees their own video. Sees a "Waiting for others..." placeholder.
 5 The Room (Active):
 ◦ Bride & Groom join (Standard video tiles).
 ◦ The AI joins: A sleek black tile appears with a glowing purple dot.
 ◦ Conversation: As the AI speaks (via ElevenLabs), the purple dot expands into a dynamic waveform. As the Bride speaks, her words appear as subtitles on the Lawyer's screen.
This design leverages existing robust tools (Shadcn/LiveKit) but customizes the presentation layer to feel like a bespoke AI product.
