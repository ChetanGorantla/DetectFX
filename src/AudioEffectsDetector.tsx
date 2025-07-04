import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Activity, Loader2, CheckCircle, X, BookOpen } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import {supabase} from './supabase-client';
import CustomAlert from './CustomAlert';

// Import your existing HueBar component
interface HueBarProps {
  value: number;
  height?: number;
  width?: number;
}

const HueBar: React.FC<HueBarProps> = ({ value, height = 8, width = 200 }) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const filledWidth = (clampedValue / 100) * width;
  const hue = 60 + (clampedValue / 100) * (120 - 60);
  const barColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#e5e7eb',
      }}
    >
      <div
        className="h-full transition-all duration-500 ease-out"
        style={{
          width: `${filledWidth}px`,
          backgroundColor: barColor,
        }}
      />
    </div>
  );
};

interface EffectsData {
  [key: string]: number;
}
interface CsvData {
  Effect: string;
  Amps: string;
}

interface EffectModalProps {
  isOpen: boolean;
  onClose: () => void;
  effectName: string;
  effectValue: number;
}

const EffectModal: React.FC<EffectModalProps> = ({ 
  isOpen, 
  onClose, 
  effectName, 
  effectValue
}) => {
  if (!isOpen) return null;

  const csvData: CsvData[] = [
    { Effect: "blues driver", Amps: "Fender Twin Reverb, Vox AC30, Marshall JTM45" },
    { Effect: "tube screamer", Amps: "Marshall Plexi, Mesa Boogie Dual Rectifier, Fender Deluxe Reverb" },
    { Effect: "RAT", Amps: "Mesa Boogie Rectifier, EVH 5150, Marshall JCM800" },
    { Effect: "chorus", Amps: "Roland Jazz Chorus (JC-120), Fender Twin Reverb, Mesa Lonestar" },
    { Effect: "flanger", Amps: "Marshall Silver Jubilee, Orange Rockerverb, Vox AC30" },
    { Effect: "phaser", Amps: "Marshall Plexi, Fender Twin Reverb, Dumble Overdrive Special" },
    { Effect: "tape echo", Amps: "Roland Space Echo, Fender Deluxe, Vox AC15" },
    { Effect: "digital delay", Amps: "Line 6 Echo Pro, Fractal Audio Delay, Strymon Timeline" },
    { Effect: "sweep echo", Amps: "TC Electronic Flashback, Boss DD-200, Eventide H90" },
    { Effect: "plate reverb", Amps: "Fender Twin Reverb, Universal Audio Plate 140, Marshall JCM800" },
    { Effect: "hall reverb", Amps: "Vox AC30, Line 6 Verbzilla, Fractal Audio Hall Reverb" },
    { Effect: "spring reverb", Amps: "Fender Twin Reverb, Vox AC15, Supro 1605R" }
  ];

  const formatEffectName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
  };

  const getEffectIcon = (effect: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      reverb: '🔊',
      distortion: '⚡',
      chorus: '🌊',
      delay: '⏱️',
      compression: '🎛️',
      eq: '📊',
      phaser: '🌀',
      flanger: '🎵'
    };
    return icons[effect] || '🎵';
  };

  const getAmpsInfo = () => {
    const effectData = csvData.find(row => 
      row.Effect.toLowerCase() === effectName.toLowerCase()
    );
    
    return effectData ? effectData.Amps : 'No amplifier information available for this effect';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">{getEffectIcon(effectName)}</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{formatEffectName(effectName)}</h3>
              <p className="text-gray-300 text-sm">Effect Information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Detection Confidence */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Effect  Presence</span>
            <span className="text-blue-300 font-bold text-lg">
              {Math.round(effectValue * 100)}%
            </span>
          </div>
          <HueBar value={effectValue * 100} width={320} height={12} />
        </div>

        {/* Amplifier Information */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center mb-4">
            <BookOpen className="w-5 h-5 text-blue-400 mr-3" />
            <h4 className="text-lg font-semibold text-white">Recommended Amplifiers</h4>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/10">
            <p className="text-gray-300 leading-relaxed">
              {getAmpsInfo()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AudioEffectsDetector: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [effects, setEffects] = useState<EffectsData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedEffect, setSelectedEffect] = useState<{name: string, value: number} | null>(null);

  const [alertInfo, setAlertInfo] = useState<{ id: string; message: string } | null>(null);

  const showAlert = (message: string) => {
    setAlertInfo(null); // Clear the old one first
    setTimeout(() => {
      setAlertInfo({ id: crypto.randomUUID(), message });
      setUploadedFile(null);
    }, 50); // slight delay to allow re-render
  };


  


  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  const decrementUses = async () => {
    const { data, error } = await supabase.rpc('decrement_uses');

    if (error) {
      console.error("Failed to decrement usage:", error.message);
      return false;
    }

    if (!data) {
      
      showAlert("You've used all your free credits! Credits reset every Monday.");
      return false;
    }

    return true;
  };


  useEffect(() => {
    if (alertInfo?.message){
      showAlert(alertInfo.message);
    }
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
  }, [alert]);

  const handleFileSelect = (file: File) => {
    
    if (file && file.type === 'audio/wav') {
      const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        console.log("File too large")
        showAlert("File is too large! Please upload a file smaller than 15 MB.");
        return;
      }
      setUploadedFile(file);
      setEffects(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    //const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB in bytes
    const file = e.target.files?.[0];
    if (file){
      
      handleFileSelect(file);
    }
  };

  

  async function uploadFile(file:File){
      const canUse = await decrementUses();

      if (!canUse){
        return;
      }
      setIsProcessing(true);
      const {
          data: { user },
      } = await supabase.auth.getUser();
  
      //generate a random uuid, append that to path instead of file.name
      //send the data to the supabase table in addition to the storage service
      const fileUUID: string = crypto.randomUUID();
      
      console.log("File UUID:", fileUUID);
      
  
      const path = `${user?.id}/detections/${fileUUID}`;
      console.log(path);
  
      
      
  
      const {data, error} = await supabase
        .storage
        .from("detectfx-bucket")
        .upload(path, file, {
          cacheControl:"3600",
          upsert: true
        });
  
      if (error){
        console.log("Upload error: ", error);
        return null;
      }
  
      const publicFileUrl = await getPublicURL("detectfx-bucket", path);
      
      if (publicFileUrl) {
        console.log("File URL:", publicFileUrl);
        await sendData(publicFileUrl, fileUUID, user!.id, file.name);  // ✅ Will run after URL is ready
      } else {
        console.error("Public file URL could not be generated.");
      }
      
  
      
  
      
  
  
    }
  
  async function updateTable(fileUUID:string, userID:string, fileName:string, effects:JSON, fileURL:string){
    
    const {error} = await supabase.from("files").insert({file_id: fileUUID, uploader_id: userID, file_name: fileName, processed_result: effects, file_storage_link: fileURL});
    if (error){
      console.log("Error uploading file to table:", error.message);
      console.log("File ID:", fileUUID);
      console.log("User ID:", userID);
      return;
    } else {
      console.log("Successfully uploaded file to table");
    }
  }

  async function getPublicURL(bucketName:string, filePath: string) {
    const {data:{publicUrl}} = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrl;
  }

  type FetchWithTimeoutParams = {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: any;
  timeout?: number; // in ms
};

const fetchWithTimeout = async ({
    url,
    method = "GET",
    headers = {},
    body = null,
    timeout = 10000,
  }: FetchWithTimeoutParams): Promise<Response | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      return res;
    } catch (err) {
      if ((err as DOMException).name === "AbortError") {
        showAlert("Process Timed Out");
      } else {
        showAlert("Fetch Failed");
      }
      setIsProcessing(false);
      return null;
    } finally {
      clearTimeout(timer);
    }
  };


  const sendData = async (inputtedUrl: string, fileUUID: string, userID: string, fileName: string) => {
    if (!uploadedFile) return;
    
    
    
    
      
      try {

        const res = await fetchWithTimeout({
          url: `${import.meta.env.VITE_BACKEND_ENDPOINT}/results`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ supabase_file_link: inputtedUrl }),
          timeout: 1000, // 10 seconds
        });

        if (!res || !res.ok) {
          const text = res ? await res.text() : "No response";
          console.log("Error fetching result: ", res?.status ?? "timeout", text);
          return;
        }

        const data = await res.json();
        console.log(data);
        setEffects(data.result);
        setIsProcessing(false);
        

        await updateTable(fileUUID, userID, fileName, data.result, inputtedUrl);
      } catch (error) {
        console.log("Error:", error);
      }
    }

  

  const resetUpload = () => {
    setUploadedFile(null);
    setEffects(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  

  const formatEffectName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
  };

  const getEffectIcon = (effect: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Reverb: '🔊',
      RAT: '⚡',
      Chorus: '🌊',
      Delay: '⏱️',
      Compression: '🎛️',
      Eq: '📊',
      Phaser: '🌀',
      Flanger: '🎵'
    };
    return icons[effect] || '🎵';
  };

  const handleEffectClick = (effectName: string, effectValue: number) => {
    setSelectedEffect({ name: effectName, value: effectValue });
  };

  return (
    <div className="min-h-screen  p-6 pt-30">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-6">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Electric Guitar Effects Detector</h1>
          <p className="text-gray-300 text-lg">Upload an Electric Guitar WAV file to analyze audio effects</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
              isDragOver
                ? 'border-blue-400 bg-blue-500/20'
                : uploadedFile
                ? 'border-green-400 bg-green-500/20'
                : 'border-gray-400 hover:border-blue-400 hover:bg-blue-500/10'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {uploadedFile ? (
              <div className="flex items-center justify-center flex-col space-y-4">
                <CheckCircle className="w-16 h-16 text-green-400" />
                <div>
                  <p className="text-white text-xl font-semibold">{uploadedFile.name}</p>
                  <p className="text-gray-300">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetUpload();
                  }}
                  className="inline-flex items-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-col space-y-4">
                <Upload className="w-16 h-16 text-gray-400" />
                <div>
                  <p className="text-white text-xl font-semibold mb-2">
                    Drop your WAV file here
                  </p>
                  <p className="text-gray-400">or click to browse</p>
                </div>
              </div>
            )}
          </div>

          {uploadedFile && !isProcessing && !effects && (
            <div className="mt-8 text-center">
              <button
                onClick={() => uploadFile(uploadedFile)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Music className="w-5 h-5 mr-3" />
                Analyze Audio Effects
              </button>
            </div>
          )}
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
            <div className="flex items-center justify-center flex-col space-y-6">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white mb-2">Processing Audio</h3>
                <p className="text-gray-300">Analyzing effects in your audio file...</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {alertInfo && (
          <CustomAlert
            key={alertInfo.id} // 👈 forces remount
            message={alertInfo.message}
            autoClose
            onClose={() => setAlertInfo(null)}
          />
        )}

        {/* Results Section */}
        {effects && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Detection Results</h3>
                <p className="text-gray-300">Effects found in your audio</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(effects)
                .filter(([_, value]) => value > 0)
                .sort(([,a], [,b]) => b - a)
                .map(([name, value]) => (
                  <div
                    key={name}
                    className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200"
                    onClick = {() => handleEffectClick(name, value)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getEffectIcon(name)}</span>
                        <span className="text-white font-semibold text-lg">
                          {formatEffectName(name)}
                        </span>
                      </div>
                      <span className="text-blue-300 font-bold text-lg">
                        {Math.round(value * 100)}%
                      </span>
                    </div>
                    <HueBar value={value * 100} width={280} height={12} />
                  </div>
                ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={resetUpload}
                className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20"
              >
                Upload Another File
              </button>
            </div>
          </div>
        )}
        {/* Effect Modal */}
        <EffectModal
          isOpen={selectedEffect !== null}
          onClose={() => setSelectedEffect(null)}
          effectName={selectedEffect?.name || ''}
          effectValue={selectedEffect?.value || 0}
        />
      </div>
    </div>
  );
};

export default AudioEffectsDetector;