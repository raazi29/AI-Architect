'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestDatabasePage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
    console.log(message);
  };

  const testConnection = async () => {
    setResults([]);
    setLoading(true);
    
    try {
      addResult('🔍 Testing Supabase connection...');
      
      // Test 1: Check if we can connect
      addResult('📡 Step 1: Testing basic connection...');
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('count');
      
      if (testError) {
        addResult(`❌ Connection failed: ${testError.message}`);
        addResult(`Details: ${testError.details || 'No details'}`);
        addResult(`Hint: ${testError.hint || 'No hint'}`);
        
        if (testError.message.includes('relation') && testError.message.includes('does not exist')) {
          addResult('');
          addResult('💡 SOLUTION: Tables don\'t exist!');
          addResult('Run this in Supabase SQL Editor:');
          addResult('supabase/SETUP_DATABASE.sql');
        } else if (testError.message.includes('row-level security')) {
          addResult('');
          addResult('💡 SOLUTION: RLS is blocking!');
          addResult('Run this in Supabase SQL Editor:');
          addResult('ALTER TABLE projects DISABLE ROW LEVEL SECURITY;');
        }
        setLoading(false);
        return;
      }
      
      addResult('✅ Connection successful!');
      
      // Test 2: Try to select projects
      addResult('');
      addResult('📊 Step 2: Loading projects...');
      const { data: projects, error: selectError } = await supabase
        .from('projects')
        .select('*');
      
      if (selectError) {
        addResult(`❌ Select failed: ${selectError.message}`);
        setLoading(false);
        return;
      }
      
      addResult(`✅ Found ${projects?.length || 0} projects`);
      if (projects && projects.length > 0) {
        projects.forEach((p, i) => {
          addResult(`  ${i + 1}. ${p.name} - ₹${p.budget?.toLocaleString('en-IN')}`);
        });
      }
      
      // Test 3: Try to insert a test project
      addResult('');
      addResult('📝 Step 3: Testing insert...');
      const testProject = {
        name: `Test Project ${Date.now()}`,
        budget: 1000000,
        state: 'Maharashtra',
        city: 'Mumbai',
        climate_zone: 'tropical',
        project_type: 'residential'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('projects')
        .insert(testProject)
        .select()
        .single();
      
      if (insertError) {
        addResult(`❌ Insert failed: ${insertError.message}`);
        addResult(`Details: ${insertError.details || 'No details'}`);
        setLoading(false);
        return;
      }
      
      addResult(`✅ Insert successful! Created project: ${insertData.name}`);
      
      // Test 4: Delete the test project
      addResult('');
      addResult('🗑️ Step 4: Cleaning up test project...');
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        addResult(`⚠️ Delete failed: ${deleteError.message}`);
      } else {
        addResult('✅ Test project deleted');
      }
      
      // Final result
      addResult('');
      addResult('🎉 ALL TESTS PASSED!');
      addResult('Your database is working correctly!');
      addResult('');
      addResult('You can now use the project management page:');
      addResult('/project-management/cost-estimator');
      
    } catch (error: any) {
      addResult(`❌ Exception: ${error.message}`);
      addResult('');
      addResult('💡 Check your .env file:');
      addResult('NEXT_PUBLIC_SUPABASE_URL=your_url');
      addResult('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This page tests your Supabase database connection and helps diagnose issues.
            </p>
            
            <Button onClick={testConnection} disabled={loading}>
              {loading ? 'Testing...' : 'Run Database Test'}
            </Button>
            
            {results.length > 0 && (
              <Card className="bg-black text-green-400 font-mono text-sm">
                <CardContent className="pt-6">
                  <pre className="whitespace-pre-wrap">
                    {results.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Fixes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">If tables don't exist:</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Run <code className="bg-muted px-2 py-1 rounded">supabase/SETUP_DATABASE.sql</code> in Supabase SQL Editor
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">If RLS is blocking:</h3>
              <code className="block bg-muted p-3 rounded text-sm">
                ALTER TABLE projects DISABLE ROW LEVEL SECURITY;<br/>
                ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;<br/>
                ALTER TABLE materials DISABLE ROW LEVEL SECURITY;<br/>
                ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">If connection fails:</h3>
              <p className="text-sm text-muted-foreground">
                Check your <code className="bg-muted px-2 py-1 rounded">&apos;env</code> file has correct Supabase URL and key
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
