import React from "react";

interface OptimizedImageCardProps {
  downloadUrl: string;
  altText: string;
  newFileName: string;
  fileSize: number;
  originalFileName: string;
}

const OptimizedImageCard: React.FC<OptimizedImageCardProps> = ({
  downloadUrl,
  altText,
  newFileName,
  fileSize,
  originalFileName,
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(altText);
      alert("Alt text copied!");
    } catch {
      alert("Copy failed.");
    }
  };

  return (
    <div className="card flex flex-col items-center animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Optimized Image</h2>
      <img
        src={downloadUrl}
        alt={altText}
        className="rounded-lg border mb-4 max-w-full max-h-72 shadow-md"
        style={{ objectFit: "contain", background: "#f3f4f6" }}
      />
      <div className="w-full flex flex-col gap-2 mb-2 text-base text-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-semibold text-gray-500">New File Name:</span>
          <span className="break-all">{newFileName}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-semibold text-gray-500">Alt Text:</span>
          <span className="break-all">{altText}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-semibold text-gray-500">Size:</span>
          <span>{(fileSize / 1024).toFixed(2)} KB</span>
        </div>
      </div>
      <div className="flex gap-3 mt-4 w-full justify-center">
        <a
          href={downloadUrl}
          download={newFileName}
          className="btn bg-blue-600 hover:bg-blue-700"
        >
          Download
        </a>
        <button
          onClick={handleCopy}
          className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
          style={{ boxShadow: "none" }}
        >
          Copy Alt Text
        </button>
      </div>
    </div>
  );
};

export default OptimizedImageCard; 