import { Download } from "lucide-react"; // or your icon
import React from "react";

const DownloadButton: React.FC<{ generatedFileUrl: string, generatedFileName:string }> = ({ generatedFileUrl, generatedFileName }) => {
  const handleDownload = async () => {
    if (!generatedFileUrl) return;

    try {
      const response = await fetch(generatedFileUrl);
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = generatedFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl); // cleanup
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
    >
      <Download className="w-4 h-4 mr-2" />
      Download
    </button>
  );
};

export default DownloadButton;
