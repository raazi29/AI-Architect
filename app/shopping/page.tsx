"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { EMICalculator } from "@/components/shopping/EMICalculator"
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
 price: number        // Price in INR
  originalPrice?: number  // Original price in INR
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
  retailer: string    // Indian retailer name
  inStock: boolean
  discount?: number
  isWishlisted: boolean
  tags: string[]
  currency: string    // "INR" for Indian products
  deliveryTime?: string // Expected delivery time
  emiAvailable?: boolean // EMI payment option
 warranty?: string   // Warranty information
 returnPolicy?: string // Return policy
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Modern Sectional Sofa",
    brand: "Urban Ladder",
    price: 12999,
    originalPrice: 15999,
    rating: 4.5,
    reviews: 234,
    image: "/modern-sofa.png",
    category: "Seating",
    style: "Modern",
    colors: ["#8B4513", "#2F4F4F", "#696969"],
    dimensions: { width: 220, height: 85, depth: 95 },
    retailer: "Urban Ladder",
    inStock: true,
    discount: 19,
    isWishlisted: false,
    tags: ["bestseller", "free-shipping", "emi-available"],
    currency: "INR",
    deliveryTime: "7-10 days",
    emiAvailable: true,
    warranty: "2 years warranty",
    returnPolicy: "7 days return"
  },
  {
    id: 2,
    name: "Glass Coffee Table",
    brand: "Pepperfry",
    price: 3999,
    rating: 4.2,
    reviews: 156,
    image: "/modern-coffee-table.png",
    category: "Tables",
    style: "Modern",
    colors: ["#000000", "#FFFFFF"],
    dimensions: { width: 120, height: 45, depth: 60 },
    retailer: "Pepperfry",
    inStock: true,
    isWishlisted: false,
    tags: ["new-arrival", "emi-available"],
    currency: "INR",
    deliveryTime: "5-7 days",
    emiAvailable: true,
    warranty: "1 year warranty",
    returnPolicy: "7 days return"
  },
  {
    id: 3,
    name: "LED Study Table Lamp",
    brand: "Nilkamal",
    price: 1999,
    originalPrice: 2499,
    rating: 4.0,
    reviews: 89,
    image: "/modern-floor-lamp.png",
    category: "Lighting",
    style: "Modern",
    colors: ["#000000", "#FFFFFF", "#C0C0C0"],
    dimensions: { width: 30, height: 160, depth: 30 },
    retailer: "Nilkamal",
    inStock: false,
    discount: 20,
    isWishlisted: true,
    tags: ["eco-friendly", "energy-efficient"],
    currency: "INR",
    deliveryTime: "3-5 days",
    emiAvailable: false,
    warranty: "1 year warranty",
    returnPolicy: "7 days return"
  },
  {
    id: 4,
    name: "6 Shelf Bookshelf",
    brand: "Godrej Interio",
    price: 8999,
    rating: 4.7,
    reviews: 312,
    image: "/modern-bookshelf.png",
    category: "Storage",
    style: "Modern",
    colors: ["#8B4513", "#000000"],
    dimensions: { width: 80, height: 200, depth: 30 },
    retailer: "Godrej Interio",
    inStock: true,
    isWishlisted: false,
    tags: ["premium", "handcrafted", "emi-available"],
    currency: "INR",
    deliveryTime: "10-15 days",
    emiAvailable: true,
    warranty: "3 years warranty",
    returnPolicy: "7 days return"
  },
  {
    id: 5,
    name: "Dining Chair Set of 4",
    brand: "Wood Street",
    price: 14999,
    rating: 4.3,
    reviews: 178,
    image: "/modern-dining-chair.png",
    category: "Seating",
    style: "Modern",
    colors: ["#8B4513", "#00000", "#FFFFFF"],
    dimensions: { width: 45, height: 85, depth: 50 },
    retailer: "Wood Street",
    inStock: true,
    isWishlisted: false,
    tags: ["bestseller", "emi-available"],
    currency: "INR",
    deliveryTime: "12-15 days",
    emiAvailable: true,
    warranty: "2 years warranty",
    returnPolicy: "14 days return"
  },
  {
    id: 6,
    name: "Marble Side Table",
    brand: "Home Centre",
    price: 2999,
    originalPrice: 399,
    rating: 4.4,
    reviews: 92,
    image: "/modern-side-table.jpg",
    category: "Tables",
    style: "Modern",
    colors: ["#FFFFFF", "#00000"],
    dimensions: { width: 50, height: 55, depth: 50 },
    retailer: "Home Centre",
    inStock: true,
    discount: 25,
    isWishlisted: false,
    tags: ["sale", "limited-time", "emi-available"],
    currency: "INR",
    deliveryTime: "5-10 days",
    emiAvailable: true,
    warranty: "1 year warranty",
    returnPolicy: "7 days return"
  },
]

export default function SmartShopping() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStyle, setSelectedStyle] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 200000])
  const [sortBy, setSortBy] = useState("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedRetailer, setSelectedRetailer] = useState("all")
  const [compareList, setCompareList] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch products from backend
  const fetchProducts = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams({
        query: searchQuery,
        page: pageNum.toString(),
        per_page: "30"
      })
      
      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory)
      }
      
      if (selectedStyle && selectedStyle !== "all") {
        params.append("style", selectedStyle)
      }
      
      if (priceRange[0] > 0) {
        params.append("price_min", priceRange[0].toString())
      }
      
      if (priceRange[1] < 200000) {
        params.append("price_max", priceRange[1].toString())
      }
      
      if (selectedRetailer && selectedRetailer !== "all") {
        params.append("retailer", selectedRetailer)
      }
      
      const response = await fetch(`http://localhost:8001/india-shopping/products?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      
      const data = await response.json()
      setProducts(data.products || [])
      setTotalPages(data.total_pages || 1)
      setPage(pageNum)
    } catch (err) {
      setError("Failed to load products. Please try again later.")
      console.error("Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts(1)
  }, [searchQuery, selectedCategory, selectedStyle, priceRange, selectedRetailer])

  // Fetch retailers on component mount
  useEffect(() => {
    const fetchRetailers = async () => {
      try {
        const response = await fetch("http://localhost:8001/india-shopping/retailers")
        if (response.ok) {
          const data = await response.json()
          // Retailers are now available in the backend
        }
      } catch (err) {
        console.error("Error fetching retailers:", err)
      }
    }
    
    fetchRetailers()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      selectedCategory === "all" || product.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesStyle = selectedStyle === "all" || product.style.toLowerCase() === selectedStyle.toLowerCase()
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
    const matchesRetailer = selectedRetailer === "all" || product.retailer.toLowerCase().includes(selectedRetailer.toLowerCase())

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "sale" && product.discount) ||
      (activeTab === "wishlist" && product.isWishlisted) ||
      (activeTab === "in-stock" && product.inStock)

    return matchesSearch && matchesCategory && matchesStyle && matchesPrice && matchesTab && matchesRetailer
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
                  Find and compare furniture from multiple Indian retailers with AI-powered recommendations.
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
                        <SelectItem value="bedroom">Bedroom</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
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
                        <SelectItem value="indian">Indian Traditional</SelectItem>
                        <SelectItem value="contemporary">Contemporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Retailer</label>
                    <Select value={selectedRetailer} onValueChange={setSelectedRetailer}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Retailers</SelectItem>
                        <SelectItem value="urban-ladder">Urban Ladder</SelectItem>
                        <SelectItem value="pepperfry">Pepperfry</SelectItem>
                        <SelectItem value="nilkamal">Nilkamal</SelectItem>
                        <SelectItem value="godrej-interio">Godrej Interio</SelectItem>
                        <SelectItem value="wood-street">Wood Street</SelectItem>
                        <SelectItem value="home-centre">Home Centre</SelectItem>
                        <SelectItem value="spaces">Spaces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Price Range: ₹{priceRange[0].toLocaleString('en-IN')} - ₹{priceRange[1].toLocaleString('en-IN')}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={200000}  // Up to ₹2,00,000
                      step={1000}
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
                      setSelectedRetailer("all")
                      setPriceRange([0, 200000])
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
                      <span className="text-lg font-bold text-primary">₹{product.price.toLocaleString('en-IN')}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                      )}
                      {product.discount && (
                        <span className="text-xs text-green-600 font-medium">Save {product.discount}%</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.retailer}
                    </Badge>
                  </div>

                  {/* Indian-specific features */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.emiAvailable && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        EMI Available
                      </Badge>
                    )}
                    {product.deliveryTime && (
                      <Badge variant="secondary" className="text-xs">
                        {product.deliveryTime}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag.replace("-", " ")}
                      </Badge>
                    ))}
                  </div>

                  {/* Warranty and return policy */}
                  {product.warranty && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {product.warranty}
                    </div>
                  )}
                  
                  {/* EMI Calculator for products that support EMI */}
                  {product.emiAvailable && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <EMICalculator price={product.price} />
                    </div>
                  )}

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
            <h2 className="text-2xl font-bold text-foreground mb-6">Top Indian Furniture Retailers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {["Urban Ladder", "Pepperfry", "Nilkamal", "Godrej Interio", "Wood Street", "Home Centre"].map((retailer) => (
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
