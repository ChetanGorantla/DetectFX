import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase-client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        console.error("No `code` found in URL.");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth exchange error:", error.message); // 👈 check here
        navigate("/auth");
        return;
      }

      if (data?.session) {
        sessionStorage.setItem("supabaseSession", JSON.stringify(data.session));
        navigate("/dashboard");
      } else {
        navigate("/auth");
      }
    };

    handleOAuth();
  }, [navigate]);

  return <div className="text-white">Signing you in...</div>;
};

export default AuthCallback;
