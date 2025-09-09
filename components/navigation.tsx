"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Home,
  Wand2,
  ImageIcon,
  Cable as Cube,
  ShoppingBag,
  PenTool,
  MessageCircle,
  Users,
  BarChart3,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "AI Generator", href: "/ai-generator", icon: Wand2 },
  { name: "Design Feed", href: "/design-feed", icon: ImageIcon },
  { name: "AR Placement", href: "/ar-placement", icon: Cube },
  { name: "Smart Shopping", href: "/shopping", icon: ShoppingBag },
  { name: "Floor Plans", href: "/floor-plans", icon: PenTool },
  { name: "AI Assistant", href: "/assistant", icon: MessageCircle },
  { name: "Collaborate", href: "/collaborate", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

export function Navigation() {
  const pathname = usePathname()

  const handleNavClick = (href: string, name: string) => {
    console.log("Navigation clicked:", name, "->", href)
  }

  return (
    <nav className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Cube className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">AR Interior</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => handleNavClick(item.href, item.name)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="border-t border-sidebar-border p-4">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <User className="h-4 w-4" />
            <span className="text-sm">Sign in with Google</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
