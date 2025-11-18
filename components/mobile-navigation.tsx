"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
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
  Mountain,
  Calculator,
  Palette,
  Layout,
  Sparkles,
  IndianRupee,
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "AI Generator", href: "/ai-generator", icon: Wand2 },
  { name: "Design Feed", href: "/design-feed", icon: ImageIcon },
  { name: "AR Placement", href: "/ar-placement", icon: Cube },
  { name: "Smart Shopping", href: "/shopping", icon: ShoppingBag },
  { name: "Floor Plans", href: "/floor-plans", icon: PenTool },
  { name: "AI Materials", href: "/ai-materials", icon: Sparkles },
  { name: "AI Budget", href: "/ai-budget", icon: IndianRupee },
  { name: "AI Colors", href: "/ai-colors", icon: Palette },
  { name: "AI Layout", href: "/ai-layout", icon: Layout },
  { name: "Vastu", href: "/vastu", icon: Mountain },
  { name: "Project Management", href: "/project-management/cost-estimator", icon: Calculator },
  { name: "AI Assistant", href: "/assistant", icon: MessageCircle },
  { name: "Collaborate", href: "/collaborate", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

const bottomTabs = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "AI Gen", href: "/ai-generator", icon: Wand2 },
  { name: "AR", href: "/ar-placement", icon: Cube },
  { name: "Feed", href: "/design-feed", icon: ImageIcon },
  { name: "More", href: "#", icon: MoreHorizontal, isMore: true },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const handleNavClick = (href: string, name: string) => {
    console.log("Navigation clicked:", name, "->", href)
    setIsMenuOpen(false)
    setIsMoreMenuOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  const handleMoreClick = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen)
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Cube className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm">AR Interior</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-11 w-11"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Menu */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={cn(
            "fixed left-0 top-0 bottom-0 w-80 bg-background border-r border-border transform transition-transform duration-300 overflow-y-auto",
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Cube className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground text-sm">AR Interior</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="h-11 w-11"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="py-4">
            <div className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => handleNavClick(item.href, item.name)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px]",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="border-t border-border p-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            {user ? (
              <>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                    <User className="h-5 w-5" />
                    <span className="text-sm">Profile</span>
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-11" 
                  onClick={handleSignOut}
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm">Sign Out</span>
                </Button>
              </>
            ) : (
              <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                  <User className="h-5 w-5" />
                  <span className="text-sm">Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* More Menu Overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isMoreMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMoreMenuOpen(false)}
      >
        <div
          className={cn(
            "fixed bottom-20 left-4 right-4 bg-background border border-border rounded-lg shadow-lg transform transition-all duration-300 max-h-96 overflow-y-auto",
            isMoreMenuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            <div className="space-y-1">
              {navigation.slice(5).map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => handleNavClick(item.href, item.name)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px]",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
        <div className="flex items-center justify-around h-20 pb-safe">
          {bottomTabs.map((tab) => {
            const isActive = pathname === tab.href
            
            if (tab.isMore) {
              return (
                <button
                  key={tab.name}
                  onClick={handleMoreClick}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[44px] min-h-[44px]",
                    isMoreMenuOpen
                      ? "text-accent-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{tab.name}</span>
                </button>
              )
            }

            return (
              <Link
                key={tab.name}
                href={tab.href}
                onClick={() => handleNavClick(tab.href, tab.name)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[44px] min-h-[44px]",
                  isActive
                    ? "text-accent-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Add padding for mobile bottom navigation */}
      <div className="md:hidden h-20" />
    </>
  )
}