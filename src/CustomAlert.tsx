import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";

interface CustomAlertProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  message,
  type = "info",
  onClose,
  autoClose = true,
  duration = 4000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation after component mounts
    setTimeout(() => setIsAnimating(true), 50);

    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case "error":
        return <AlertTriangle className="w-6 h-6 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      default:
        return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "from-green-500/20 to-emerald-500/20",
          border: "border-green-400/30",
          accent: "bg-green-500"
        };
      case "error":
        return {
          bg: "from-red-500/20 to-rose-500/20",
          border: "border-red-400/30",
          accent: "bg-red-500"
        };
      case "warning":
        return {
          bg: "from-yellow-500/20 to-amber-500/20",
          border: "border-yellow-400/30",
          accent: "bg-yellow-500"
        };
      default:
        return {
          bg: "from-blue-500/20 to-cyan-500/20",
          border: "border-blue-400/30",
          accent: "bg-blue-500"
        };
    }
  };

  if (!isVisible) return null;

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      
      {/* Alert Container */}
      <div 
        className={`relative bg-gradient-to-br ${colors.bg} backdrop-blur-lg rounded-3xl p-8 max-w-md w-full mx-4 border ${colors.border} shadow-2xl transform transition-all duration-300 ${
          isAnimating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${colors.accent} rounded-t-3xl`} />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${colors.accent} rounded-xl flex items-center justify-center shadow-lg`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white capitalize">{type}</h3>
              <p className="text-gray-300 text-sm">System Alert</p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 group"
          >
            <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Message */}
        <div className="bg-black/20 rounded-2xl p-6 border border-white/10 mb-6">
          <p className="text-white text-lg leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className={`px-6 py-3 ${colors.accent} hover:${colors.accent}/80 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`}
          >
            Dismiss
          </button>
        </div>

        {/* Auto-close Progress Bar */}
        {autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-3xl overflow-hidden">
            <div 
              className={`h-full ${colors.accent} transition-all duration-100 ease-linear`}
              style={{
                width: "100%",
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomAlert;