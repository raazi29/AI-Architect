"use client"

import { useState, useEffect, useMemo } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import LiveChat from "@/components/shopping/LiveChat"
import OrderTracker from "@/components/shopping/OrderTracker"
import PriceAlert from "@/components/shopping/PriceAlert"
import ARPreview from "@/components/shopping/ARPreview"
import VerifiedReviews from "@/components/shopping/VerifiedReviews"
import RealTimeUpdates from "@/components/shopping/RealTimeUpdates"
import PerformanceTest from "@/components/shopping/PerformanceTest"
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
  TrendingDown,
  Package,
  Bell,
  Move3D,
  CheckCircle,
} from "lucide-react"

interface Product {
  id: string
  name: string
  brand: string
  price: number        // Price in INR
  originalPrice?: number // Original price in INR
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
  warranty?: string   // Warranty information
  returnPolicy?: string // Return policy
  description?: string
  specifications?: Record<string, string>
  features?: string[]
  material?: string
  designer?: string
  designStyle?: string
  sustainabilityRating?: number
  certifiedEcoFriendly?: boolean
  stockQuantity?: number
  availabilityStatus?: string
  shippingCost?: number
  estimatedDelivery?: string
  customerRatingBreakdown?: Record<string, number>
  verifiedReviews?: Array<{
    id: string
    user: string
    rating: number
    title: string
    comment: string
    verifiedPurchase: boolean
    date: string
    helpfulCount: number
    images?: string[]
  }>
  priceHistory?: Array<{
    date: string
    price: number
    change: number
  }>
  relatedProducts?: string[]
  trendingScore?: number
  personalizationScore?: number
  lastUpdated?: string
}

const mockProducts: Product[] = [
  {
    id: "1",
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
    tags: ["bestseller", "free-shipping"],
    currency: "INR",
    deliveryTime: "7-10 days",
    warranty: "2 years warranty",
    returnPolicy: "7 days return"
  },
  {
    id: "2",
    name: "Glass Coffee Table",
    brand: "Pepperfry",
    price: 3999,
    rating: 4.2,
    reviews: 156,
    image: "/modern-coffee-table.png",
    category: "Tables",
    style: "Modern",
    colors: ["#00000", "#FFFFFF"],
    dimensions: { width: 120, height: 45, depth: 60 },
    retailer: "Pepperfry",
    inStock: true,
    isWishlisted: false,
    tags: ["new-arrival"],
    currency: "INR",
    deliveryTime: "5-7 days",
    warranty: "1 year warranty",
    returnPolicy: "7 days return"
  },
  {
    id: "3",
    name: "LED Study Table Lamp",
    brand: "Nilkamal",
    price: 1999,
    originalPrice: 2499,
    rating: 4.0,
    reviews: 89,
    image: "/modern-floor-lamp.png",
    category: "Lighting",
    style: "Modern",
    colors: ["#00", "#FFFFFF", "#C0C0C0"],
    dimensions: { width: 30, height: 160, depth: 30 },
    retailer: "Nilkamal",
    inStock: false,
    discount: 20,
    isWishlisted: true,
    tags: ["eco-friendly", "energy-efficient"],
    currency: "INR",
    deliveryTime: "3-5 days",
    warranty: "1 year warranty",
    returnPolicy: "7 days return"
  },
  {
    id: "4",
    name: "6 Shelf Bookshelf",
    brand: "Godrej Interio",
    price: 8999,
    rating: 4.7,
    reviews: 312,
    image: "/modern-bookshelf.png",
    category: "Storage",
    style: "Modern",
    colors: ["#8B4513", "#00000"],
    dimensions: { width: 80, height: 200, depth: 30 },
    retailer: "Godrej Interio",
    inStock: true,
    isWishlisted: false,
    tags: ["premium", "handcrafted"],
    currency: "INR",
    deliveryTime: "10-15 days",
    warranty: "3 years warranty",
    returnPolicy: "7 days return"
  },
  {
    id: "5",
    name: "Dining Chair Set of 4",
    brand: "Wood Street",
    price: 14999,
    rating: 4.3,
    reviews: 178,
    image: "/modern-dining-chair.png",
    category: "Seating",
    style: "Modern",
    colors: ["#8B4513", "#0000", "#FFFFFF"],
    dimensions: { width: 45, height: 85, depth: 50 },
    retailer: "Wood Street",
    inStock: true,
    isWishlisted: false,
    tags: ["bestseller"],
    currency: "INR",
    deliveryTime: "12-15 days",
    warranty: "2 years warranty",
    returnPolicy: "14 days return"
  },
  {
    id: "6",
    name: "Marble Side Table",
    brand: "Home Centre",
    price: 2999,
    originalPrice: 399,
    rating: 4.4,
    reviews: 92,
    image: "/modern-side-table.jpg",
    category: "Tables",
    style: "Modern",
    colors: ["#FFFFFF", "#0000"],
    dimensions: { width: 50, height: 55, depth: 50 },
    retailer: "Home Centre",
    inStock: true,
    discount: 25,
    isWishlisted: false,
    tags: ["sale", "limited-time"],
    currency: "INR",
    deliveryTime: "5-10 days",
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
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [sortBy, setSortBy] = useState("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedRetailer, setSelectedRetailer] = useState("all")
  const [compareList, setCompareList] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [realTimeFeatures, setRealTimeFeatures] = useState<any>(null)

  // Fetch products - now using only mock data since backend is disabled
  const fetchProducts = async (pageNum: number = 1, loadMore: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      // Call real backend API
      const response = await fetch('http://localhost:8001/shopping/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: pageNum,
          per_page: 20,
          category: selectedCategory,
          price_range: priceRange,
          sort_by: sortBy
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (loadMore) {
        setProducts(prev => [...prev, ...data.products])
      } else {
        setProducts(data.products)
      }
      
      setPage(pageNum)
    } catch (err) {
      setError("Failed to load products. Please try again.")
      console.error("Error loading products:", err)
      
      // Fallback to mock data only if API fails
      if (loadMore) {
        setProducts(prev => [...prev, ...mockProducts])
      } else {
        setProducts(mockProducts)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch real-time features data - disabled backend, using mock data
  useEffect(() => {
    // Simulate getting mock real-time features data
    const mockRealTimeFeatures = {
      price_comparisons: [
        { product_name: "Modern Sectional Sofa", price: 12999, retailer: "Urban Ladder" },
        { product_name: "Modern Sectional Sofa", price: 13499, retailer: "Pepperfry" },
        { product_name: "Modern Sectional Sofa", price: 12799, retailer: "Nilkamal" }
      ],
      trending_products: [
        { 
          id: "1", 
          name: "Modern Sectional Sofa", 
          image: "/modern-sofa.png", 
          retailer: "Urban Ladder", 
          rating: 4.5, 
          price: 12999,
          trending_score: 12.5
        },
        { 
          id: "2", 
          name: "Glass Coffee Table", 
          image: "/modern-coffee-table.png", 
          retailer: "Pepperfry", 
          rating: 4.2, 
          price: 3999,
          trending_score: 8.2
        },
        { 
          id: "3", 
          name: "LED Study Table Lamp", 
          image: "/modern-floor-lamp.png", 
          retailer: "Nilkamal", 
          rating: 4.0, 
          price: 1999,
          trending_score: 5.7
        }
      ],
      inventory_updates: [
        { product_id: "1", retailer: "Urban Ladder", stock_status: "in_stock", stock_quantity: 15 },
        { product_id: "2", retailer: "Pepperfry", stock_status: "in_stock", stock_quantity: 8 },
        { product_id: "3", retailer: "Nilkamal", stock_status: "in_stock", stock_quantity: 22 },
        { product_id: "4", retailer: "Godrej Interio", stock_status: "in_stock", stock_quantity: 5 },
        { product_id: "5", retailer: "Wood Street", stock_status: "in_stock", stock_quantity: 12 },
        { product_id: "6", retailer: "Home Centre", stock_status: "limited", stock_quantity: 3 }
      ]
    }
    setRealTimeFeatures(mockRealTimeFeatures)
  }, [])

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts(1)
  }, [searchQuery, selectedCategory, selectedStyle, priceRange, selectedRetailer])

  // Fetch retailers on component mount - using mock data since backend is disabled
  useEffect(() => {
    // Retailers are available in the mock data, no need for additional action
    // This useEffect is kept for potential future use if backend is re-enabled
  }, [])

  const filteredProducts = useMemo(() => products.filter((product) => {
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
  }), [products, searchQuery, selectedCategory, selectedStyle, priceRange, activeTab, selectedRetailer])

  const sortedProducts = useMemo(() => [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "rating":
        return b.rating - a.rating
      case "reviews":
        return b.reviews - a.reviews
      case "trending":
        return (b.trendingScore || 0) - (a.trendingScore || 0)
      case "personalized":
        return (b.personalizationScore || 0) - (a.personalizationScore || 0)
      default:
        return 0
    }
  }), [filteredProducts, sortBy])

  const toggleWishlist = (productId: string) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, isWishlisted: !product.isWishlisted } : product)),
    )
  }

  const toggleCompare = (productId: string) => {
    setCompareList((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : prev.length < 3 ? [...prev, productId] : prev,
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Architect & Interior Design Marketplace</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Real-time shopping for architects and interior designers. Compare products from multiple Indian retailers with live updates.
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
                  placeholder="Search furniture, materials, fixtures, tools..."
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
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="personalized">Personalized</SelectItem>
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
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="lighting">Lighting</SelectItem>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="fixtures">Fixtures</SelectItem>
                        <SelectItem value="architectural">Architectural</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="bathroom">Bathroom</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                        <SelectItem value="decor">Home Decor</SelectItem>
                        <SelectItem value="tools">Tools & Equipment</SelectItem>
                        <SelectItem value="sustainability">Sustainable Products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Design Style</label>
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
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                        <SelectItem value="vastu-compliant">Vastu Compliant</SelectItem>
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
                        <SelectItem value="architectural-digest">Architectural Digest Store</SelectItem>
                        <SelectItem value="dwr">Design Within Reach</SelectItem>
                        <SelectItem value="cortazzi">Cortazzi</SelectItem>
                        <SelectItem value="durian">Durian</SelectItem>
                        <SelectItem value="amazon-india">Amazon India</SelectItem>
                        <SelectItem value="flipkart">Flipkart</SelectItem>
                        <SelectItem value="tata-cliq">Tata CLiQ</SelectItem>
                        <SelectItem value="myntra">Myntra</SelectItem>
                        <SelectItem value="ajio">Ajio</SelectItem>
                        <SelectItem value="paytm-mall">Paytm Mall</SelectItem>
                        <SelectItem value="snapdeal">Snapdeal</SelectItem>
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
                      max={500000}  // Up to ₹5,00,000 for high-end architect products
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
                      setPriceRange([0, 500000])
                      setSearchQuery("")
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-2xl grid-cols-5">
                <TabsTrigger value="all">All Products</TabsTrigger>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
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

          {/* Real-time updates indicator */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates: {products.length} products from {new Set(products.map(p => p.retailer)).size} retailers</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 relative">
                <div className="absolute top-2 right-2">
                  {product.trendingScore && product.trendingScore > 7 && (
                    <Badge variant="default" className="bg-orange-500 text-white">
                      Trending
                    </Badge>
                  )}
                </div>

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
                    {product.certifiedEcoFriendly && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        Eco-Friendly
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className={`h-8 w-8 p-0 bg-white/90 hover:bg-white transition-colors ${product.isWishlisted ? "text-red-500" : ""
                        }`}
                      onClick={() => toggleWishlist(product.id)}
                    >
                      <Heart className={`h-4 w-4 ${product.isWishlisted ? "fill-current" : ""}`} />
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      className={`h-8 w-8 p-0 bg-white/90 hover:bg-white transition-colors ${compareList.includes(product.id) ? "text-primary" : ""
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
                      <Star className="h-3 w-3 fill-yellow-40 text-yellow-400" />
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



                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1" disabled={!product.inStock}>
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {product.inStock ? "Add to Cart" : "Notify Me"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      // Open AR preview modal
                      console.log("Opening AR preview for", product.id);
                    }}>
                      <Move3D className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Real-time inventory indicator */}
                  <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                    <span>Stock: {product.stockQuantity || 'N/A'}</span>
                    <span>{product.availabilityStatus || 'In Stock'}</span>
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
            <Button variant="outline" size="lg" onClick={() => fetchProducts(page + 1, true)} disabled={loading || page >= totalPages}>
              Load More Products
            </Button>
          </div>

          {/* Real-time features section */}
          {realTimeFeatures && (
            <div className="mt-16 border-t border-border pt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Price comparison section */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Real-time Price Comparison</h2>
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{realTimeFeatures.price_comparisons[0].product_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Lowest: ₹{realTimeFeatures.price_comparisons[0].price.toLocaleString('en-IN')}</span>
                          <Badge variant="secondary">{realTimeFeatures.price_comparisons[0].retailer}</Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(realTimeFeatures.price_comparisons[0].price / realTimeFeatures.price_comparisons[1].price) * 100}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {realTimeFeatures.price_comparisons.slice(0, 3).map((comparison: any) => (
                          <div key={comparison.retailer} className="text-center">
                            <div className="font-medium">₹{comparison.price.toLocaleString('en-IN')}</div>
                            <div className="text-muted-foreground">{comparison.retailer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Trending products section */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Trending in Architecture & Design</h2>
                  <Card className="p-4">
                    <div className="space-y-4">
                      {realTimeFeatures.trending_products.map((product: any) => (
                        <div key={product.id} className="flex items-center gap-3">
                          <div className="bg-muted rounded-lg w-16 h-16 flex-shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">From {product.retailer}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-40 text-yellow-400" />
                                <span className="text-xs">{product.rating}</span>
                              </div>
                              <span className="text-xs">₹{product.price.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-green-500">+{product.trending_score.toFixed(1)}%</div>
                            <div className="text-xs">vs last week</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Live inventory updates */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Live Inventory Updates</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {realTimeFeatures.inventory_updates.slice(0, 6).map((update: any) => (
                    <Card key={update.product_id} className="p-3 text-center hover:shadow-md transition-shadow cursor-pointer">
                      <div className="h-8 bg-muted rounded-lg flex items-center justify-center mb-1">
                        <span className="text-xs font-semibold">{update.retailer.split(' ')[0]}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{update.stock_status}</div>
                      <div className="text-xs mt-1">
                        <span className={`h-2 w-2 rounded-full inline-block mr-1 ${update.stock_status === 'in_stock' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>{update.stock_quantity} left</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Real-time updates section */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Real-time Updates</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Price alerts */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Bell className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Price Alerts</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get notified when prices drop below your target
                      </p>
                      <Button size="sm" className="w-full">
                        Set Price Alert
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Verified reviews */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Verified Reviews</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Read authentic reviews from verified purchasers
                      </p>
                      <Button size="sm" className="w-full">
                        View Reviews
                      </Button>
                    </CardContent>
                  </Card>

                  {/* AR Preview */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Move3D className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">AR Preview</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Visualize products in your space using augmented reality
                      </p>
                      <Button size="sm" className="w-full">
                        Try AR Preview
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Live Chat Component */}
      <LiveChat />

      {/* Order Tracker Component */}
      <OrderTracker />

      {/* Real-time Updates Component */}
      <RealTimeUpdates />
    </div>
  )
}