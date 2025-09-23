"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DesignPostCard from "./design-post-card"

interface DesignPost {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: { original: string; large2x: string; large: string; medium: string; small: string; portrait: string; landscape: string; tiny: string; };
  alt: string;
  image: string;
  title: string;
  author: string;
  likes: number;
  saves: number;
}

export default function DesignFeed() {
  const [designPosts, setDesignPosts] = useState<DesignPost[]>([])
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("feed")
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [roomType, setRoomType] = useState<string>("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [layoutType, setLayoutType] = useState<string>("");
  const [lighting, setLighting] = useState<string[]>([]);
  const [paletteMode, setPaletteMode] = useState<string>("");
  const [chipPreviewOpen, setChipPreviewOpen] = useState(false);
  const [chipToPreview, setChipToPreview] = useState<string>("");
  const [seenImageIds, setSeenImageIds] = useState<Set<string>>(() => {
    // Load seen image IDs from localStorage
    try {
      const stored = localStorage.getItem('designFeedSeenImages');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  
  // Cache for storing previously fetched data with timestamps
  const cache = useRef<Map<string, {data: DesignPost[], timestamp: number}>>(new Map());
  const cachePage = useRef<Map<string, number>>(new Map());

  // Utility: shuffle array to randomize order for a Pinterest-like feel
  const shuffle = useCallback((arr: DesignPost[]) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  // Debounce search query to reduce API calls
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Helper: retry with exponential backoff for network robustness
  const fetchWithRetry = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit, retries = 2, backoffMs = 500): Promise<Response> => {
      try {
        const res = await fetch(input, init);
        if (!res.ok) {
          // Bubble up to error handler; backend now falls back on 401/403/429
          throw new Error(`${res.status} ${res.statusText}`);
        }
        return res;
      } catch (err) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, backoffMs));
          return fetchWithRetry(input, init, retries - 1, backoffMs * 2);
        }
        throw err;
      }
    },
    []
  );

  const fetchDesigns = useCallback(async (pageNumber: number, query: string) => {
    // Create cache key
    const cacheKey = `${activeTab}-${selectedStyle}-${roomType}-${layoutType}-${paletteMode}-${lighting.join(',')}-${selectedColors.join(',')}-${selectedMaterials.join(',')}-${query}-${page}`;
    
    // Check if we have cached data for page 1
    if (pageNumber === 1 && cache.current.has(cacheKey)) {
      const cachedEntry = cache.current.get(cacheKey);
      // Check if cache is still valid (less than 5 minutes old)
      if (cachedEntry && Date.now() - cachedEntry.timestamp < 5 * 60 * 1000) {
        const cachedPage = cachePage.current.get(cacheKey) || 1;
        setDesignPosts(cachedEntry.data || []);
        setInitialLoading(false);
        // If we have more pages cached, set hasMore to true
        setHasMore(cachedPage > 1);
        return;
      } else {
        // Expired cache, remove it
        cache.current.delete(cacheKey);
      }
    }
    
    // Skip fetch if already loading
    if (loading) return;
    
    // Set loading states
    setLoading(true);
    if (pageNumber === 1) {
      setInitialLoading(true);
    }
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pageNumber.toString());
      params.append('per_page', '30'); // Request 30 photos for better infinite scroll
      
      // Add query if it exists
      if (query) {
        params.append('query', query);
      }
      
      // Add style if it's not 'all'
      if (selectedStyle !== 'all') {
        params.append('style', selectedStyle);
      }
      
      // Add all filter parameters
      if (roomType) params.append('room_type', roomType);
      if (layoutType) params.append('layout_type', layoutType);
      if (lighting.length > 0) params.append('lighting', lighting.join(','));
      if (paletteMode) params.append('palette_mode', paletteMode);
      if (selectedColors.length > 0) params.append('colors', selectedColors.join(','));
      if (selectedMaterials.length > 0) params.append('materials', selectedMaterials.join(','));
      
      const endpoint = "feed"; // Only use feed endpoint
      // Set per_page to 30 for better infinite scroll
      params.set('per_page', '30');
      console.log('Fetching with params:', Object.fromEntries(params.entries())); // Debug log
      const res = await fetchWithRetry(`http://localhost:8001/${endpoint}?${params.toString()}`);
      
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
        } else if (res.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(`Failed to fetch designs: ${res.status} ${res.statusText}`);
        }
      }
      
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        // Deduplicate images
        const filtered = data.filter((item: DesignPost) => {
          // Create a more robust image key
          const imageKey = `${item.id}-${item.image || item.src?.original || item.url}`;
          if (seenImageIds.has(imageKey)) return false;
          seenImageIds.add(imageKey);
          return true;
        });
        
        const randomized = shuffle(filtered);
        setDesignPosts((prevPosts) => pageNumber === 1 ? randomized : [...prevPosts, ...randomized]);
        const newSeenImageIds = new Set([...seenImageIds, ...filtered.map(item => `${item.id}-${item.image || item.src?.original || item.url}`)]);
        setSeenImageIds(newSeenImageIds);
        // Save seen image IDs to localStorage
        try {
          localStorage.setItem('designFeedSeenImages', JSON.stringify(Array.from(newSeenImageIds)));
        } catch (e) {
          console.warn('Failed to save seen image IDs to localStorage:', e);
        }
        // Cache the data for page 1
        if (pageNumber === 1) {
          cache.current.set(cacheKey, {
            data: randomized,
            timestamp: Date.now()
          });
          cachePage.current.set(cacheKey, 1);
        }
      }
    } catch (error) {
      console.error("Failed to fetch designs:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setHasMore(false);
    } finally {
      setLoading(false);
      if (pageNumber === 1) {
        setInitialLoading(false);
      }
    }
  }, [activeTab, selectedStyle, roomType, layoutType, paletteMode, lighting, selectedColors, selectedMaterials, page]);

  // Handle search with debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset pagination
    setPage(1);
    setHasMore(true);
    setDesignPosts([]);
    const newSeenImageIds = new Set<string>();
    setSeenImageIds(newSeenImageIds);
    // Clear seen images from localStorage
    try {
      localStorage.setItem('designFeedSeenImages', JSON.stringify(Array.from(newSeenImageIds)));
    } catch (e) {
      console.warn('Failed to clear seen image IDs from localStorage:', e);
    }
    // Clear cache when search query changes
    cache.current.clear();
    cachePage.current.clear();
    
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      fetchDesigns(1, query);
    }, 300); // 300ms debounce
  };

  // Fetch on style/filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchDesigns(1, searchQuery);
  }, [selectedStyle, searchQuery, roomType, layoutType, paletteMode, lighting, selectedColors, selectedMaterials, fetchDesigns]);

  // Fetch on page change
  useEffect(() => {
    if (page > 1) {
      fetchDesigns(page, searchQuery);
    }
  }, [page, searchQuery, fetchDesigns]);

  const observer = useRef<IntersectionObserver>();
  const lastPostElementRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prevPage => prevPage + 1);
        }
      },
      { root: null, rootMargin: '1000px 0px', threshold: 0.1 }
    );
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Animate floating bar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Periodic lightweight refresh: if more content is available, auto-advance page occasionally
  useEffect(() => {
    const id = setInterval(() => {
      if (!loading && hasMore) {
        setPage(prev => prev + 1);
      }
    }, 30000); // every 30s
    return () => clearInterval(id);
  }, [loading, hasMore]);

  // Periodic full refresh to get new content (every 5 minutes)
  useEffect(() => {
    const id = setInterval(() => {
      // Clear cache and seen images to get fresh content
      cache.current.clear();
      cachePage.current.clear();
      const newSeenImageIds = new Set<string>();
      setSeenImageIds(newSeenImageIds);
      try {
        localStorage.setItem('designFeedSeenImages', JSON.stringify(Array.from(newSeenImageIds)));
      } catch (e) {
        console.warn('Failed to clear seen image IDs from localStorage:', e);
      }
      // Reset to first page
      setPage(1);
      setHasMore(true);
      setDesignPosts([]);
    }, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(id);
  }, []);

  // Periodic cleanup of seen images to prevent localStorage from growing too large
  useEffect(() => {
    const cleanup = setInterval(() => {
      try {
        const stored = localStorage.getItem('designFeedSeenImages');
        if (stored) {
          const seenImages = JSON.parse(stored);
          // Keep only the last 1000 seen images
          if (seenImages.length > 1000) {
            const trimmed = seenImages.slice(-1000);
            localStorage.setItem('designFeedSeenImages', JSON.stringify(trimmed));
            // Update the state as well
            setSeenImageIds(new Set(trimmed));
          }
        }
      } catch (e) {
        console.warn('Failed to cleanup seen images from localStorage:', e);
      }
    }, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(cleanup);
  }, []);


  return (
    <div className="container mx-auto px-4 pt-28 pb-8">
      {/* Floating glass search + filters */}
      <div className={`fixed left-1/2 top-6 z-40 -translate-x-1/2 w-[92%] sm:w-[600px] md:w-[720px] transition-all duration-300 ${scrolled ? 'scale-[0.98] backdrop-blur-xl' : 'scale-100 backdrop-blur-lg'}`}>
        <div className="backdrop-blur-inherit bg-white/60 dark:bg-neutral-900/50 border border-white/40 dark:border-white/10 shadow-lg ring-1 ring-black/5 rounded-2xl">
          <div className="px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
            {/* Feed only - removed trending */}
            <div className="hidden sm:block">
              <div className="text-sm font-medium px-3 py-1">Design Feed</div>
            </div>
            {/* Search */}
            <Input
              type="text"
              placeholder="Search architecture & interior designs..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-500"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {/* Style filter */}
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="w-[130px] sm:w-[160px] bg-transparent">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                <SelectItem value="Minimalist">Minimalist</SelectItem>
                <SelectItem value="Scandinavian">Scandinavian</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Bohemian">Bohemian</SelectItem>
                <SelectItem value="Modern">Modern</SelectItem>
                <SelectItem value="Traditional">Traditional</SelectItem>
              </SelectContent>
            </Select>
            {/* Mobile filter sheet trigger */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <div>
                  <Button variant="secondary" className="sm:hidden">Filters</Button>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {/* Room type */}
                  <div>
                    <h3 className="text-xs font-medium mb-1">Room type</h3>
                    <RadioGroup value={roomType} onValueChange={setRoomType} className="grid grid-cols-3 gap-1">
                      {['Living Room','Bedroom','Kitchen','Bathroom','Dining Room','Office','Entryway','Outdoor'].map(opt => (
                        <Label key={opt} className={`cursor-pointer rounded-lg border px-2 py-1 text-xs ${roomType===opt ? 'border-primary bg-primary/10' : 'border-neutral-200 dark:border-neutral-800'}`}>
                          <RadioGroupItem value={opt} className="mr-1 scale-75" />{opt}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                  {/* Layout */}
                  <div>
                    <h3 className="text-xs font-medium mb-1">Layout</h3>
                    <RadioGroup value={layoutType} onValueChange={setLayoutType} className="grid grid-cols-2 gap-1">
                      {['Open-plan','Galley','U-shape','L-shape'].map(opt => (
                        <Label key={opt} className={`cursor-pointer rounded-lg border px-2 py-1 text-xs ${layoutType===opt ? 'border-primary bg-primary/10' : 'border-neutral-200 dark:border-neutral-800'}`}>
                          <RadioGroupItem value={opt} className="mr-1 scale-75" />{opt}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                  {/* Lighting */}
                  <div>
                    <h3 className="text-xs font-medium mb-1">Lighting</h3>
                    <div className="grid grid-cols-2 gap-1">
                      {['Natural light','Ambient','Pendant','Recessed'].map(opt => (
                        <Label key={opt} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs">
                          <Checkbox
                            checked={lighting.includes(opt)}
                            onCheckedChange={(c) => {
                              setLighting(prev => c ? [...prev, opt] : prev.filter(x => x!==opt))
                            }}
                            className="scale-75"
                          />
                          {opt}
                        </Label>
                      ))}
                    </div>
                  </div>
                  {/* Palette mode */}
                  <div>
                    <h3 className="text-xs font-medium mb-1">Palette mode</h3>
                    <RadioGroup value={paletteMode} onValueChange={setPaletteMode} className="grid grid-cols-2 gap-1">
                      {['Dark mode','Light/Airy'].map(opt => (
                        <Label key={opt} className={`cursor-pointer rounded-lg border px-2 py-1 text-xs ${paletteMode===opt ? 'border-primary bg-primary/10' : 'border-neutral-200 dark:border-neutral-800'}`}>
                          <RadioGroupItem value={opt} className="mr-1 scale-75" />{opt}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                  {/* Colors */}
                  <div>
                    <h3 className="text-xs font-medium mb-1">Color palette</h3>
                    <div className="grid grid-cols-3 gap-1">
                      {['white','black','gray','beige','wood','blue','green','earth tones','monochrome'].map(color => (
                        <Label key={color} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs">
                          <Checkbox
                            checked={selectedColors.includes(color)}
                            onCheckedChange={(c) => {
                              setSelectedColors(prev => c ? [...prev, color] : prev.filter(x => x!==color))
                            }}
                            className="scale-75"
                          />
                          {color}
                        </Label>
                      ))}
                    </div>
                  </div>
                  {/* Materials */}
                  <div>
                    <h3 className="text-xs font-medium mb-1">Materials</h3>
                    <div className="grid grid-cols-3 gap-1">
                      {['wood','stone','marble','concrete','metal','glass','rattan','brick','tile'].map(mat => (
                        <Label key={mat} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs">
                          <Checkbox
                            checked={selectedMaterials.includes(mat)}
                            onCheckedChange={(c) => {
                              setSelectedMaterials(prev => c ? [...prev, mat] : prev.filter(x => x!==mat))
                            }}
                            className="scale-75"
                          />
                          {mat}
                        </Label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => { setRoomType(''); setLayoutType(''); setLighting([]); setPaletteMode(''); setSelectedColors([]); setSelectedMaterials([]); }}>Clear</Button>
                    <Button size="sm" onClick={() => {
                      setFilterOpen(false);
                      setPage(1);
                      setHasMore(true);
                      setDesignPosts([]);
                      const newSeenImageIds = new Set<string>();
                      setSeenImageIds(newSeenImageIds);
                      // Clear seen images from localStorage
                      try {
                        localStorage.setItem('designFeedSeenImages', JSON.stringify(Array.from(newSeenImageIds)));
                      } catch (e) {
                        console.warn('Failed to clear seen image IDs from localStorage:', e);
                      }
                      cache.current.clear();
                      cachePage.current.clear();
                      fetchDesigns(1, searchQuery);
                    }}>Apply</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            {/* View toggle */}
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick chips */}
      <div className="mt-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-1.5 min-w-full">
          {[
            // Interior Styles
            'Scandinavian','Japandi','Mid-century Modern','Industrial','Modern Classic','Bohemian','Art Deco','Rustic Farmhouse','Zen Minimal',
            // Color / Mood
            'Monochrome','Soft Pastels','Earth Tones','Dark Academia','Vibrant Pop','Coastal Blue','Desert Sand','Black & Gold','Natural Greens',
            // Materials / Finishes
            'Polished Stone','Exposed Brick','Terrazzo','Raw Concrete','Bamboo Texture','Matte Metal','Frosted Glass','Woven Fabric','Recycled Wood',
            // Architectural Themes
            'Futuristic','Eco-friendly','Smart Living','Urban Loft','Tropical Retreat','Mediterranean','Minimal Luxe','Open Concept','Compact Studio'
          ].map((chip) => (
            <Button key={chip} size="sm" variant="outline" className="rounded-full text-xs px-3 py-1 h-7 whitespace-nowrap" onClick={() => { setChipToPreview(chip); setChipPreviewOpen(true); }}>
              {chip}
            </Button>
          ))}
        </div>
      </div>

      {/* Chip preview sheet */}
      <Sheet open={chipPreviewOpen} onOpenChange={setChipPreviewOpen}>
        <SheetContent side="bottom" className="h-[30vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Preview: {chipToPreview}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">Apply this theme to your current search to refine results instantly.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setChipPreviewOpen(false)}>Close</Button>
              <Button size="sm" onClick={() => { setChipPreviewOpen(false); handleSearch((searchQuery + ' ' + chipToPreview).trim()); }}>Apply</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {initialLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div>
          {viewMode === "grid" ? (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
              {designPosts.map((post, index) => {
                const compositeKey = `${post.id}-${post.image || post.url || index}`;
                const card = (
                  <div key={compositeKey} className="mb-6 break-inside-avoid">
                    <DesignPostCard post={post} viewMode={viewMode} priority={index < 8} />
                  </div>
                );
                if (designPosts.length === index + 1) {
                  return (
                    <div ref={lastPostElementRef} key={compositeKey} className="mb-6 break-inside-avoid">
                      <DesignPostCard post={post} viewMode={viewMode} priority={index < 8} />
                    </div>
                  );
                }
                return card;
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {designPosts.map((post, index) => {
                const compositeKey = `${post.id}-${post.image || post.url || index}`;
                if (designPosts.length === index + 1) {
                  return (
                    <div ref={lastPostElementRef} key={compositeKey}>
                      <DesignPostCard post={post} viewMode={viewMode} priority={index < 8} />
                    </div>
                  );
                }
                return <DesignPostCard key={compositeKey} post={post} viewMode={viewMode} priority={index < 8} />;
              })}
            </div>
          )}
        </div>
      )}

      {loading && <div className="text-center py-4">Loading more designs...</div>}
      {!hasMore && designPosts.length > 0 && (
        <div className="text-center py-4 text-gray-500">No more designs to load.</div>
      )}
      {!initialLoading && !loading && designPosts.length === 0 && !error && (
        <div className="text-center py-4 text-gray-500">No designs found. Try a different search term.</div>
      )}
    </div>
  )
}
