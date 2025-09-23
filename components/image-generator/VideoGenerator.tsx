"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { startVideoGeneration, checkVideoOperationStatus } from './services/geminiService';
import { DesignStyle } from './types';
import { DESIGN_STYLES, VIDEO_LOADING_MESSAGES } from './constants';
import { FileUpload } from './shared/FileUpload';
import { Spinner } from './shared/Spinner';

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [style, setStyle] = useState<DesignStyle>(DesignStyle.Modern);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        if (messageIntervalRef.current) {
            clearInterval(messageIntervalRef.current);
            messageIntervalRef.current = null;
        }
    };
    
    useEffect(() => {
        return () => stopPolling();
    }, []);

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

    const pollForVideo = useCallback(async (operationId: string) => {
        pollIntervalRef.current = setInterval(async () => {
            try {
                const statusResponse = await checkVideoOperationStatus(operationId);
                if (statusResponse.done) {
                    stopPolling();
                    if (statusResponse.videoUrl) {
                        setGeneratedVideoUrl(statusResponse.videoUrl);
                    } else {
                        throw new Error('Video generation finished but no download link was found.');
                    }
                    setIsLoading(false);
                }
            } catch (e: any) {
                console.error('Polling error:', e);
                if (e.message && e.message.includes('API key not valid')) {
                    setError('API key is not valid. Please check your GEMINI_API_KEY in the .env file.');
                } else {
                    setError(`An error occurred during video processing: ${e.message}`);
                }
                setIsLoading(false);
                stopPolling();
            }
        }, 10000); // Poll every 10 seconds
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a description for your design.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        setLoadingMessage(VIDEO_LOADING_MESSAGES[0]);

        let messageIndex = 0;
        messageIntervalRef.current = setInterval(() => {
            messageIndex = (messageIndex + 1) % VIDEO_LOADING_MESSAGES.length;
            setLoadingMessage(VIDEO_LOADING_MESSAGES[messageIndex]);
        }, 5000);

        const fullPrompt = `A cinematic video tour of a ${style} style interior design: ${prompt}`;

        try {
            let operationId: string;
            if (uploadedFile) {
                const { base64, mimeType } = await fileToGenerativePart(uploadedFile);
                operationId = await startVideoGeneration(fullPrompt, base64, mimeType);
            } else {
                operationId = await startVideoGeneration(fullPrompt);
            }
            await pollForVideo(operationId);
        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message}`);
            setIsLoading(false);
            stopPolling();
        }
    }, [prompt, style, uploadedFile, pollForVideo]);
    
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
                        {isLoading ? <Spinner /> : 'Generate Video'}
                    </button>
                </div>
                
                {/* Result Column */}
                <div className="bg-gray-10 rounded-lg p-4 flex items-center justify-center min-h-[300px] md:min-h-full">
                    {isLoading && (
                         <div className="text-center text-gray-500">
                            <Spinner />
                            <p className="mt-4 font-medium px-4">{loadingMessage}</p>
                         </div>
                    )}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {generatedVideoUrl && !isLoading && (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video src={generatedVideoUrl} controls autoPlay loop className="rounded-md w-full h-full object-cover shadow-lg" />
                    )}
                    {!isLoading && !generatedVideoUrl && !error && (
                        <div className="text-center text-gray-500">
                             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.55a2 2 0 01.996 1.716V13a2 2 01-2 2h-1.55a2 2 0 01-1.789-1.11L15 10zM15 10v10l-4-4-4 4V10a2 2 0 012-2h4a2 2 0 012 2z" /></svg>
                             <p className="mt-2 font-medium">Your generated video will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};