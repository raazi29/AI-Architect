"use client";

import React, { useState, useCallback } from 'react';
import { DesignStyle } from './types';
import { DESIGN_STYLES } from './constants';
import { FileUpload } from './shared/FileUpload';
import { Spinner } from './shared/Spinner';

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [style, setStyle] = useState<DesignStyle>(DesignStyle.Modern);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a description for your design.');
            return;
        }
        
        setError('Video generation is coming soon! Currently, we support image generation with Stability AI. Video generation will be added in a future update.');
    }, [prompt]);
    
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
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">2. Describe Your Video Tour</label>
                        <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder="e.g., a slow pan across a sunlit kitchen with marble countertops" className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">3. Upload a Reference Image (Optional)</label>
                        <FileUpload onFileSelect={setUploadedFile} />
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center">
                        {isLoading ? <Spinner /> : 'Generate Video (Coming Soon)'}
                    </button>
                </div>
                
                {/* Result Column */}
                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[300px] md:min-h-full">
                    {isLoading && (
                        <div className="text-center text-gray-500">
                            <Spinner />
                            <p className="mt-4 font-medium px-4">Processing...</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center">
                            <div className="text-4xl mb-4">🎬</div>
                            <p className="text-orange-600 text-center font-medium">{error}</p>
                        </div>
                    )}
                    {generatedVideoUrl && !isLoading && (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video src={generatedVideoUrl} controls autoPlay loop className="rounded-md w-full h-full object-cover shadow-lg" />
                    )}
                    {!isLoading && !generatedVideoUrl && !error && (
                        <div className="text-center text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.55a2 2 0 01.996 1.716V13a2 2 01-2 2h-1.55a2 2 0 01-1.789-1.11L15 10zM15 10v10l-4-4-4 4V10a2 2 0 012-2h4a2 2 0 012 2z" />
                            </svg>
                            <p className="mt-2 font-medium">Video generation coming soon!</p>
                            <p className="text-sm text-gray-400">Currently available: AI Image Generation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};