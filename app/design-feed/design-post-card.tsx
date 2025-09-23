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
  // Prefer smaller variants to reduce bandwidth; fallback to larger as needed
  const imageUrl = post.image || post.src?.medium || post.src?.small || post.src?.large || post.src?.large2x || post.src?.original || "/placeholder.jpg";
  const blurUrl = post.src?.tiny || post.src?.small || imageUrl;
  // Use direct URL for trusted domains; proxy otherwise
  const TRUSTED = [
    'https://images.pexels.com',
    'https://images.unsplash.com',
    'https://cdn.pixabay.com',
    'https://picsum.photos'
  ];
  const useDirect = TRUSTED.some(prefix => imageUrl.startsWith(prefix));
  const displayUrl = useDirect ? imageUrl : `/api/image?src=${encodeURIComponent(imageUrl)}`;
  const displayBlur = useDirect ? (post.src?.tiny || post.src?.small || imageUrl) : `/api/image?src=${encodeURIComponent(blurUrl)}`;
  const naturalWidth = post.width || 800;
  const naturalHeight = post.height || 1200;
  const imageId = String(post.id);

  const [likes, setLikes] = useState<number>(post.likes || 0);
  const [saves, setSaves] = useState<number>(post.saves || 0);
  const [pending, setPending] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  // Load counts from Supabase if available
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

      if (!supabase) return;
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
    };
    loadCounts();
    return () => {
      active = false;
    };
  }, [imageId]);

  // Safety: clear skeleton after 5s even if onLoad didn't fire
  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), 5000);
    return () => clearTimeout(id);
  }, []);

  const handleLike = async () => {
    if (!supabase || pending) return;
    setPending(true);
    const prev = likes;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes(prev + (newLikedState ? 1 : -1)); // optimistic
    try {
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
      // Update local storage
      const localLikes = JSON.parse(localStorage.getItem('user_likes') || '{}');
      if (newLikedState) localLikes[imageId] = true;
      else delete localLikes[imageId];
      localStorage.setItem('user_likes', JSON.stringify(localLikes));
    } catch (e) {
      setLikes(prev); // revert
      setIsLiked(!newLikedState);
    } finally {
      setPending(false);
    }
  };

  const handleSave = async () => {
    if (!supabase || pending) return;
    setPending(true);
    const prev = saves;
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    setSaves(prev + (newSavedState ? 1 : -1));
    try {
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
      // Update local storage
      const localSaves = JSON.parse(localStorage.getItem('user_saves') || '{}');
      if (newSavedState) localSaves[imageId] = true;
      else delete localSaves[imageId];
      localStorage.setItem('user_saves', JSON.stringify(localSaves));
    } catch (e) {
      setSaves(prev); // revert
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
          {/* Reserve aspect-ratio space to prevent layout shift */}
          <div style={{ paddingBottom: `${(naturalHeight / naturalWidth) * 100}%` }} />
          {!failed ? (
            <Image
              src={displayUrl}
              alt={post.title || post.alt || "Design image"}
              width={naturalWidth}
              height={naturalHeight}
              className={`absolute left-0 top-0 w-full h-auto rounded-md transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' as const : 'low' as const}
              priority={priority}
              quality={70}
              placeholder="blur"
              blurDataURL={displayBlur}
              onLoad={() => setLoaded(true)}
              onError={() => {
                setFailed(true);
                setLoaded(true);
              }}
            />
          ) : (
            <img
              src={displayUrl}
              alt={post.title || post.alt || 'Design image'}
              className={`absolute left-0 top-0 w-full h-auto rounded-md transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
      <div className={`card-body p-4 ${viewMode === "list" ? "w-2/3" : ""}`}>
        <h2 className="card-title text-lg font-semibold mb-1">{post.title || post.alt || "Design Image"}</h2>
        {/* Removed photographer information as requested */}
        <div className="card-actions justify-end items-center mt-auto">
          <div className="flex items-center space-x-2">
            <button onClick={handleLike} disabled={!supabase || pending} title={!supabase ? 'Enable Supabase to like' : 'Like'}>
              <Heart className={`h-4 w-4 ${!supabase ? 'text-gray-400' : 'text-red-500'}`} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <span className="text-sm">{likes}</span>
            <button onClick={handleSave} disabled={!supabase || pending} title={!supabase ? 'Enable Supabase to save' : 'Save'}>
              <Bookmark className={`h-4 w-4 ${!supabase ? 'text-gray-400' : 'text-blue-500'}`} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <span className="text-sm">{saves}</span>
          </div>
        </div>
      </div>
    </div>
  );
}