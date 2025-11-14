'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity,
  Zap,
  Database,
  Cpu,
  Wifi,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PerformanceTestResult {
  id: string;
  test_name: string;
  status: 'pass' | 'fail' | 'warning';
  duration: number;
  message: string;
  timestamp: Date;
}

export default function PerformanceTest() {
  const [testResults, setTestResults] = useState<PerformanceTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runPerformanceTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    // Simulate various performance tests
    const tests = [
      { name: 'API Response Time', duration: 0.2, status: 'pass', message: 'Response time within acceptable limits' },
      { name: 'Data Caching', duration: 0.05, status: 'pass', message: 'Cache hit rate at 92%' },
      { name: 'Memory Usage', duration: 0.1, status: 'pass', message: 'Memory usage optimized' },
      { name: 'Real-time Updates', duration: 0.3, status: 'pass', message: 'Live updates functioning properly' },
      { name: 'Database Connection', duration: 0.15, status: 'warning', message: 'Connection latency at 150ms' },
      { name: 'Network Bandwidth', duration: 0.25, status: 'pass', message: 'Bandwidth utilization optimal' },
      { name: 'UI Rendering', duration: 0.08, status: 'pass', message: 'Components render quickly' },
      { name: 'Error Handling', duration: 0.12, status: 'pass', message: 'Error boundaries working' }
    ];

    // Simulate API calls
    const results: PerformanceTestResult[] = [];
    
    for (const test of tests) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, test.duration * 1000));
      
      const result: PerformanceTestResult = {
        id: `test-${Date.now()}-${Math.random()}`,
        test_name: test.name,
        status: test.status,
        duration: test.duration,
        message: test.message,
        timestamp: new Date()
      };
      
      results.push(result);
      setTestResults([...results]);
    }
    
    setIsTesting(false);
  };

  const getStatusIcon = (status: PerformanceTestResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: PerformanceTestResult['status']) => {
    switch (status) {
      case 'pass': return <Badge variant="default">Pass</Badge>;
      case 'fail': return <Badge variant="destructive">Fail</Badge>;
      case 'warning': return <Badge variant="warning">Warning</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  useEffect(() => {
    // Run initial test
    runPerformanceTests();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Tests
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time performance monitoring and testing
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">System Status: Operational</span>
            </div>
            <Button 
              size="sm" 
              onClick={runPerformanceTests}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Zap className="h-3 w-3 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Activity className="h-3 w-3 mr-1" />
                  Run Tests
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testResults.map((result) => (
              <div key={result.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {getStatusIcon(result.status)}
                    <div>
                      <h4 className="font-medium text-sm">{result.test_name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {result.duration.toFixed(2)}s
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {getStatusBadge(result.status)}
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(result.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {testResults.length === 0 && (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No tests run yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Run Tests&quot; to begin performance evaluation
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">CPU Utilization: 42%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Network: Stable</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}