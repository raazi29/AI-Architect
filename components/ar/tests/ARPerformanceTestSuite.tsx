import React, { useState, useEffect, useRef } from 'react';

interface PerformanceTestResult {
  deviceType: string;
  quality: 'high' | 'medium' | 'low';
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  errors: string[];
  warnings: string[];
}

const DEVICE_PROFILES = [
  {
    name: 'High-end Desktop',
    capabilities: { maxTextureSize: 16384, memoryGB: 16, isLowEndDevice: false }
  },
  {
    name: 'Mid-range Laptop', 
    capabilities: { maxTextureSize: 8192, memoryGB: 8, isLowEndDevice: false }
  },
  {
    name: 'High-end Mobile',
    capabilities: { maxTextureSize: 4096, memoryGB: 6, isLowEndDevice: false }
  },
  {
    name: 'Mid-range Mobile',
    capabilities: { maxTextureSize: 2048, memoryGB: 4, isLowEndDevice: false }
  },
  {
    name: 'Low-end Mobile',
    capabilities: { maxTextureSize: 1024, memoryGB: 1, isLowEndDevice: true }
  }
];

export const ARPerformanceTestSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<PerformanceTestResult[]>([]);
  const [testProgress, setTestProgress] = useState(0);

  const simulatePerformanceTest = async (profile: typeof DEVICE_PROFILES[0]): Promise<PerformanceTestResult> => {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Simulate different quality levels
      const qualityTests = ['high', 'medium', 'low'] as const;
      let bestQuality: 'high' | 'medium' | 'low' = 'low';
      let bestFps = 0;
      let bestMemoryUsage = Infinity;

      for (const quality of qualityTests) {
        const triangleCount = quality === 'high' ? 50000 : quality === 'medium' ? 20000 : 5000;
        const estimatedMemory = Math.round(triangleCount * 0.001 + (quality === 'high' ? 500 : quality === 'medium' ? 200 : 100));
        
        // Simulate FPS based on device capabilities
        let fps = profile.capabilities.isLowEndDevice ? 30 : 60;
        if (quality === 'high') fps *= 0.5;
        else if (quality === 'medium') fps *= 0.8;
        
        if (fps >= 25 && estimatedMemory < profile.capabilities.memoryGB * 0.8 * 1024) {
          bestQuality = quality;
          bestFps = Math.round(fps);
          bestMemoryUsage = estimatedMemory;
        }
        
        if (fps < 20) warnings.push(`${quality} quality: Low FPS (${fps})`);
        if (estimatedMemory > profile.capabilities.memoryGB * 0.7 * 1024) {
          warnings.push(`${quality} quality: High memory usage (${estimatedMemory}MB)`);
        }
      }

      return {
        deviceType: profile.name,
        quality: bestQuality,
        fps: bestFps,
        memoryUsage: bestMemoryUsage,
        loadTime: Math.round(performance.now() - startTime),
        renderTime: Math.round((performance.now() - startTime) / 3),
        errors,
        warnings
      };

    } catch (error) {
      return {
        deviceType: profile.name,
        quality: 'low',
        fps: 0,
        memoryUsage: 0,
        loadTime: Math.round(performance.now() - startTime),
        renderTime: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setTestProgress(0);

    const testResults: PerformanceTestResult[] = [];

    for (let i = 0; i < DEVICE_PROFILES.length; i++) {
      setTestProgress((i / DEVICE_PROFILES.length) * 100);
      
      const result = await simulatePerformanceTest(DEVICE_PROFILES[i]);
      testResults.push(result);
      setResults([...testResults]);
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTestProgress(100);
    setIsRunning(false);
  };

  const generateReport = () => {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.errors.length === 0).length;
    const avgFPS = results.reduce((sum, r) => sum + r.fps, 0) / totalTests;
    const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / totalTests;

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      passRate: (passedTests / totalTests) * 100,
      avgFPS: Math.round(avgFPS),
      avgLoadTime: Math.round(avgLoadTime),
      recommendations: [
        ...(results.some(r => r.deviceType.includes('Low-end')) ? 
          ['Consider implementing aggressive LOD optimization for mobile devices'] : []),
        ...(results.some(r => r.quality === 'low') ? 
          ['Optimize high-quality assets to improve performance on more devices'] : []),
        ...(results.some(r => r.fps < 30) ? 
          ['Implement dynamic quality scaling to maintain consistent FPS'] : [])
      ]
    };
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">AR Performance Test Suite</h2>
      
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running Tests...' : 'Run Performance Tests'}
        </button>
        
        {isRunning && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${testProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Progress: {Math.round(testProgress)}%
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Device Performance Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold text-sm mb-2">{result.deviceType}</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span className={`font-semibold ${
                      result.quality === 'high' ? 'text-green-600' :
                      result.quality === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.quality.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>FPS:</span>
                    <span className={`font-semibold ${
                      result.fps >= 30 ? 'text-green-600' :
                      result.fps >= 20 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.fps}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory:</span>
                    <span>{result.memoryUsage}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Load Time:</span>
                    <span>{result.loadTime}ms</span>
                  </div>
                </div>
                
                {result.errors.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    <div className="font-semibold">Errors:</div>
                    {result.errors.map((error, i) => (
                      <div key={i}>• {error}</div>
                    ))}
                  </div>
                )}
                
                {result.warnings.length > 0 && (
                  <div className="mt-2 text-xs text-yellow-600">
                    <div className="font-semibold">Warnings:</div>
                    {result.warnings.map((warning, i) => (
                      <div key={i}>• {warning}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {results.length === DEVICE_PROFILES.length && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Performance Summary</h3>
              {(() => {
                const report = generateReport();
                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Tests:</span>
                      <span>{report.totalTests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passed:</span>
                      <span className="text-green-600">{report.passedTests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="text-red-600">{report.failedTests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pass Rate:</span>
                      <span className="font-semibold">{report.passRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average FPS:</span>
                      <span>{report.avgFPS}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Load Time:</span>
                      <span>{report.avgLoadTime}ms</span>
                    </div>
                    
                    {report.recommendations.length > 0 && (
                      <div className="mt-4">
                        <div className="font-semibold mb-2 text-blue-800">Recommendations:</div>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {report.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};