import dynamic from 'next/dynamic'

const Navigation = dynamic(() => import('@/components/navigation').then(mod => mod.Navigation), { ssr: false })
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Wand2,
  ImageIcon,
  Cable as Cube,
  ShoppingBag,
  PenTool,
  MessageCircle,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react"

const features = [
  {
    title: "AI Interior Generator",
    description: "Transform your rooms with AI-powered design suggestions",
    icon: Wand2,
    href: "/ai-generator",
    color: "text-primary",
  },
  {
    title: "Design Feed",
    description: "Browse curated interior design inspiration",
    icon: ImageIcon,
    href: "/design-feed",
    color: "text-accent",
  },
  {
    title: "AR Furniture Placement",
    description: "Visualize furniture in your space with augmented reality",
    icon: Cube,
    href: "/ar-placement",
    color: "text-primary",
  },
  {
    title: "Smart Shopping",
    description: "Temporarily unavailable - coming back soon!",
    icon: ShoppingBag,
    href: "/shopping",
    color: "text-accent",
  },
  {
    title: "Floor Plan Generator",
    description: "Create and modify floor plans with AI assistance",
    icon: PenTool,
    href: "/floor-plans",
    color: "text-primary",
  },
  {
    title: "AI Assistant",
    description: "Get personalized design advice and recommendations",
    icon: MessageCircle,
    href: "/assistant",
    color: "text-accent",
  },
  {
    title: "Social Collaboration",
    description: "Share designs and collaborate with others",
    icon: Users,
    href: "/collaborate",
    color: "text-primary",
  },
  {
    title: "Analytics Dashboard",
    description: "Track your design projects and preferences",
    icon: BarChart3,
    href: "/analytics",
    color: "text-accent",
  },
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-muted">
              <Sparkles className="h-8 w-8 text-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">AI Interior Design & Architecture</h1>
              <p className="text-sm text-muted-foreground mt-1">Professional-grade design tools powered by AI</p>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Transform your space with AI-powered interior design, augmented reality visualization, and smart shopping integration.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="/auth/signup"><Button>Get started</Button></a>
            <a href="/auth/signin"><Button variant="outline">Sign in</Button></a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
          {features.map((feature, index) => (
            <a href={feature.href} key={feature.title} style={{ animationDelay: `${index * 50}ms` }}>
              <Card className="group h-full border transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-muted">
                      <feature.icon className={`h-6 w-6 text-foreground`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed mb-4">{feature.description}</CardDescription>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Sparkles className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle className="text-3xl font-bold text-foreground">10,000+</CardTitle>
              </div>
              <CardDescription className="text-base">Design Templates</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-card border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Cube className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle className="text-3xl font-bold text-foreground">50,000+</CardTitle>
              </div>
              <CardDescription className="text-base">Furniture Items</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-card border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Wand2 className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle className="text-3xl font-bold text-foreground">AI-Powered</CardTitle>
              </div>
              <CardDescription className="text-base">Smart Recommendations</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
