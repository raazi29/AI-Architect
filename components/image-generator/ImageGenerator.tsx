"use client";

import React, { useState, useCallback } from 'react';
import { generateImageFromText, editImageWithText } from './services/geminiService';
import { DesignStyle } from './types';
import { DESIGN_STYLES } from './constants';
import { FileUpload } from './shared/FileUpload';
import { Spinner } from './shared/Spinner';

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [style, setStyle] = useState<DesignStyle>(DesignStyle.Modern);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            base64: await base64EncodedDataPromise,
            mimeType: file.type
        };
    };

    const handleGenerate = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a description for your design.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        const fullPrompt = `${style} style interior design: ${prompt}`;

        try {
            let imageUrl: string;
            if (uploadedFile) {
                const { base64, mimeType } = await fileToGenerativePart(uploadedFile);
                imageUrl = await editImageWithText(fullPrompt, base64, mimeType);
            } else {
                imageUrl = await generateImageFromText(fullPrompt);
            }
            setGeneratedImage(imageUrl);
        } catch (e: any) {
            console.error(e);
            if (e.message && e.message.includes('API key not valid')) {
                setError('API key is not valid. Please check your GEMINI_API_KEY in the .env file.');
            } else {
                setError(`An error occurred: ${e.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [prompt, style, uploadedFile]);
    
    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls Column */}
                <div className="flex flex-col space-y-6">
                    <div>
                        <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">1. Choose a Style</label>
                        <select id="style" value={style} onChange={e => setStyle(e.target.value as DesignStyle)} className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition">
                            {DESIGN_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">2. Describe Your Vision</label>
                        <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder="e.g., a spacious living room with a stone fireplace and large windows overlooking a forest" className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">3. Upload a Reference Image (Optional)</label>
                        <FileUpload onFileSelect={setUploadedFile} />
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center">
                        {isLoading ? <Spinner /> : 'Generate Image'}
                    </button>
                </div>
                
                {/* Result Column */}
                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[300px] md:min-h-full">
                    {isLoading && (
                         <div className="text-center text-gray-500">
                            <Spinner />
                            <p className="mt-2 font-medium">Generating your vision...</p>
                         </div>
                    )}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {generatedImage && !isLoading && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={generatedImage} alt="Generated interior design" className="rounded-md w-full h-full object-cover shadow-lg" />
                    )}
                    {!isLoading && !generatedImage && !error && (
                        <div className="text-center text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="mt-2 font-medium">Your generated image will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};