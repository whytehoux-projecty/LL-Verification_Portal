import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { LawyerDashboard } from './pages/LawyerDashboard';
import { ClientLogin } from './pages/ClientLogin';
import { LiveKitRoom } from './components/LiveKitRoom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/client-login" element={<ClientLogin onJoin={() => { }} />} />

        {/* Protected Lawyer Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<LawyerDashboard />} />
          <Route path="/room/:token" element={<LiveKitRoomWrapper />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Wrapper to extract token from params and pass to LiveKitRoom
import { useParams } from 'react-router-dom';

const LiveKitRoomWrapper = () => {
  const { token } = useParams<{ token: string }>();
  // In a real app, we might decode the token to get role/name, or pass it via state.
  // For now, let's assume the token is valid and we just pass it.
  // We also need to know the room name, which is usually in the token, but LiveKitRoom component 
  // currently takes roomName. 
  // Let's update LiveKitRoom to accept just a token, or we need to fetch room details.
  // Actually, LiveKitRoom needs a token to connect. The room name is part of the token claim.

  return (
    <LiveKitRoom
      token={token || ''}
    // We might not need roomName if we have the token, but the component might expect it for display.
    // Let's check LiveKitRoom implementation next.
    />
  );
};

export default App;