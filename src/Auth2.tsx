import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Chrome, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import {supabase} from './supabase-client';
import CustomAlert from './CustomAlert';



export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('');

  const [alertInfo, setAlertInfo] = useState<{ id: string; message: string } | null>(null);
    
      const showAlert = (message: string) => {
        setAlertInfo(null); // Clear the old one first
        setTimeout(() => {
          setAlertInfo({ id: crypto.randomUUID(), message });
        }, 50); // slight delay to allow re-render
      };

    
    useEffect(() => {
        if (alertInfo?.message){
          showAlert(alertInfo.message);
        }
        
      }, [alert]);

  const signUp = async () => {
    setIsLoading(true);
    setLoadingType('signup');
    
    try {
      
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        showAlert(error.message);
        return;
      }
      
      showAlert('Check your email for confirmation');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        sessionStorage.setItem('supabaseSession', JSON.stringify(data.session));
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
        }, {
          onConflict: 'id'
        });
      }
      window.location.href = "/auth/callback";
    } catch (error) {
      //console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
      setLoadingType('');
    }
  };

  const signIn = async () => {
    setIsLoading(true);
    setLoadingType('signin');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showAlert(error.message);
        return;
      }
      
      sessionStorage.setItem('supabaseSession', JSON.stringify(data.session));
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        //console.log('User:', user);
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
        }, {
          onConflict: 'id'
        });
      }
      window.location.href = "/auth/callback";
    } catch (error) {
      //console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
      setLoadingType('');
    }
  };

  const signInWithProvider = async (provider: 'google') => {
    setIsLoading(true);
    setLoadingType('google');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider
        
      });
      //if (error) console.error('OAuth error:', error.message);
    } catch (error) {
      //console.error('OAuth error:', error);
    } finally {
      setIsLoading(false);
      setLoadingType('');
    }
  };

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (isSignUp) {
      signUp();
    } else {
      signIn();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-300">
            {isSignUp ? 'Sign up to get started with DetectFX' : 'Sign in to continue your DetectFX journey'}
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-purple-500/50 transition-all duration-200"
                  placeholder="Enter your email"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-purple-500/50 transition-all duration-200"
                  placeholder="Enter your password"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Alerts */}
            {alertInfo && (
              <CustomAlert
                key={alertInfo.id} // forces remount
                message={alertInfo.message}
                autoClose
                onClose={() => setAlertInfo(null)}
              />
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading && (loadingType === 'signin' || loadingType === 'signup')}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-blue-500/50 disabled:to-cyan-500/50 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading && (loadingType === 'signin' || loadingType === 'signup') ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <User className="w-5 h-5 mr-2" />
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </div>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/5 text-gray-400 rounded-lg">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={() => signInWithProvider('google')}
            disabled={isLoading && loadingType === 'google'}
            className="w-full py-4 bg-white/5 hover:bg-white/10 disabled:bg-white/5 border border-white/10 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed"
          >
            {isLoading && loadingType === 'google' ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Chrome className="w-5 h-5 mr-2" />
                Continue with Google
              </div>
            )}
          </button>

          {/* Toggle Sign Up/Sign In */}
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          {/*
          <p className="text-gray-400 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
          */}
        </div>
      </div>
    </div>
  );
}