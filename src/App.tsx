import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthCallback from './AuthCallback';
import Auth2 from './Auth2';
import {supabase} from './supabase-client';
import TabComponent from './TabComponent';
import LandingPage from './LandingPage';
import { Analytics } from "@vercel/analytics/react"


function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const storedSession = sessionStorage.getItem('supabaseSession');
    if (storedSession){
      const parsed = JSON.parse(storedSession);
      supabase.auth.setSession(parsed);
      setSession(parsed);
    }

    //listen to auth state changes (login, logout, etc.)

    const {data:listener} = supabase.auth.onAuthStateChange((_event, session) => {
      if (session){
        sessionStorage.setItem('supabaseSession', JSON.stringify(session));
      }else {
        sessionStorage.removeItem('supabaseSession');
      }
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    }
  }, []);

  return (
    <>
    
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth2 />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<TabComponent />} />
          {/* Add more routes as needed */}
        </Routes>
      </Router>
      <Analytics/>
      
    </>
  )
}

export default App
