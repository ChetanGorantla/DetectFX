import React, { useState, useEffect } from "react";
import { User, LogIn, Music } from "lucide-react";
import { supabase } from "./supabase-client";
import AudioEffectsDetector from "./AudioEffectsDetector";
import AudioEffectsApplier from "./AudioEffectsApplier";
import Auth2 from "./Auth2";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email?: string;
}

const TabComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"first" | "second">("first");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setShowAuth(false); // Hide auth component when user logs in
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = () => {
    setShowAuth(true);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show Auth component if not authenticated and sign in was clicked
  if (showAuth && !user) {
    return <Auth2 />;
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative">
      {/* Auth Overlay */}
      {!isLoading && (
        <div>

            <header className="absolute top-6 left-8 z-50">
                <button onClick = {() => navigate("/")} className = "cursor-pointer">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">DetectFX Studio</span>
                    </div>
                    
                    
                    </div>
                </button>
            </header>
            <div className="absolute top-6 right-6 z-50">
            {user ? (
                <div className="flex items-center space-x-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-4 py-2 border border-white/20">
                    <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium text-sm">
                        {user.email?.split('@')[0] || 'User'}
                    </span>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-2xl px-4 py-2 border border-white/20 text-white font-medium text-sm transition-all duration-200"
                >
                    Sign Out
                </button>
                </div>
            ) : (
                <button
                onClick={handleSignIn}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 backdrop-blur-lg rounded-2xl px-6 py-3 border border-white/20 text-white font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
                </button>
            )}
            </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 pt-20">

        {/* Header */}
        {/*
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎵</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Audio Effects Studio</h1>
          <p className="text-gray-300 text-lg">Detect and apply audio effects to your guitar recordings</p>
        </div>
        */}

        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-2 mb-8 border border-white/20 max-w-md mx-auto">
          <div className="flex space-x-2">
            <button
              className={`flex-1 px-6 py-3 font-semibold rounded-2xl transition-all duration-300 ${
                activeTab === "first"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              onClick={() => setActiveTab("first")}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">🔍</span>
                <span>Detect Effects</span>
              </div>
            </button>
            <button
              className={`flex-1 px-6 py-3 font-semibold rounded-2xl transition-all duration-300 ${
                activeTab === "second"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              onClick={() => setActiveTab("second")}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">🎛️</span>
                <span>Apply Effects</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative">
          <div className={`transition-all duration-500 ${
            activeTab === "first" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none absolute inset-0"
          }`}>
            {activeTab === "first" && (
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden">
                <AudioEffectsDetector />
              </div>
            )}
          </div>
          
          <div className={`transition-all duration-500 ${
            activeTab === "second" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 pointer-events-none absolute inset-0"
          }`}>
            {activeTab === "second" && (
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden">
                <AudioEffectsApplier />
              </div>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        {/*
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-200">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Effect Detection</h3>
            <p className="text-gray-300 leading-relaxed">
              Upload your guitar recordings and let our AI analyze and identify the effects used. 
              Get detailed information about each effect and recommended amplifier pairings.
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-200">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🎛️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Effect Application</h3>
            <p className="text-gray-300 leading-relaxed">
              Apply professional-grade effects to your recordings. Choose from a variety of 
              distortions, modulations, and time-based effects to craft your perfect sound.
            </p>
          </div>
        </div>
        */}
      </div>
      
      
      
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
    </div>
  );
};

export default TabComponent;