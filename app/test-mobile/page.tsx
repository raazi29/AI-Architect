'use client';

import { useState, useEffect } from 'react';

export default function TestMobilePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      const mobile = width < 768;
      setIsMobile(mobile);
      
      // Log mobile detection results
      const results = [
        `Window width: ${width}px`,
        `Is mobile: ${mobile}`,
        `Mobile breakpoint: ${mobile ? '< 768px' : '>= 768px'}`,
        `User agent: ${navigator.userAgent}`,
        `Touch support: ${'ontouchstart' in window}`,
      ];
      
      setTestResults(results);
      console.log('Mobile Detection Test:', results);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const testImageLoading = async () => {
    console.log('Testing mobile image loading...');
    
    try {
      // Test mobile endpoint
      const mobileEndpoint = '/api/feed/mobile?query=modern+interior&page=1&per_page=3';
      console.log('Fetching from mobile endpoint:', mobileEndpoint);
      
      const startTime = Date.now();
      const response = await fetch(mobileEndpoint);
      const endTime = Date.now();
      
      console.log('Mobile endpoint response:', {
        status: response.status,
        responseTime: `${endTime - startTime}ms`,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Mobile endpoint data:', {
          resultCount: data.results?.length || 0,
          mobileOptimized: data.mobile_optimized,
          hasMore: data.has_more,
          query: data.query
        });

        // Test image loading from results
        if (data.results && data.results.length > 0) {
          const testImage = data.results[0];
          console.log('Testing image loading for:', testImage);
          
          const imagePromises = [];
          const imageUrls = [
            testImage.image,
            testImage.src?.tiny,
            testImage.src?.small,
            testImage.src?.medium,
            testImage.src?.large
          ].filter(Boolean);

          imageUrls.forEach((url, index) => {
            const promise = new Promise((resolve) => {
              const img = new Image();
              const startLoad = Date.now();
              
              img.onload = () => {
                resolve({
                  url,
                  size: url.includes('tiny') ? 'tiny' : 
                        url.includes('small') ? 'small' : 
                        url.includes('medium') ? 'medium' : 
                        url.includes('large') ? 'large' : 'original',
                  loadTime: `${Date.now() - startLoad}ms`,
                  success: true,
                  width: img.naturalWidth,
                  height: img.naturalHeight
                });
              };
              
              img.onerror = () => {
                resolve({
                  url,
                  size: url.includes('tiny') ? 'tiny' : 
                        url.includes('small') ? 'small' : 
                        url.includes('medium') ? 'medium' : 
                        url.includes('large') ? 'large' : 'original',
                  loadTime: `${Date.now() - startLoad}ms`,
                  success: false,
                  error: 'Failed to load'
                });
              };
              
              img.src = url;
            });
            
            imagePromises.push(promise);
          });

          const imageResults = await Promise.all(imagePromises);
          console.log('Image loading test results:', imageResults);
        }
      } else {
        console.error('Mobile endpoint failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Mobile image loading test failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Mobile Progressive Loading Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Device Detection</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm text-gray-600 font-mono">
                {result}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Image Loading Test</h2>
          <button
            onClick={testImageLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Mobile Image Loading
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Click the button to test mobile image loading. Check the browser console for detailed results.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Open browser developer tools (F12)</li>
            <li>Go to the Console tab</li>
            <li>Click "Test Mobile Image Loading" button</li>
            <li>Check console logs for test results</li>
            <li>Resize browser window to test mobile/desktop detection</li>
            <li>Use device emulation in dev tools to simulate mobile devices</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/design-feed"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go to Design Feed →
          </a>
        </div>
      </div>
    </div>
  );
}