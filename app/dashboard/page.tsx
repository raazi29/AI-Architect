'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wand2, 
  PenTool, 
  Compass, 
  Home, 
  Palette, 
  Camera, 
  Layers, 
  Sparkles, 
  ArrowRight,
  Play,
  Plus,
  Bookmark,
  Eye,
  Heart,
  Share2,
  Download,
  Grid3X3,
  LayoutDashboard,
  Zap
} from 'lucide-react';

// Design tools and features
const designTools = [
  {
    title: 'AI Interior Generator',
    description: 'Generate stunning interior designs with AI',
    icon: Wand2,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    href: '/ai-generator',
    badge: 'New'
  },
  {
    title: 'Floor Plan Creator',
    description: 'Create professional floor plans instantly',
    icon: LayoutDashboard,
    color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    href: '/floor-plans',
    badge: 'Popular'
  },
  {
    title: 'Vastu Analyzer',
    description: 'Optimize your designs with Vastu principles',
    icon: Compass,
    color: 'bg-gradient-to-br from-green-500 to-emerald-500',
    href: '/vastu',
    badge: 'Enhanced'
  },
  {
    title: 'Design Feed',
    description: 'Explore curated design inspirations',
    icon: Camera,
    color: 'bg-gradient-to-br from-orange-500 to-red-500',
    href: '/design-feed'
  }
];

const quickActions = [
  { title: 'New Project', icon: Plus, color: 'text-blue-600' },
  { title: 'Upload Design', icon: Camera, color: 'text-green-600' },
  { title: 'Browse Gallery', icon: Grid3X3, color: 'text-purple-600' },
  { title: 'AI Assistant', icon: Sparkles, color: 'text-orange-600' }
];

const recentProjects = [
  {
    title: 'Modern Living Room',
    type: 'Interior Design',
    status: 'Completed',
    image: '/api/placeholder/300/200',
    likes: 24,
    views: 156
  },
  {
    title: 'Minimalist Kitchen',
    type: 'Kitchen Design',
    status: 'In Progress',
    image: '/api/placeholder/300/200',
    likes: 18,
    views: 89
  },
  {
    title: 'Luxury Bedroom',
    type: 'Bedroom Design',
    status: 'Draft',
    image: '/api/placeholder/300/200',
    likes: 32,
    views: 203
  }
];

const inspirationCategories = [
  { name: 'Modern', count: 1250, color: 'bg-blue-100 text-blue-800' },
  { name: 'Minimalist', count: 890, color: 'bg-green-100 text-green-800' },
  { name: 'Luxury', count: 567, color: 'bg-purple-100 text-purple-800' },
  { name: 'Industrial', count: 432, color: 'bg-gray-100 text-gray-800' },
  { name: 'Scandinavian', count: 678, color: 'bg-cyan-100 text-cyan-800' },
  { name: 'Bohemian', count: 345, color: 'bg-pink-100 text-pink-800' }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Design Studio
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Create stunning interiors with AI-powered design tools
          </p>
        </div>
        <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Sparkles className="mr-2 h-5 w-5" />
          Start Creating
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="inspiration">Inspiration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Design Tools Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {designTools.map((tool) => (
              <Card key={tool.title} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className={`${tool.color} p-6 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -mr-10 -mt-10" />
                    <tool.icon className="h-8 w-8 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{tool.title}</h3>
                    <p className="text-white/90 text-sm">{tool.description}</p>
                    {tool.badge && (
                      <Badge className="absolute top-4 right-4 bg-white/20 text-white border-white/30">
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Jump into your most used design workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.title}
                    variant="outline"
                    className="h-16 flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-sm">{action.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {/* Recent Projects */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                Recent Projects
              </CardTitle>
              <CardDescription>
                Your latest design creations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentProjects.map((project) => (
                  <Card key={project.title} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <Badge variant="secondary" className="mb-2">
                            {project.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{project.title}</h3>
                          <Badge 
                            variant={project.status === 'Completed' ? 'default' : 
                                   project.status === 'In Progress' ? 'secondary' : 'outline'}
                          >
                            {project.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {project.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {project.views}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspiration" className="space-y-6">
          {/* Design Categories */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-500" />
                Design Categories
              </CardTitle>
              <CardDescription>
                Explore different design styles and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inspirationCategories.map((category) => (
                  <Card key={category.name} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.count} designs
                          </p>
                        </div>
                        <Badge className={category.color}>
                          Popular
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Collections */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-green-500" />
                Featured Collections
              </CardTitle>
              <CardDescription>
                Curated design collections for inspiration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                    <h3 className="text-xl font-semibold mb-2">Modern Minimalism</h3>
                    <p className="text-blue-100 mb-4">Clean lines, neutral colors, and functional design</p>
                    <Button variant="secondary" size="sm">
                      <Play className="mr-2 h-4 w-4" />
                      Explore Collection
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="aspect-video bg-gradient-to-br from-green-500 to-teal-600 rounded-lg p-6 text-white">
                    <h3 className="text-xl font-semibold mb-2">Luxury Interiors</h3>
                    <p className="text-green-100 mb-4">Premium materials and sophisticated aesthetics</p>
                    <Button variant="secondary" size="sm">
                      <Play className="mr-2 h-4 w-4" />
                      Explore Collection
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
