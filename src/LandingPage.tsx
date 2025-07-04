import React, { useState, useEffect } from "react";
import { Music, Zap, Settings, ChevronRight, Play, Activity, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "./supabase-client";
import { useNavigate } from "react-router-dom";


const LandingPage: React.FC = () => {

  const [showApp, setShowApp] = useState(false);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

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

  const handleDirect = () => {
    if (session){
        navigate("/dashboard")
    }else{
        navigate("/auth")
    }
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-10 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">DetectFX Studio</span>
          </div>
          
          
        </div>
      </header>

      {/* Hero Section */} 
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl mb-8 shadow-2xl">
            <Activity className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            transform your
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              guitar sound.
            </span>
          </h1>
          <br></br>
          <br></br>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Powerful AI-powered audio effects detection and application for electric guitar. 
            Discover the effects in your favorite tracks and apply them to your own recordings.
            New features coming soon.
          </p>
          <p className="text-xl md:text-3xl text-white mb-12 max-w-4xl mx-auto leading-relaxed">
            Free* for a limited time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button
              onClick={() => handleDirect()}
              className="group bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-3 text-lg"
            >
              <Play className="w-6 h-6" />
              <span>Launch Studio</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
              <div className="text-3xl font-bold text-blue-400 mb-2">12+</div>
              <div className="text-gray-300">Effect Types</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
              <div className="text-3xl font-bold text-cyan-400 mb-2">High</div>
              <div className="text-gray-300">Accuracy</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
              <div className="text-3xl font-bold text-blue-400 mb-2">Lightning Fast</div>
              <div className="text-gray-300">Processing Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to analyze, understand, and enhance your guitar recordings
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Effect Detection</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Upload your guitar recording and let our model analyze every effect used. 
                Get detailed presence ratings and gear recommendations.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Distortion & Overdrive Detection
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  Modulation Effects Analysis
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Time-based Effects Recognition
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Revolutionizing DSP</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Apply studio-quality effects to your recordings with precision.
                Shape your sound with the right idea in mind.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  Dynamic Effect Processing
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Reverse-Engineered DSP Effect Chains
                </li>
                <li className="flex items-center text-gray-300">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  High-Quality Audio Export
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl mb-8">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ready to transform your sound?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the other bedroom guitarists who are already using DetectFX Studio to 
              analyze and enhance their guitar recordings.
            </p>
            
            <button
              onClick={() => handleDirect()}
              className="group bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-3 text-lg mx-auto"
            >
              <Play className="w-6 h-6" />
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DetectFX Studio</span>
          </div>
          <div className="text-gray-400 mx-auto leading-relaxed">
            <p>© 2025 DetectFX Studio. Transforming guitars with AI.</p>
            <p>*Users without paid plan recieve limited credits.</p>
            <p>🖂 chetangorantla7@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;