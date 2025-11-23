'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Home,
  Cable as Cube,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import DashboardARPlacement from '@/components/DashboardARPlacement';

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
  const [showARPlacement, setShowARPlacement] = useState(false);
  const [arFullscreen, setArFullscreen] = useState(false);

  const handleARPlacementToggle = () => {
    setShowARPlacement(!showARPlacement);
    setArFullscreen(false);
  };

  const handleARFullscreenToggle = () => {
    setArFullscreen(!arFullscreen);
  };

  const handleARClose = () => {
    setShowARPlacement(false);
    setArFullscreen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="p-4 md:ml-64 md:p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back! Here are your design tools and features.
              </p>
            </div>
            {!showARPlacement && (
              <Button onClick={handleARPlacementToggle} variant="outline" className="gap-2">
                <Cube className="h-4 w-4" />
                Try AR Placement
              </Button>
            )}
          </div>

          {/* AR Placement Section */}
          {showARPlacement && (
            <div className="mb-6">
              <DashboardARPlacement
                isFullscreen={arFullscreen}
                onToggleFullscreen={handleARFullscreenToggle}
                onClose={handleARClose}
              />
            </div>
          )}

          {/* All Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allFeatures.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <Card className="hover:border-primary/60 transition-all duration-300 h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Simple Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardDescription>Total Features</CardDescription>
                <CardTitle className="text-4xl font-bold">{allFeatures.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>AI Tools</CardDescription>
                <CardTitle className="text-4xl font-bold">5</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Categories</CardDescription>
                <CardTitle className="text-4xl font-bold">4</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
