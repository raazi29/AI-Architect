"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { 
  generateInteriorImage, 
  editInteriorImage, 
  downloadImage, 
  getAvailableStyles, 
  getAvailableRoomTypes,
  GenerationResult 
} from './services/stabilityService';
import { DesignStyle } from './types';
import { DESIGN_STYLES } from './constants';
import { FileUpload } from './shared/FileUpload';
import { Spinner } from './shared/Spinner';
import { Button } from '@/components/ui/button';
import { Download, Share2, RefreshCw } from 'lucide-react';

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [style, setStyle] = useState<DesignStyle | 'auto'>('auto');
    const [roomType, setRoomType] = useState<string>('auto');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
    const [availableStyles, setAvailableStyles] = useState<string[]>([]);
    const [availableRoomTypes, setAvailableRoomTypes] = useState<string[]>([]);

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

    // Load available options on component mount
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [styles, roomTypes] = await Promise.all([
                    getAvailableStyles(),
                    getAvailableRoomTypes()
                ]);
                setAvailableStyles(styles);
                setAvailableRoomTypes(roomTypes);
            } catch (error) {
                console.warn('Could not load options from backend');
            }
        };
        loadOptions();
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a description for your design.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGenerationResult(null);

        try {
            let result: GenerationResult;
            // Prepare options, using defaults for 'auto' selections
            const options = {
                style: style === 'auto' ? 'modern' : style.toLowerCase() as any,
                roomType: roomType === 'auto' ? 'living_room' : roomType as any
            };

            if (uploadedFile) {
                const { base64, mimeType } = await fileToGenerativePart(uploadedFile);
                result = await editInteriorImage(prompt, base64, mimeType, options);
            } else {
                result = await generateInteriorImage(prompt, options);
            }
            setGenerationResult(result);
        } catch (e: any) {
            console.error(e);
            if (e.message && e.message.includes('Backend error')) {
                setError('Backend service unavailable. Please make sure the FastAPI backend is running on port 8001.');
            } else {
                setError(`An error occurred: ${e.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [prompt, style, roomType, uploadedFile]);

    const handleDownload = () => {
        if (generationResult?.downloadUrl) {
            downloadImage(generationResult.downloadUrl, `${prompt.slice(0, 30)}-${Date.now()}.png`);
        }
    };
    
    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls Column */}
                <div className="flex flex-col space-y-6">
                    <div>
                        <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                            1. Design Style <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                        </label>
                        <select id="style" value={style} onChange={e => setStyle(e.target.value as DesignStyle | 'auto')} className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition">
                            <option value="auto">🎨 Auto-detect from description</option>
                            {DESIGN_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-2">
                            2. Room Type <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                        </label>
                        <select id="roomType" value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition">
                            <option value="auto">🏠 Auto-detect from description</option>
                            {availableRoomTypes.map(rt => (
                                <option key={rt} value={rt}>
                                    {rt.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                            3. Describe Your Vision <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            id="prompt" 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)} 
                            rows={4} 
                            placeholder="e.g., a spacious living room with a stone fireplace and large windows overlooking a forest" 
                            className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Tip: Be specific about style and room type in your description if you want precise results
                        </p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">4. Upload a Reference Image (Optional)</label>
                        <FileUpload onFileSelect={setUploadedFile} />
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center">
                        {isLoading ? (
                            <>
                                <Spinner />
                                <span className="ml-2">Generating...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Generate with Stability AI
                            </>
                        )}
                    </Button>
                </div>
                
                {/* Result Column */}
                <div className="bg-gray-100 rounded-lg p-4 flex flex-col min-h-[300px] md:min-h-full">
                    {isLoading && (
                         <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                            <div>
                                <Spinner />
                                <p className="mt-2 font-medium">Generating with Stability AI...</p>
                                <p className="text-sm text-gray-400">This may take 30-60 seconds</p>
                            </div>
                         </div>
                    )}
                    {error && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-red-500 mb-2">⚠️</div>
                                <p className="text-red-500 text-center">{error}</p>
                            </div>
                        </div>
                    )}
                    {generationResult && !isLoading && (
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 mb-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={generationResult.imageUrl} 
                                    alt="Generated interior design" 
                                    className="rounded-md w-full h-full object-cover shadow-lg" 
                                />
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleDownload}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                                <Button 
                                    onClick={() => navigator.share?.({ 
                                        title: 'AI Generated Interior Design',
                                        text: generationResult.metadata.prompt,
                                        url: generationResult.imageUrl 
                                    })}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                            </div>
                            
                            {/* Metadata */}
                            <div className="mt-3 p-3 bg-white rounded-lg text-sm">
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div><strong>Style:</strong> {generationResult.metadata.style}</div>
                                    <div><strong>Room:</strong> {generationResult.metadata.roomType.replace('_', ' ')}</div>
                                    <div><strong>Size:</strong> {generationResult.metadata.dimensions}</div>
                                    <div><strong>Generated:</strong> {new Date(generationResult.metadata.generatedAt).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {!isLoading && !generationResult && !error && (
                        <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-2 font-medium">Your AI-generated design will appear here</p>
                                <p className="text-sm text-gray-400">Powered by Stability AI</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};