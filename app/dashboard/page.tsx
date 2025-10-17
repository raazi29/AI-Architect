'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wand2, 
  PenTool, 
  Compass, 
  Camera, 
  Palette, 
  Sparkles, 
  LayoutDashboard,
  IndianRupee,
  Layout,
  MessageCircle,
  Users,
  BarChart3,
  Mountain,
  Calculator,
  ChevronRight,
  Home
} from 'lucide-react';

// Complete list of all features
const allFeatures = [
  { title: 'Dashboard', description: 'Overview and quick access', icon: Home, href: '/dashboard' },
  { title: 'AI Generator', description: 'AI-powered interior design generation', icon: Wand2, href: '/ai-generator' },
  { title: 'Design Feed', description: 'Architecture and interior design inspiration', icon: Camera, href: '/design-feed' },
  { title: 'AR Placement', description: 'Augmented reality furniture placement', icon: LayoutDashboard, href: '/ar-placement' },
  { title: 'Smart Shopping', description: 'Interior design product shopping', icon: LayoutDashboard, href: '/shopping' },
  { title: 'Floor Plans', description: 'Floor plan generation and editing', icon: PenTool, href: '/floor-plans' },
  { title: 'AI Materials', description: 'Material suggestions and recommendations', icon: Sparkles, href: '/ai-materials' },
  { title: 'AI Budget', description: 'Budget planning and cost estimation', icon: IndianRupee, href: '/ai-budget' },
  { title: 'AI Colors', description: 'Color palette generation', icon: Palette, href: '/ai-colors' },
  { title: 'AI Layout', description: 'Room layout optimization', icon: Layout, href: '/ai-layout' },
  { title: 'Vastu', description: 'Vastu Shastra analysis and guidance', icon: Mountain, href: '/vastu' },
  { title: 'Project Management', description: 'Cost estimation and project planning', icon: Calculator, href: '/project-management/cost-estimator' },
  { title: 'AI Assistant', description: 'Chat with AI for design advice', icon: MessageCircle, href: '/assistant' },
  { title: 'Collaborate', description: 'Team collaboration features', icon: Users, href: '/collaborate' },
  { title: 'Analytics', description: 'Design analytics and insights', icon: BarChart3, href: '/analytics' }
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="ml-64 p-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Access all your design tools and features
            </p>
          </div>

          {/* All Features List */}
          <Card>
            <CardHeader>
              <CardTitle>All Features</CardTitle>
              <CardDescription>Complete list of available tools and services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {allFeatures.map((feature) => (
                  <Link key={feature.title} href={feature.href}>
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted group-hover:bg-muted/80">
                        <feature.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{feature.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{feature.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Simple Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Features</CardDescription>
                <CardTitle className="text-2xl">15</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>AI Tools</CardDescription>
                <CardTitle className="text-2xl">5</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Categories</CardDescription>
                <CardTitle className="text-2xl">4</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
