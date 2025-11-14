"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Heart, Bookmark } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface DesignPostCardProps {
  post: {
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
  };
  viewMode: "grid" | "list";
  priority?: boolean;
}

export default function DesignPostCard({ post, viewMode, priority = false }: DesignPostCardProps) {
  // Mobile-optimized image selection with progressive loading
  const [imageUrl, setImageUrl] = useState(() => {
    // Start with smallest mobile-optimized size for progressive loading
    return post.image || post.src?.small || post.src?.tiny || post.src?.medium || post.src?.large || post.src?.large2x || post.src?.original || "/placeholder.jpg";
  });
  
  const [blurUrl, setBlurUrl] = useState(() => {
    return post.src?.tiny || post.src?.small || imageUrl;
  });
  
  // Use direct URL for trusted domains; proxy otherwise
  const TRUSTED = [
    'https://images.pexels.com',
    'https://images.unsplash.com',
    'https://cdn.pixabay.com',
    'https://picsum.photos',
    'https://api.rawpixel.com',
    'https://images.rawpixel.com',
    'https://cdn.rawpixel.com',
    'https://placehold.co',
    'https://loremflickr.com',
    'https://via.placeholder.com'
  ];
  
  const useDirect = TRUSTED.some(prefix => imageUrl.startsWith(prefix));
  const displayUrl = useDirect ? imageUrl : `/api/image?src=${encodeURIComponent(imageUrl)}`;
  const displayBlur = useDirect ? (post.src?.tiny || post.src?.small || imageUrl) : `/api/image?src=${encodeURIComponent(blurUrl)}`;
  
  // Mobile-optimized dimensions
  const naturalWidth = post.width || 400;  // Reduced for mobile
  const naturalHeight = post.height || 600; // Reduced for mobile
  const imageId = String(post.id);

  const [likes, setLikes] = useState<number>(post.likes || 0);
  const [saves, setSaves] = useState<number>(post.saves || 0);
  const [pending, setPending] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Progressive image loading with mobile optimization
  const loadImageWithProgressiveFallback = async (url: string, blurUrl: string) => {
    // Try primary image first
    const img = new Image();
    
    return new Promise<string>((resolve, reject) => {
      img.onload = () => resolve(url);
      img.onerror = () => {
        // If primary fails, try blur image as fallback
        const blurImg = new Image();
        blurImg.onload = () => resolve(blurUrl);
        blurImg.onerror = () => reject(new Error('Both primary and blur images failed'));
        blurImg.src = blurUrl;
      };
      
      // Set timeout for mobile devices (shorter for better UX)
      const timeout = isMobile ? 3000 : 5000;
      setTimeout(() => reject(new Error('Image load timeout')), timeout);
      
      img.src = url;
    });
  };

  // Enhanced error handling with multiple fallback strategies
  const handleImageError = async () => {
    console.log(`Image failed to load (attempt ${retryCount + 1}):`, displayUrl);
    
    if (retryCount < 2) {
      // Try different image sizes as fallbacks
      const fallbackUrls = [
        post.src?.tiny,
        post.src?.small, 
        post.src?.medium,
        post.src?.large,
        post.image,
        `https://picsum.photos/400/600?random=${post.id}`,
        `https://loremflickr.com/400/600/interior,design?lock=${post.id}`,
        `https://via.placeholder.com/400x600/e2e8f0/64748b?text=Design+${post.id}`
      ].filter(Boolean);
      
      const nextUrl = fallbackUrls[retryCount] || fallbackUrls[0];
      if (nextUrl && nextUrl !== imageUrl) {
        setRetryCount(prev => prev + 1);
        setImageUrl(nextUrl as string);
        return;
      }
    }
    
    // All retries exhausted
    setFailed(true);
    setLoaded(true);
  };

  // Mobile detection and progressive loading
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load counts from local storage (in case Supabase is not available)
  useEffect(() => {
    let active = true;
    const loadCounts = async () => {
      // Check local storage for user's own interactions
      try {
        const localLikes = JSON.parse(localStorage.getItem('user_likes') || '{}');
        const localSaves = JSON.parse(localStorage.getItem('user_saves') || '{}');
        if (localLikes[imageId]) setIsLiked(true);
        if (localSaves[imageId]) setIsSaved(true);
      } catch {}

      // If Supabase is available, try to load from there too
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("design_interactions")
            .select("likes,saves")
            .eq("image_id", imageId)
            .maybeSingle();
          if (!active) return;
          if (!error && data) {
            setLikes(typeof data.likes === "number" ? data.likes : 0);
            setSaves(typeof data.saves === "number" ? data.saves : 0);
          }
        } catch (err) {
          console.log("Supabase not available or error, using local storage counts");
        }
      }
    };
    loadCounts();
    return () => {
      active = false;
    };
  }, [imageId, supabase]);

  const handleLike = async () => {
    if (pending) return; // Remove supabase check to allow functionality without authentication
    
    setPending(true);
    const prev = likes;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes(prev + (newLikedState ? 1 : -1)); // optimistic update
    
    try {
      // Try Supabase if available, otherwise use local storage only
      if (supabase) {
        const { data } = await supabase
          .from("design_interactions")
          .select("likes,saves")
          .eq("image_id", imageId)
          .maybeSingle();
        const newLikes = (data?.likes ?? prev) + (newLikedState ? 1 : -1);
        const currSaves = data?.saves ?? saves;
        const { error } = await supabase
          .from("design_interactions")
          .upsert({ image_id: imageId, likes: newLikes, saves: currSaves }, { onConflict: "image_id" });
        if (error) throw error;
        setLikes(newLikes);
      }
      
      // Update local storage regardless of Supabase availability
      const localLikes = JSON.parse(localStorage.getItem('user_likes') || '{}');
      if (newLikedState) localLikes[imageId] = true;
      else delete localLikes[imageId];
      localStorage.setItem('user_likes', JSON.stringify(localLikes));
    } catch (e) {
      // Revert if Supabase failed
      setLikes(prev);
      setIsLiked(!newLikedState);
    } finally {
      setPending(false);
    }
  };

  const handleSave = async () => {
    if (pending) return; // Remove supabase check to allow functionality without authentication
    
    setPending(true);
    const prev = saves;
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    setSaves(prev + (newSavedState ? 1 : -1));
    
    try {
      // Try Supabase if available, otherwise use local storage only
      if (supabase) {
        const { data } = await supabase
          .from("design_interactions")
          .select("likes,saves")
          .eq("image_id", imageId)
          .single();
        const currLikes = data?.likes ?? likes;
        const newSaves = (data?.saves ?? prev) + (newSavedState ? 1 : -1);
        const { error } = await supabase
          .from("design_interactions")
          .upsert({ image_id: imageId, likes: currLikes, saves: newSaves }, { onConflict: "image_id" });
        if (error) throw error;
        setSaves(newSaves);
      }
      
      // Update local storage regardless of Supabase availability
      const localSaves = JSON.parse(localStorage.getItem('user_saves') || '{}');
      if (newSavedState) localSaves[imageId] = true;
      else delete localSaves[imageId];
      localStorage.setItem('user_saves', JSON.stringify(localSaves));
    } catch (e) {
      // Revert if Supabase failed
      setSaves(prev);
      setIsSaved(!newSavedState);
    } finally {
      setPending(false);
    }
  };
  
  return (
    <div
      className={`card bg-base-100 shadow-xl ${viewMode === "list" ? "card-side flex-row" : ""}`}
    >
      <div className={`${viewMode === "list" ? "w-1/3" : "w-full"}`}>
        <div className="relative">
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200 rounded-md" />
          )}
          <div style={{ paddingBottom: `${(naturalHeight / naturalWidth) * 100}%` }} />
          {!failed ? (
            <Image
              src={displayUrl}
              alt={post.alt || "Design image"}
              width={naturalWidth}
              height={naturalHeight}
              className={`absolute left-0 top-0 w-full h-auto rounded-md ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              sizes={isMobile ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"}
              loading={priority ? 'eager' : (isMobile ? 'lazy' : 'lazy')}
              priority={priority}
              quality={isMobile ? 75 : 80}
              placeholder="blur"
              blurDataURL={displayBlur}
              onLoad={() => setLoaded(true)}
              onError={handleImageError}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-md">
              <div className="text-center p-4">
                <div className="text-gray-400 mb-2">🖼️</div>
                <span className="text-sm text-gray-500">Image unavailable</span>
                <div className="text-xs text-gray-400 mt-1">Try refreshing or check connection</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={`card-body p-4 ${viewMode === "list" ? "w-2/3" : ""}`}>

        {/* Removed photographer information as requested */}
        <div className="card-actions justify-end items-center mt-auto">
          <div className="flex items-center space-x-2">
            <button onClick={handleLike} disabled={pending} title="Like">
              <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500' : 'text-gray-400'}`} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <span className="text-sm">{likes}</span>
            <button onClick={handleSave} disabled={pending} title="Save">
              <Bookmark className={`h-4 w-4 ${isSaved ? 'text-blue-500' : 'text-gray-400'}`} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <span className="text-sm">{saves}</span>
          </div>
        </div>
      </div>
    </div>
  );
}