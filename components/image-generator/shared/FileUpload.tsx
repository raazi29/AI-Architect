import React, { useState, useRef } from 'react';

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            onFileSelect(file);
        } else {
            setFileName(null);
            onFileSelect(null);
        }
    };
    
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleClear = () => {
        setFileName(null);
        onFileSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
            />
            {!fileName ? (
                 <button 
                    onClick={handleButtonClick}
                    className="w-full text-left p-3 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition"
                >
                    Click to select a file
                </button>
            ) : (
                <div className="w-full flex items-center justify-between p-3 bg-gray-100 border border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-700 truncate">{fileName}</p>
                    <button onClick={handleClear} className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
                </div>
            )}
        </div>
    );
};