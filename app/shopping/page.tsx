"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import {
  ShoppingBag,
  Search,
  Heart,
  ShoppingCart,
  Star,
  Filter,
  Camera,
  TrendingUp,
  Zap,
  Eye,
  Compass as Compare,
  ExternalLink,
} from "lucide-react"

interface Product {
  id: number
  name: string
  brand: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  category: string
  style: string
  colors: string[]
  dimensions: {
    width: number
    height: number
    depth: number
  }
  retailer: string
  inStock: boolean
  discount?: number
  isWishlisted: boolean
  tags: string[]
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Modern Sectional Sofa",
    brand: "West Elm",
    price: 1299,
    originalPrice: 1599,
    rating: 4.5,
    reviews: 234,
    image: "/modern-sofa.png",
    category: "Seating",
    style: "Modern",
    colors: ["#8B4513", "#2F4F4F", "#696969"],
    dimensions: { width: 220, height: 85, depth: 95 },
    retailer: "West Elm",
    inStock: true,
    discount: 19,
    isWishlisted: false,
    tags: ["bestseller", "free-shipping"],
  },
  {
    id: 2,
    name: "Glass Coffee Table",
    brand: "CB2",
    price: 399,
    rating: 4.2,
    reviews: 156,
    image: "/modern-coffee-table.png",
    category: "Tables",
    style: "Modern",
    colors: ["#000000", "#FFFFFF"],
    dimensions: { width: 120, height: 45, depth: 60 },
    retailer: "CB2",
    inStock: true,
    isWishlisted: false,
    tags: ["new-arrival"],
  },
  {
    id: 3,
    name: "Arc Floor Lamp",
    brand: "IKEA",
    price: 199,
    originalPrice: 249,
    rating: 4.0,
    reviews: 89,
    image: "/modern-floor-lamp.png",
    category: "Lighting",
    style: "Modern",
    colors: ["#000000", "#FFFFFF", "#C0C0C0"],
    dimensions: { width: 30, height: 160, depth: 30 },
    retailer: "IKEA",
    inStock: false,
    discount: 20,
    isWishlisted: true,
    tags: ["eco-friendly"],
  },
  {
    id: 4,
    name: "Industrial Bookshelf",
    brand: "Restoration Hardware",
    price: 899,
    rating: 4.7,
    reviews: 312,
    image: "/modern-bookshelf.png",
    category: "Storage",
    style: "Industrial",
    colors: ["#8B4513", "#000000"],
    dimensions: { width: 80, height: 200, depth: 30 },
    retailer: "Restoration Hardware",
    inStock: true,
    isWishlisted: false,
    tags: ["premium", "handcrafted"],
  },
  {
    id: 5,
    name: "Velvet Dining Chair",
    brand: "Article",
    price: 149,
    rating: 4.3,
    reviews: 178,
    image: "/modern-dining-chair.png",
    category: "Seating",
    style: "Modern",
    colors: ["#8B4513", "#000000", "#FFFFFF"],
    dimensions: { width: 45, height: 85, depth: 50 },
    retailer: "Article",
    inStock: true,
    isWishlisted: false,
    tags: ["bestseller"],
  },
  {
    id: 6,
    name: "Marble Side Table",
    brand: "Pottery Barn",
    price: 299,
    originalPrice: 399,
    rating: 4.4,
    reviews: 92,
    image: "/modern-side-table.jpg",
    category: "Tables",
    style: "Modern",
    colors: ["#FFFFFF", "#000000"],
    dimensions: { width: 50, height: 55, depth: 50 },
    retailer: "Pottery Barn",
    inStock: true,
    discount: 25,
    isWishlisted: false,
    tags: ["sale", "limited-time"],
  },
]

export default function SmartShopping() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStyle, setSelectedStyle] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 2000])
  const [sortBy, setSortBy] = useState("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [compareList, setCompareList] = useState<number[]>([])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      selectedCategory === "all" || product.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesStyle = selectedStyle === "all" || product.style.toLowerCase() === selectedStyle.toLowerCase()
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "sale" && product.discount) ||
      (activeTab === "wishlist" && product.isWishlisted) ||
      (activeTab === "in-stock" && product.inStock)

    return matchesSearch && matchesCategory && matchesStyle && matchesPrice && matchesTab
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "rating":
        return b.rating - a.rating
      case "reviews":
        return b.reviews - a.reviews
      default:
        return 0
    }
  })

  const toggleWishlist = (productId: number) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, isWishlisted: !product.isWishlisted } : product)),
    )
  }

  const toggleCompare = (productId: number) => {
    setCompareList((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : prev.length < 3 ? [...prev, productId] : prev,
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Smart Shopping</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Find and compare furniture from multiple retailers with AI-powered recommendations.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Camera className="h-4 w-4" />
                  Visual Search
                </Button>
                {compareList.length > 0 && (
                  <Button className="gap-2">
                    <Compare className="h-4 w-4" />
                    Compare ({compareList.length})
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search furniture, brands, styles..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="seating">Seating</SelectItem>
                        <SelectItem value="tables">Tables</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                        <SelectItem value="lighting">Lighting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Style</label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Styles</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="scandinavian">Scandinavian</SelectItem>
                        <SelectItem value="traditional">Traditional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={2000}
                      step={50}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory("all")
                      setSelectedStyle("all")
                      setPriceRange([0, 2000])
                      setSearchQuery("")
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-2xl grid-cols-4">
                <TabsTrigger value="all">All Products</TabsTrigger>
                <TabsTrigger value="sale" className="gap-2">
                  <Zap className="h-4 w-4" />
                  On Sale
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Wishlist
                </TabsTrigger>
                <TabsTrigger value="in-stock">In Stock</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.discount && (
                      <Badge variant="destructive" className="text-xs">
                        -{product.discount}%
                      </Badge>
                    )}
                    {!product.inStock && (
                      <Badge variant="secondary" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}
                    {product.tags.includes("bestseller") && (
                      <Badge variant="default" className="text-xs bg-accent">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Bestseller
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className={`h-8 w-8 p-0 bg-white/90 hover:bg-white transition-colors ${
                        product.isWishlisted ? "text-red-500" : ""
                      }`}
                      onClick={() => toggleWishlist(product.id)}
                    >
                      <Heart className={`h-4 w-4 ${product.isWishlisted ? "fill-current" : ""}`} />
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      className={`h-8 w-8 p-0 bg-white/90 hover:bg-white transition-colors ${
                        compareList.includes(product.id) ? "text-primary" : ""
                      }`}
                      onClick={() => toggleCompare(product.id)}
                      disabled={!compareList.includes(product.id) && compareList.length >= 3}
                    >
                      <Compare className={`h-4 w-4 ${compareList.includes(product.id) ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.retailer}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag.replace("-", " ")}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" disabled={!product.inStock}>
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {product.inStock ? "Add to Cart" : "Notify Me"}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Showing {sortedProducts.length} of {products.length} products
              {activeTab !== "all" && ` in ${activeTab}`}
            </p>
            <Button variant="outline" size="lg">
              Load More Products
            </Button>
          </div>

          <div className="mt-16 border-t border-border pt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Featured Retailers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {["IKEA", "West Elm", "CB2", "Article", "Pottery Barn", "Restoration Hardware"].map((retailer) => (
                <Card key={retailer} className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <div className="h-12 bg-muted rounded-lg flex items-center justify-center mb-2">
                    <span className="font-semibold text-sm">{retailer}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Shop Collection</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
