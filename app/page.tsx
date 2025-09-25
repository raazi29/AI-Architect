import { Navigation } from "@/components/navigation"
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
    description: "Find and compare furniture from multiple retailers",
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
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Welcome to AI Interior Design and Architect</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Transform your space with AI-powered interior design, augmented reality visualization, and smart shopping
            integration. Create beautiful rooms with professional-grade tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature) => (
            <a href={feature.href} key={feature.title}>
              <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                  <div className="mt-3 font-medium text-primary hover:text-primary/80">
                    Get Started →
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-primary">10,000+</CardTitle>
              <CardDescription>Design Templates</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-accent">50,000+</CardTitle>
              <CardDescription>Furniture Items</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-primary">AI-Powered</CardTitle>
              <CardDescription>Smart Recommendations</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
