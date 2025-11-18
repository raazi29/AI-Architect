"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Wand2,
  ImageIcon,
  Box,
  ShoppingBag,
  PenTool,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Star,
  CheckCircle,
  Lightbulb,
  Palette,
  Home,
  Users,
  Eye,
  Smartphone,
} from "lucide-react"
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    title: "AI Design Generator",
    description: "Create stunning interiors with intelligent design suggestions",
    icon: Wand2,
    gradient: "from-slate-500 to-slate-700",
  },
  {
    title: "AR Visualization",
    description: "See furniture in your space before buying with augmented reality",
    icon: Eye,
    gradient: "from-slate-600 to-slate-800",
  },
  {
    title: "Smart Shopping",
    description: "Shop curated furniture and decor directly from your designs",
    icon: ShoppingBag,
    gradient: "from-slate-500 to-slate-700",
  },
  {
    title: "Floor Plans",
    description: "Generate and optimize floor plans with AI assistance",
    icon: PenTool,
    gradient: "from-slate-600 to-slate-800",
  },
  {
    title: "Design Assistant",
    description: "Get 24/7 AI-powered design advice and recommendations",
    icon: MessageCircle,
    gradient: "from-slate-500 to-slate-700",
  },
  {
    title: "Style Gallery",
    description: "Browse curated designs from professionals and community",
    icon: ImageIcon,
    gradient: "from-slate-600 to-slate-800",
  },
];

const benefits = [
  "Save time with AI-powered suggestions",
  "Visualize before you buy",
  "Access to 50,000+ furniture items",
  "Professional design tools",
  "Mobile-friendly experience",
  "Free to get started"
];

export default function StartingPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-slate-500 to-slate-700 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
              ArchiAI
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800 shadow-lg">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800 shadow-lg">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 mb-8">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">AI-Powered Interior Design</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Design Your
            <span className="block bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
              Dream Space
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Transform any room with AI-powered design suggestions, 
            AR furniture placement, and smart shopping. 
            Professional interior design made simple.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800 shadow-xl">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl">
                    Start Designing Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-slate-300 text-slate-700 hover:bg-slate-50">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Secure & private</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="font-medium">100K+ happy users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Professional tools powered by artificial intelligence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={feature.title} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <CardContent className="p-8 relative">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Why Choose ArchiAI?
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                We combine cutting-edge AI technology with beautiful design to help you create spaces you&apos;ll love.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-3xl opacity-20" />
              <Card className="relative border-0 shadow-2xl">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">10K+</div>
                      <div className="text-sm text-slate-600">Design Templates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">50K+</div>
                      <div className="text-sm text-slate-600">Furniture Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">100K+</div>
                      <div className="text-sm text-slate-600">Happy Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">1M+</div>
                      <div className="text-sm text-slate-600">Designs Created</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800">
            <CardContent className="p-12 text-center">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-slate-500 to-slate-700 mb-6">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Space?
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
                Join thousands of users designing their dream interiors with AI
              </p>
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800 shadow-xl">
                    Start Designing Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl">
                    Start Designing Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/50 backdrop-blur-sm px-6 py-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-slate-500 to-slate-700">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
              ArchiAI
            </span>
          </div>
          <p className="text-slate-600 mb-4">AI-powered interior design for everyone</p>
          <div className="flex justify-center space-x-6 text-sm text-slate-500">
            <Link href="#" className="hover:text-slate-700 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-700 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-700 transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-slate-500 mt-6">&copy; 2024 ArchiAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}