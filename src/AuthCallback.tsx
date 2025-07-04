import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase-client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase already saves the session in localStorage/sessionStorage
    const storedSession = sessionStorage.getItem("supabaseSession");

    if (!storedSession) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          sessionStorage.setItem("supabaseSession", JSON.stringify(data.session));
          navigate("/dashboard");
        } else {
          navigate("/auth");
        }
      });
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="p-6">Signing you in...</div>
    </div>
);
};

export default AuthCallback;
