import React, { useState, useRef, useEffect } from 'react';
import {supabase} from './supabase-client';
import { Upload, Music, Wand2, Loader2, CheckCircle, X, FileAudio, Zap, Download } from 'lucide-react';
import DownloadButton from './DownloadButton';
import CustomAlert from './CustomAlert';

const AudioEffectsApplier: React.FC = () => {
    const [uploadedCleanFile, setUploadedCleanFile] = useState<File | null>(null);
    const [uploadedReferenceFile, setUploadedReferenceFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isDragOverClean, setIsDragOverClean] = useState(false);
    const [isDragOverReference, setIsDragOverReference] = useState(false);
    const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);
    const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);
    const cleanFileInputRef = useRef<HTMLInputElement>(null);
    const referenceFileInputRef = useRef<HTMLInputElement>(null);

    const [alertInfo, setAlertInfo] = useState<{ id: string; message: string } | null>(null);
    
      const showAlert = (message: string) => {
        setAlertInfo(null); // Clear the old one first
        setTimeout(() => {
          setAlertInfo({ id: crypto.randomUUID(), message });
          setUploadedCleanFile(null);
          setUploadedReferenceFile(null);
        }, 50); // slight delay to allow re-render
      };

    
    useEffect(() => {
        if (alertInfo?.message){
          showAlert(alertInfo.message);
        }
        
      }, [alert]);

    async function uploadFiles(cleanFile:File, referenceFile:File){
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
      const cleanFileUUID: string = crypto.randomUUID();
      const referenceFileUUID: string = crypto.randomUUID();
      const generatedUUID: string = crypto.randomUUID();
      const processUUID: string = crypto.randomUUID();
      
      
  
      const cleanPath = `${user?.id}/recreations/${processUUID}/${cleanFileUUID}.wav`;
      //console.log("Clean path:", cleanPath);
      const referencePath = `${user?.id}/recreations/${processUUID}/${referenceFileUUID}.wav`;
      //console.log("Reference path:", referencePath);
      const generatedPath = `${user?.id}/recreations/${processUUID}/${generatedUUID}.wav`;
      //console.log("Generated path:", generatedPath);

      
  
      
      
  
        const [cleanResult, refResult] = await Promise.all([
            supabase.storage.from("detectfx-bucket").upload(cleanPath, cleanFile, {
                cacheControl: "3600",
                upsert: true,
            }),
            supabase.storage.from("detectfx-bucket").upload(referencePath, referenceFile, {
                cacheControl: "3600",
                upsert: true,
            }),
        ]);

        // Correctly extract data and error from each result
        const { data: cleanData, error: cleanError } = cleanResult;
        const { data: refData, error: refError } = refResult;
        if (cleanError || refError) {
            //console.error("Upload error:", cleanError ?? refError);
        } else {
            //console.log("Clean file uploaded to:", cleanData?.path);
            //console.log("Reference file uploaded to:", refData?.path);
        }



      
  
      const publicCleanFileUrl = await getPublicURL("detectfx-bucket", cleanPath);
      const publicReferenceFileUrl = await getPublicURL("detectfx-bucket", referencePath);
      

      const processedName = uploadedCleanFile?.name.toString().split(".wav")[0] + "_processed.wav";
      //console.log(processedName);
      
      if (publicCleanFileUrl && publicReferenceFileUrl) {
        //console.log("publicCleanFileUrl:", publicCleanFileUrl);
        //console.log("publicReferenceFileUrl:", publicReferenceFileUrl);
        await sendData(processUUID, user!.id, cleanFileUUID, referenceFileUUID, uploadedCleanFile!.name, uploadedReferenceFile!.name, publicCleanFileUrl, publicReferenceFileUrl, generatedUUID, processedName,generatedPath);  // ✅ Will run after URL is ready
      } else {
        console.error("Public clean & reference file URLs could not be generated.");
      }
      
  
      
  
      
  
  
    }

    async function updateTable(process_id: string, uploader_id: string, clean_id: string, reference_id: string, clean_name: string, reference_name: string, clean_storage_link: string, reference_storage_link: string, generated_id: string, generated_name: string, generated_storage_link: string){
        
        const {error} = await supabase.from("replication_files").insert({process_id: process_id, uploader_id: uploader_id, clean_id: clean_id, reference_id: reference_id, clean_name: clean_name, reference_name: reference_name, clean_storage_link: clean_storage_link, reference_storage_link: reference_storage_link, generated_id: generated_id, generated_name: generated_name, generated_storage_link: generated_storage_link});
        if (error){
          //console.log("Error uploading file to table:", error.message);
          return;
        } else {
          //console.log("Successfully uploaded file to table");
        }
        setIsProcessing(false);
        setIsComplete(true);
      }

    async function getPublicURL(bucketName:string, filePath: string) {
        const {data:{publicUrl}} = supabase.storage.from(bucketName).getPublicUrl(filePath);
        return publicUrl;
    }

    const sendData = async (process_id: string, userID: string, cleanUUID: string, referenceUUID: string, cleanName: string, referenceName: string, clean_storage_link: string, reference_storage_link: string, generated_id: string, generated_name: string, generated_storage_link: string) => {
    if (!uploadedCleanFile || !uploadedReferenceFile) return;
    
    
    
    
      
      try {
        //${import.meta.env.VITE_BACKEND_ENDPOINT}/generate
        const res = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/generate`, {
          method:"POST",
          headers:{
            "Content-Type": "application/json",
          },
          body: JSON.stringify({clean_file_link: clean_storage_link, reference_file_link: reference_storage_link, output_file_link: generated_storage_link})
          
        });

        if (!res.ok){
          const text = await res.text();
          //console.log("Error fetching result: ", res.status, text);
          return;

        }

        const data = await res.json();
        //console.log("Ready to access generated file ", generated_name, " at ", generated_storage_link);
        const publicGeneratedFileUrl = await getPublicURL("detectfx-bucket", generated_storage_link);
        //console.log("Generated total file path:", publicGeneratedFileUrl);
        //generated_storage_link is truncated because of what happened in audiotest.py so need to populate it again
        
        setGeneratedFileUrl(publicGeneratedFileUrl);
        setGeneratedFileName(generated_name);
        await updateTable(process_id, userID, cleanUUID, referenceUUID, cleanName, referenceName, clean_storage_link, reference_storage_link, generated_id, generated_name, publicGeneratedFileUrl);
      } catch (error) {
        //console.log("Error:", error);
      }
    }

    
    const decrementUses = async () => {
        const { data, error } = await supabase.rpc('decrement_uses');
    
        if (error) {
          //console.error("Failed to decrement usage:", error.message);
          return false;
        }
    
        if (!data) {
          showAlert("You've used all your free credits! Credits reset every Monday.");
          return false;
        }
    
        return true;
      };
    
    
    
    const handleFileSelect = (file: File, type: 'clean' | 'reference') => {
    if (file && file.type === 'audio/wav') {
      
      const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        showAlert("File is too large! Please upload a file smaller than 15 MB.");
        return;
      }
    
      if (type === 'clean') {
        setUploadedCleanFile(file);
      } else {
        setUploadedReferenceFile(file);
      }
      // Reset completion state when new files are selected
      setIsComplete(false);
      setGeneratedFileUrl(null);
      setGeneratedFileName(null);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'clean' | 'reference') => {
    e.preventDefault();
    if (type === 'clean') {
      setIsDragOverClean(false);
    } else {
      setIsDragOverReference(false);
    }
    const file = e.dataTransfer.files[0];
    handleFileSelect(file, type);
  };

  const handleDragOver = (e: React.DragEvent, type: 'clean' | 'reference') => {
    e.preventDefault();
    if (type === 'clean') {
      setIsDragOverClean(true);
    } else {
      setIsDragOverReference(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, type: 'clean' | 'reference') => {
    e.preventDefault();
    if (type === 'clean') {
      setIsDragOverClean(false);
    } else {
      setIsDragOverReference(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'clean' | 'reference') => {
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB in bytes
    const file = e.target.files?.[0];
    if (file){
      if (file.size > MAX_FILE_SIZE) {
        showAlert("File is too large! Please upload a file smaller than 15 MB.");
        e.target.value = ""; // clear the input
        return;
      }
      handleFileSelect(file, type);
    }
  };

  const resetFiles = () => {
    setUploadedCleanFile(null);
    setUploadedReferenceFile(null);
    setIsProcessing(false);
    setIsComplete(false);
    setGeneratedFileUrl(null);
    setGeneratedFileName(null);
    if (cleanFileInputRef.current) cleanFileInputRef.current.value = '';
    if (referenceFileInputRef.current) referenceFileInputRef.current.value = '';
  };

  const removeFile = (type: 'clean' | 'reference') => {
    if (type === 'clean') {
      setUploadedCleanFile(null);
      if (cleanFileInputRef.current) cleanFileInputRef.current.value = '';
    } else {
      setUploadedReferenceFile(null);
      if (referenceFileInputRef.current) referenceFileInputRef.current.value = '';
    }
    setIsComplete(false);
    setGeneratedFileUrl(null);
    setGeneratedFileName(null);
  };

  const FileUploadCard = ({ 
    type, 
    file, 
    isDragOver, 
    title, 
    description, 
    icon 
  }: {
    type: 'clean' | 'reference';
    file: File | null;
    isDragOver: boolean;
    title: string;
    description: string;
    icon: React.ReactNode;
  }) => (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
      </div>
      
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
          isDragOver
            ? 'border-blue-400 bg-blue-500/20'
            : file
            ? 'border-green-400 bg-green-500/20'
            : 'border-gray-400 hover:border-blue-400 hover:bg-blue-500/10'
        }`}
        onDrop={(e) => handleDrop(e, type)}
        onDragOver={(e) => handleDragOver(e, type)}
        onDragLeave={(e) => handleDragLeave(e, type)}
        onClick={() => type === 'clean' ? cleanFileInputRef.current?.click() : referenceFileInputRef.current?.click()}
      >
        <input
          ref={type === 'clean' ? cleanFileInputRef : referenceFileInputRef}
          type="file"
          accept=".wav"
          onChange={(e) => handleFileInputChange(e, type)}
          className="hidden"
        />
        
        {file ? (
          <div className="flex items-center justify-center flex-col space-y-3">
            <CheckCircle className="w-12 h-12 text-green-400" />
            <div>
              <p className="text-white text-lg font-semibold">{file.name}</p>
              <p className="text-gray-300 text-sm">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile(type);
              }}
              className="inline-flex items-center px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-col space-y-3">
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="text-white text-lg font-semibold mb-1">
                Drop your WAV file here
              </p>
              <p className="text-gray-400 text-sm">or click to browse</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen  p-6 pt-30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-6">
            <Wand2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Audio Effects Applier</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Transform your clean guitar recording by applying the effects style from a reference track
          </p>
        </div>

        {/* File Upload Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <FileUploadCard
            type="clean"
            file={uploadedCleanFile}
            isDragOver={isDragOverClean}
            title="Clean Audio File"
            description="Upload the original, unprocessed audio"
            icon={<FileAudio className="w-5 h-5 text-white" />}
          />
          
          <FileUploadCard
            type="reference"
            file={uploadedReferenceFile}
            isDragOver={isDragOverReference}
            title="Reference Audio File"
            description="Upload the audio with desired effects"
            icon={<Zap className="w-5 h-5 text-white" />}
          />
        </div>

        {/* Process Button */}
        {uploadedCleanFile && uploadedReferenceFile && !isProcessing && !isComplete && (
          <div className="text-center mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 inline-block">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">Ready to Process</span>
              </div>
              <button
                onClick={() => uploadFiles(uploadedCleanFile, uploadedReferenceFile)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Music className="w-5 h-5 mr-3" />
                Apply Effects
              </button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
            <div className="flex items-center justify-center flex-col space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white mb-2">Processing Audio</h3>
                <p className="text-gray-300">Analyzing reference track and applying effects to your clean audio...</p>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
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
        {isComplete && generatedFileName && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Processing Complete!</h3>
                <p className="text-gray-300">Your audio file has been processed successfully</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <FileAudio className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{generatedFileName}</p>
                    <p className="text-gray-300 text-sm">Processed audio file</p>
                  </div>
                </div>
                {/*
                <button
                  onClick={() => window.open(generatedFileUrl || '', '_blank')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                */}
                <DownloadButton generatedFileUrl={generatedFileUrl!} generatedFileName = {generatedFileName} />
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={resetFiles}
                className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20"
              >
                Process Another Pair
              </button>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-white mb-2">How It Works</h3>
            <p className="text-gray-300">Reverse-engineered audio effects transfer</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileAudio className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">1. Upload Clean Audio</h4>
              <p className="text-gray-300 text-sm">Provide your original, unprocessed guitar recording</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">2. Add Reference</h4>
              <p className="text-gray-300 text-sm">Upload a reference track with the desired effects style</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">3. Digital Signal Processing</h4>
              <p className="text-gray-300 text-sm">Our algorithm analyzes and applies the reference effects to your clean audio</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default AudioEffectsApplier;