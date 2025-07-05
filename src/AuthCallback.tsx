import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase-client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error retrieving session:", error.message);
        navigate("/auth");
        return;
      }

      if (data?.session) {
        sessionStorage.setItem("supabaseSession", JSON.stringify(data.session));
        navigate("/dashboard");
      } else {
        console.warn("No session found.");
        navigate("/auth");
      }
    };

    handleRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex justify-center items-center text-white bg-black">
      Signing you in...
    </div>
  );
};

export default AuthCallback;
