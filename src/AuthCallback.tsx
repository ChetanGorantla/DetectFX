import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase-client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        console.error("No auth code found in URL.");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth error:", error.message);
        navigate("/auth");
        return;
      }

      if (data.session) {
        sessionStorage.setItem("supabaseSession", JSON.stringify(data.session));
        navigate("/dashboard");
      } else {
        navigate("/auth");
      }
    };

    handleOAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="p-6 text-white">Signing you in...</div>
    </div>
  );
};

export default AuthCallback;
