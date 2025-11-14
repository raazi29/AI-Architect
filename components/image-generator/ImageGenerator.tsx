"use client";

import React, { useState, useCallback, useEffect } from 'react';
import {
  generateInteriorImage,
  editInteriorImage,
  downloadImage,
 GenerationResult
} from './services/stabilityService';
import { FileUpload } from './shared/FileUpload';
import { Spinner } from './shared/Spinner';
import { Button } from '@/components/ui/button';
import { Download, Share2, RefreshCw, Maximize2 } from 'lucide-react';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by ensuring client-side only rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      base64: await base64EncodedDataPromise,
      mimeType: file.type,
    };
  };

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
      // Pass empty options object since we're relying purely on user prompt
      const options = {};

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
  }, [prompt, uploadedFile]);

  const handleDownload = () => {
    if (generationResult?.downloadUrl) {
      downloadImage(generationResult.downloadUrl, `${prompt.slice(0, 30)}-${Date.now()}.png`);
    }
  };

  const handlePreview = (imageUrl: string) => {
    if (!imageUrl) {
      return;
    }

    const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!previewWindow) {
      console.warn('Browser blocked preview window');
      return;
    }

    previewWindow.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />
            <title>AI Interior Preview</title>
            <style>
                body { margin: 0; background: #0f172a; display:flex; align-items:center; justify-content:center; height:100vh; }
                img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 20px 45px rgba(15,23,42,0.45); }
            </style>
        </head><body><img src="${imageUrl}" alt="AI Interior Preview" /></body></html>`);
    previewWindow.document.close();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {!isClient ? (
        // Loading placeholder during server-side rendering or initial client mount
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
            <Spinner />
            <p className="mt-4 text-lg font-medium">Loading AI Generator...</p>
            <p className="text-sm text-gray-400">Initializing components</p>
          </div>
        </div>
      ) : (
        <>
          {/* Controls Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Reference (Optional)</label>
              <FileUpload onFileSelect={setUploadedFile} />
            </div>

            {/* Prompt Section */}
            <div className="mt-6">
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Describe Your Vision <span className="text-red-500">*</span>
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g., a spacious living room with a stone fireplace and large windows overlooking a forest"
                className="w-full p-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-gray-500">💡 Be as specific as possible in your description for best results</p>
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      <span className="ml-2">Generating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
                <Spinner />
                <p className="mt-4 text-lg font-medium">Generating your design...</p>
                <p className="text-sm text-gray-400">This may take 30-60 seconds</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="text-red-500 mb-4 text-4xl">⚠️</div>
                <p className="text-red-600 text-lg font-medium mb-2">Generation Failed</p>
                <p className="text-red-500 text-center max-w-md">{error}</p>
              </div>
            </div>
          )}

          {/* Result State */}
          {generationResult && !isLoading && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative group">
                <img
                  src={generationResult.imageUrl}
                  alt="Generated interior design"
                  className="w-full h-auto max-h-[600px] object-contain bg-gray-100 cursor-zoom-in transition-transform group-hover:scale-[1.01]"
                  onClick={() => handlePreview(generationResult.imageUrl)}
                />

                <div className="absolute inset-0 bg-transparent transition-all duration-300 flex items-center justify-center pointer-events-none group-hover:bg-black/40">
                  <Button
                    onClick={() => handlePreview(generationResult.imageUrl)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 hover:bg-gray-100 pointer-events-auto"
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Full Preview
                  </Button>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleDownload} className="bg-green-500 hover:bg-green-600 text-white px-6">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button onClick={() => handlePreview(generationResult.imageUrl)} variant="outline" className="px-6">
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'AI Generated Interior Design',
                          text: generationResult.metadata?.prompt || 'Generated image',
                          url: generationResult.imageUrl,
                        });
                      }
                    }}
                    variant="outline"
                    className="px-6"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !generationResult && !error && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium mb-2">Ready to Generate</p>
                <p className="text-sm text-gray-400">Describe your vision above and click Generate Image</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};