'use client'; // Bu bileşenin istemci tarafında çalışacağını belirtir

import { useState } from 'react';
import OptimizedImageCard from "../../components/OptimizedImageCard";

function Alert({ type, children }: { type: 'success' | 'error', children: React.ReactNode }) {
    return (
        <div className={`alert ${type === 'success' ? 'alert-success' : 'alert-error'}`}>{children}</div>
    );
}

function Spinner() {
    return <div className="spinner" />;
}

export default function UploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<null | {
        downloadUrl: string;
        altText: string;
        newFileName: string;
        fileSize: number;
        originalFileName: string;
    }>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setMessage('');
            setResult(null);
        } else {
            setSelectedFile(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage('Please select a file.');
            return;
        }
        setIsLoading(true);
        setMessage('');
        setResult(null);
        const formData = new FormData();
        formData.append('image', selectedFile);
        try {
            const response = await fetch('http://localhost:5001/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                setResult({
                    downloadUrl: data.downloadUrl,
                    altText: data.altText,
                    newFileName: data.newFileName,
                    fileSize: data.fileSize,
                    originalFileName: data.originalFileName,
                });
                setMessage('Successfully optimized!');
            } else {
                setMessage(data.error || 'Upload failed.');
            }
        } catch (error) {
            setMessage('An error occurred, please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-8 px-2 bg-[var(--color-bg)]">
            <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">Image Uploader</h1>
            <div className="card w-full max-w-lg flex flex-col items-center">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-900 mb-4"
                />
                {selectedFile && (
                    <p className="text-sm text-gray-600 mb-4">Selected File: <span className="font-semibold">{selectedFile.name}</span></p>
                )}
                <button
                    onClick={handleUpload}
                    disabled={isLoading || !selectedFile}
                    className="btn w-full mb-2"
                >
                    {isLoading ? <Spinner /> : 'Upload Image'}
                </button>
                {message && (
                    <Alert type={message.toLowerCase().includes('fail') || message.toLowerCase().includes('error') ? 'error' : 'success'}>
                        {message}
                    </Alert>
                )}
                {result && (
                    <div className="mt-8 w-full flex justify-center">
                        <OptimizedImageCard
                            downloadUrl={result.downloadUrl}
                            altText={result.altText}
                            newFileName={result.newFileName}
                            fileSize={result.fileSize}
                            originalFileName={result.originalFileName}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}