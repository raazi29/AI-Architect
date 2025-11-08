'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Move3D, Ruler } from 'lucide-react';

interface ARPreviewProps {
  productId: string;
  productName: string;
  modelUrl?: string;
  dimensions?: { width: number; height: number; depth: number };
}

export default function ARPreview({ productId, productName, modelUrl, dimensions }: ARPreviewProps) {
  const [isARSupported, setIsARSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [arData, setArData] = useState<any>(null);
  const [controls, setControls] = useState({
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    position: { x: 0, y: 0, z: 0 }
  });
  const [measurements, setMeasurements] = useState<{ unit: 'cm' | 'in' | 'ft'; visible: boolean }>({
    unit: 'cm',
    visible: true
  });

  // Do not generate mock AR data
  useEffect(() => {
    setIsLoading(false);
  }, [productId, modelUrl]);

  const handleARStart = async () => {
    if (!isARSupported) {
      alert('AR is not supported on your device. Please try on a compatible device.');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate AR initialization
    setTimeout(() => {
      setShowAR(true);
      setIsLoading(false);
    }, 1000);
 };

  const handleARStop = () => {
    setShowAR(false);
  };

  const handleRotate = (axis: 'x' | 'y' | 'z', direction: 'positive' | 'negative') => {
    setControls(prev => ({
      ...prev,
      rotation: {
        ...prev.rotation,
        [axis]: prev.rotation[axis] + (direction === 'positive' ? 15 : -15)
      }
    }));
  };

  const handleScale = (direction: 'in' | 'out') => {
    setControls(prev => ({
      ...prev,
      scale: direction === 'in' ? Math.min(prev.scale + 0.1, 2) : Math.max(prev.scale - 0.1, 0.5)
    }));
  };

  const handleMove = (axis: 'x' | 'y' | 'z', direction: 'positive' | 'negative') => {
    setControls(prev => ({
      ...prev,
      position: {
        ...prev.position,
        [axis]: prev.position[axis] + (direction === 'positive' ? 0.1 : -0.1)
      }
    }));
  };

  const toggleMeasurements = () => {
    setMeasurements(prev => ({ ...prev, visible: !prev.visible }));
  };

  const changeUnit = () => {
    const units: ('cm' | 'in' | 'ft')[] = ['cm', 'in', 'ft'];
    const currentIndex = units.indexOf(measurements.unit);
    const nextIndex = (currentIndex + 1) % units.length;
    setMeasurements(prev => ({ ...prev, unit: units[nextIndex] }));
  };

  // Check if WebAR is supported (simplified check)
  useEffect(() => {
    // In a real implementation, we would check for WebXR or ARKit/ARCore support
    setIsARSupported(!!window.WebAssembly);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move3D className="h-5 w-5" />
          AR Preview
        </CardTitle>
        <CardDescription>
          Visualize products in your space using augmented reality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!showAR ? (
            <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
              <div className="text-center p-6">
                <Move3D className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">AR Preview</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View {productName} in your space before purchasing
                </p>
                
                {!isARSupported ? (
                  <div className="text-center">
                    <p className="text-sm text-red-500 mb-2">AR not supported on this device</p>
                    <p className="text-xs text-muted-foreground">
                      Try on a device with AR capabilities
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleARStart} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Loading AR...' : 'Start AR Preview'}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {/* Simulated AR view */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="relative">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Move3D className="h-8 w-8 mx-auto text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-800">AR Model</span>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-xs font-medium">{productName}</p>
                      {dimensions && (
                        <p className="text-xs text-muted-foreground">
                          {dimensions.width}×{dimensions.height}×{dimensions.depth} cm
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* AR Controls Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg p-2 flex justify-center gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRotate('y', 'negative')}
                      className="h-8 w-8 p-0"
                      title="Rotate Left"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRotate('y', 'positive')}
                      className="h-8 w-8 p-0"
                      title="Rotate Right"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleScale('out')}
                      className="h-8 w-8 p-0"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleScale('in')}
                      className="h-8 w-8 p-0"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={toggleMeasurements}
                      className="h-8 w-8 p-0"
                      title="Toggle Measurements"
                    >
                      <Ruler className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {showAR && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Rotation: X:{controls.rotation.x}° Y:{controls.rotation.y}° Z:{controls.rotation.z}°
                </Badge>
                <Badge variant="outline">
                  Scale: {(controls.scale * 100).toFixed(0)}%
                </Badge>
                <Badge variant="outline" onClick={changeUnit} className="cursor-pointer">
                  Unit: {measurements.unit}
                </Badge>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleARStop}>
                  Exit AR
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>AR preview is for visualization purposes only. Actual product may vary.</p>
      </CardFooter>
    </Card>
  );
}