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
  },
  {
    title: "AR Visualization",
    description: "See furniture in your space before buying with augmented reality",
    icon: Eye,
  },
  {
    title: "Smart Shopping",
    description: "Shop curated furniture and decor directly from your designs",
    icon: ShoppingBag,
  },
  {
    title: "Floor Plans",
    description: "Generate and optimize floor plans with AI assistance",
    icon: PenTool,
  },
  {
    title: "Design Assistant",
    description: "Get 24/7 AI-powered design advice and recommendations",
    icon: MessageCircle,
  },
  {
    title: "Style Gallery",
    description: "Browse curated designs from professionals and community",
    icon: ImageIcon,
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              ArchiAI
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-40 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8 hover:bg-primary/10 transition-colors">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI-Powered Interior Design</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight">
            Design Spaces That Inspire
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Professional interior design powered by AI. Get instant design suggestions, visualize with AR, and shop curated furniture—all in one intelligent platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-8 h-12 text-base">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button size="lg" className="px-8 h-12 text-base">
                    Start Designing Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="secondary" size="lg" className="px-8 h-12 text-base">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>100K+ users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative px-6 py-32 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              Everything you need to design professional interiors with confidence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur"></div>
                <Card className="relative border border-border/50 hover:border-primary/40 transition-all duration-500 bg-background/80 backdrop-blur-sm hover:bg-background">
                  <CardContent className="p-8">
                    <div className="inline-flex p-3 rounded-lg bg-primary/10 text-primary mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative px-6 py-24 bg-secondary/30 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10K+", label: "Design Templates" },
              { value: "50K+", label: "Furniture Items" },
              { value: "100K+", label: "Happy Users" },
              { value: "1M+", label: "Designs Created" }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative px-6 py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">
                Why Choose ArchiAI?
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                We combine cutting-edge AI technology with intuitive design tools to help you create beautiful spaces.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl blur-2xl"></div>
              <div className="relative grid grid-cols-2 gap-6">
                {[
                  { value: "10K+", label: "Design Templates" },
                  { value: "50K+", label: "Furniture Items" },
                  { value: "100K+", label: "Happy Users" },
                  { value: "1M+", label: "Designs Created" }
                ].map((item) => (
                  <div key={item.label} className="p-6 bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl text-center hover:border-primary/50 transition-colors">
                    <div className="text-3xl font-bold mb-2">{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-32 border-t border-border/40">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-16 text-center">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-foreground/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6 tracking-tight">
                Ready to Transform?
              </h2>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 font-light">
                Start designing beautiful spaces today. No credit card required.
              </p>
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="px-10 h-12 text-base font-medium">
                    Start Designing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="px-10 h-12 text-base font-medium">
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg">ArchiAI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Professional interior design powered by artificial intelligence.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Features</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Pricing</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Gallery</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">About</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Blog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Privacy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Terms</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ArchiAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}