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
import { API_BASE_URL } from "@/lib/api"

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
  const [newContentAvailable, setNewContentAvailable] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
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
    // Create cache key without page (since we cache per query/filter combination)
    const cacheKey = `${activeTab}-${selectedStyle}-${roomType}-${layoutType}-${paletteMode}-${lighting.join(',')}-${selectedColors.join(',')}-${selectedMaterials.join(',')}-${query}`;

    // Check if we have cached data for page 1 only
    if (pageNumber === 1 && cache.current.has(cacheKey)) {
      const cachedEntry = cache.current.get(cacheKey);
      // Check if cache is still valid (less than 2 minutes old for better freshness)
      if (cachedEntry && Date.now() - cachedEntry.timestamp < 2 * 60 * 1000) {
        const cachedPage = cachePage.current.get(cacheKey) || 1;
        setDesignPosts(cachedEntry.data || []);
        setInitialLoading(false);
        // If we have more pages cached, set hasMore to true
        setHasMore(cachedPage > 1);
        return;
      } else {
        // Expired cache, remove it
        cache.current.delete(cacheKey);
        cachePage.current.delete(cacheKey);
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
      params.append('per_page', '60'); // Request 30 photos for better infinite scroll

      // Enhance query with design-related terms, but keep original intent
      let searchQuery = query || "interior design architecture";
      if (query) {
        // Enhance user query with design-related terms but keep original intent
        searchQuery = `${query} interior design architecture`;
      }

      // Add the enhanced query
      params.append('query', searchQuery);

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
      console.log('Making request to:', `${API_BASE_URL}/${endpoint}?${params.toString()}`);
      const res = await fetchWithRetry(`${API_BASE_URL}/${endpoint}?${params.toString()}`);

      if (!res.ok) {
        console.error('API request failed:', res.status, await res.text());
        if (res.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
        } else if (res.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(`Failed to fetch designs: ${res.status} ${res.statusText}`);
        }
      }

      const data = await res.json();
      console.log('API response:', data);
      
      // Handle both array and object response formats
      let results: DesignPost[] = [];
      let hasMoreResults = true;
      
      if (Array.isArray(data)) {
        // Legacy format: plain array
        results = data;
        hasMoreResults = data.length === 30;
      } else if (data && typeof data === 'object' && Array.isArray(data.results)) {
        // New format: object with results array
        results = data.results;
        hasMoreResults = data.has_more ?? (results.length === 30);
      } else {
        throw new Error("Invalid response format");
      }

      if (results.length === 0) {
        console.log('No data returned from API for page', pageNumber);
        // If this is page 1 and we got no results, try to fetch from page 1 again
        // This handles cases where the backend might be starting from a different page
        if (pageNumber === 1) {
          console.log('Page 1 returned no results, this might be a backend issue');
          setHasMore(false);
        } else {
          // For other pages, just mark as no more data
          setHasMore(false);
        }
      } else {
        // Deduplicate images more effectively
        const filtered = results.filter((item: DesignPost) => {
          // Create a more robust and unique image key based on ID primarily
          const imageKey = item.id ? `id_${item.id}` : 
                          item.image ? `img_${item.image}` : 
                          item.url ? `url_${item.url}` : 
                          `src_${item.src?.original || item.src?.large || item.src?.medium || 'unknown'}`;
          
          if (seenImageIds.has(imageKey)) return false;
          seenImageIds.add(imageKey);
          return true;
        });

        console.log(`Filtered ${filtered.length} unique images from ${results.length} total`);

        if (filtered.length === 0) {
          console.log('All images were duplicates, fetching next page automatically');
          // If all images were duplicates, automatically try the next page
          if (pageNumber < 10) { // Prevent infinite loops
            setTimeout(() => {
              setPage(prevPage => prevPage + 1);
            }, 100);
          }
        } else {
          const randomized = shuffle(filtered);
          setDesignPosts((prevPosts) => pageNumber === 1 ? randomized : [...prevPosts, ...randomized]);
          
          // Update seen images with better keys
          const newSeenImageIds = new Set(seenImageIds);
          filtered.forEach(item => {
            const imageKey = item.id ? `id_${item.id}` : 
                            item.image ? `img_${item.image}` : 
                            item.url ? `url_${item.url}` : 
                            `src_${item.src?.original || item.src?.large || item.src?.medium || 'unknown'}`;
            newSeenImageIds.add(imageKey);
          });
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
          
          // With unlimited design service, always set hasMore to true for infinite scrolling
          setHasMore(true);
          
          // Log successful fetch
          console.log(`Successfully fetched ${filtered.length} new designs for page ${pageNumber}`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch designs:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setHasMore(false); // Stop loading more if there's an error

      // Clear error after a short delay
      setTimeout(() => setError(null), 3000);

      // If this is the first page and we got an error, try to clear cache and retry
      if (pageNumber === 1) {
        console.log('Clearing cache and retrying...');
        cache.current.clear();
        cachePage.current.clear();
        // Don't retry automatically to avoid infinite loops
      }
    } finally {
      setLoading(false);
      if (pageNumber === 1) {
        setInitialLoading(false);
      }
    }
  }, [activeTab, selectedStyle, roomType, layoutType, paletteMode, lighting, selectedColors, selectedMaterials]);

  // Handle search with debounce - Architecture/Interior Design focused
  const handleSearch = (query: string) => {
    // Enhance query to be design-focused if needed
    let enhancedQuery = query.trim();
    
    // If query doesn't contain design-related terms, keep it as is
    // The backend will handle enhancement
    
    setSearchQuery(enhancedQuery);
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
    
    // Set new timeout (reduced to 150ms for faster response)
    debounceTimeout.current = setTimeout(() => {
      console.log(`🔍 Searching for: "${enhancedQuery}"`);
      fetchDesigns(1, enhancedQuery);
    }, 150); // Reduced debounce time for faster response
  };

  // Initial mount effect - ensure fresh start
  useEffect(() => {
    console.log('Design feed mounted, starting fresh load');
    // Clear everything on initial mount
    cache.current.clear();
    cachePage.current.clear();
    setPage(1);
    setHasMore(true);
    setDesignPosts([]);
    setError(null);
    setInitialLoading(true);
    // Start with a fresh fetch
    fetchDesigns(1, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  // Fetch on style/filters change (skip on initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    // Skip the first render (initial mount is handled above)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    console.log('Filters changed, fetching new data');
    setPage(1);
    setHasMore(true);
    setDesignPosts([]); // Clear existing posts
    const newSeenImageIds = new Set<string>();
    setSeenImageIds(newSeenImageIds);
    // Clear seen images from localStorage
    try {
      localStorage.setItem('designFeedSeenImages', JSON.stringify(Array.from(newSeenImageIds)));
    } catch (e) {
      console.warn('Failed to clear seen image IDs from localStorage:', e);
    }
    // Clear cache when filters change
    cache.current.clear();
    cachePage.current.clear();
    // Always ensure design-related content is fetched
    fetchDesigns(1, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStyle, searchQuery, roomType, layoutType, paletteMode, lighting, selectedColors, selectedMaterials]);

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
        if (entries[0].isIntersecting) {
          // Always load more content when reaching the end - unlimited scrolling
          console.log('Reached end of current content, loading more...');
          setPage(prevPage => prevPage + 1);
        }
      },
      { root: null, rootMargin: '2000px 0px', threshold: 0.1 } // Increased margin for earlier loading
    );
    if (node) observer.current.observe(node);
  }, [loading]);

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

  // Real-time updates: periodically check for new content (less frequent for unlimited scrolling)
  useEffect(() => {
    const id = setInterval(async () => {
      if (!loading && designPosts.length < 50) { // Only add new content if we don't have too many posts
        try {
          // Fetch a small amount of new content
          const newContent = await fetchWithRetry(
            `${API_BASE_URL}/feed?page=1&per_page=5&query=${encodeURIComponent(searchQuery)}&style=${selectedStyle}${roomType ? `&room_type=${roomType}` : ''}`,
            { headers: { "Content-Type": "application/json" } }
          );
          
          if (!newContent.ok) throw new Error(`HTTP error! status: ${newContent.status}`);
          const newData = await newContent.json();
          
          let newResults: DesignPost[] = [];
          if (Array.isArray(newData)) {
            newResults = newData;
          } else if (newData && typeof newData === 'object' && Array.isArray(newData.results)) {
            newResults = newData.results;
          }
          
          if (newResults.length > 0) {
            // Filter out images that are already seen
            const newUniqueImages = newResults.filter((item: DesignPost) => {
              const imageKey = `${item.id}-${item.image || item.src?.original || item.url}`;
              return !seenImageIds.has(imageKey);
            });
            
            if (newUniqueImages.length > 0) {
              // Add new unique images to the end of the feed to maintain scroll position
              setDesignPosts(prev => [...prev, ...newUniqueImages]);
              
              // Update seen images
              const newSeenImageIdsUpdated = new Set(seenImageIds);
              newUniqueImages.forEach(item => {
                const imageKey = `${item.id}-${item.image || item.src?.original || item.url}`;
                newSeenImageIdsUpdated.add(imageKey);
              });
              setSeenImageIds(newSeenImageIdsUpdated);
              
              try {
                localStorage.setItem('designFeedSeenImages', JSON.stringify(Array.from(newSeenImageIdsUpdated)));
              } catch (e) {
                console.warn('Failed to save seen image IDs to localStorage:', e);
              }
              
              console.log(`Added ${newUniqueImages.length} new images to feed via real-time update`);
            }
          }
        } catch (e) {
          console.error("Error fetching new content for real-time updates:", e);
        }
      }
    }, 30000); // Check every 30 seconds (less frequent)
    
    return () => clearInterval(id);
  }, [loading, searchQuery, selectedStyle, roomType, designPosts.length, seenImageIds, fetchWithRetry]);

  // Periodic full refresh to get completely fresh content (every 10 minutes - less frequent for unlimited scrolling)
  useEffect(() => {
    const id = setInterval(() => {
      console.log("Performing periodic refresh of design feed");
      // Only clear cache, keep seen images to prevent duplicates
      cache.current.clear();
      cachePage.current.clear();
      // Don't reset page or posts - just refresh cache for new content
    }, 10 * 60 * 1000); // every 10 minutes (less frequent)
    return () => clearInterval(id);
  }, []);

  // Periodic cleanup of seen images to prevent localStorage from growing too large
  useEffect(() => {
    const cleanup = setInterval(() => {
      try {
        const stored = localStorage.getItem('designFeedSeenImages');
        if (stored) {
          const seenImages = JSON.parse(stored);
          // Keep only the last 500 seen images to optimize performance
          if (seenImages.length > 500) {
            const trimmed = seenImages.slice(-500);
            localStorage.setItem('designFeedSeenImages', JSON.stringify(trimmed));
            // Update the state as well
            setSeenImageIds(new Set(trimmed));
          }
        }
      } catch (e) {
        console.warn('Failed to cleanup seen images from localStorage:', e);
      }
    }, 5 * 60 * 1000); // every 5 minutes (more frequent cleanup)
    return () => clearInterval(cleanup);
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setError(null);
                setPage(1);
                setHasMore(true);
                setDesignPosts([]);
                cache.current.clear();
                cachePage.current.clear();
                fetchDesigns(1, searchQuery);
              }}
            >
              Try Again
            </Button>
          </div>
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
      {newContentAvailable && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-700 font-medium">
            🎉 {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - New design inspirations added to your feed!
          </p>
        </div>
      )}
      
      {!initialLoading && !loading && designPosts.length === 0 && !error && (
        <div className="text-center py-8 space-y-4">
          <div className="text-gray-500">No designs found. Try a different search term.</div>
          <Button
            onClick={() => {
              // Clear cache and retry
              cache.current.clear();
              cachePage.current.clear();
              setError(null);
              setPage(1);
              setHasMore(true);
              fetchDesigns(1, searchQuery);
            }}
            variant="outline"
          >
            Refresh Results
          </Button>
        </div>
      )}
      </div>
    </div>
  )
}
