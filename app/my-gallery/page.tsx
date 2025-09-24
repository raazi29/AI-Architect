"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, RefreshCw, Trash } from "lucide-react"
import { supabase, hasSupabaseEnv } from "@/lib/supabaseClient"

interface Row {
  id: string
  prompt: string
  image_url: string
  storage_path: string | null
  is_favorite?: boolean | null
  created_at: string
  user_id?: string | null
}

export default function MyGalleryPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Convert a DB row to a renderable one by ensuring image_url is a public URL.
  const toRenderable = (row: Row): Row => {
    try {
      if (!hasSupabaseEnv || !supabase) return row
      const isHttp = typeof row.image_url === "string" && /^(https?:)?\/\//.test(row.image_url)
      if (!isHttp && row.storage_path) {
        const { data: pub } = supabase.storage
          .from("generated-images") // storage bucket name
          .getPublicUrl(row.storage_path)
        const publicUrl = pub?.publicUrl
        if (publicUrl) {
          return { ...row, image_url: publicUrl }
        }
      }
    } catch (e) {
      // non-fatal, fall through to return original row
      console.warn("Failed to derive public URL for row", row.id, e)
    }
    return row
  }

  const load = async () => {
    if (!hasSupabaseEnv || !supabase) return
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) {
        setRows([])
        return
      }
      const { data, error } = await supabase
        .from("generated_images")
        .select("id,prompt,image_url,storage_path,is_favorite,created_at,user_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      if (error) throw error
      setRows((data || []).map(toRenderable))
    } catch (e) {
      console.error("Failed to load gallery:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Subscribe to realtime changes so new generations appear automatically
    if (hasSupabaseEnv && supabase) {
      let currentUserId: string | null = null
      supabase.auth.getUser().then((res: { data: { user: { id: string } | null } }) => { currentUserId = res.data.user?.id ?? null })

      const channel = supabase
        .channel('generated_images_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'generated_images' }, (payload: any) => {
          const row = payload.new as Row
          if (!currentUserId || (row as any).user_id !== currentUserId) return
          setRows((prev) => [toRenderable(row), ...prev])
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'generated_images' }, (payload: any) => {
          const row = payload.new as Row
          if (!currentUserId || (row as any).user_id !== currentUserId) return
          const normalized = toRenderable(row)
          setRows((prev) => prev.map((r) => (r.id === normalized.id ? { ...r, ...normalized } as Row : r)))
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'generated_images' }, (payload: any) => {
          const row = payload.old as Row
          if (!currentUserId || (row as any).user_id !== currentUserId) return
          setRows((prev) => prev.filter((r) => r.id !== row.id))
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const download = (url: string, filename = "ai-architect.png") => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // favorites removed

  const remove = async (row: Row, idx: number) => {
    if (!hasSupabaseEnv || !supabase) return
    setRows((prev) => prev.filter((_, i) => i !== idx))
    try {
      // delete db record
      const { error } = await supabase.from("generated_images").delete().eq("id", row.id)
      if (error) throw error
      // optional: also delete from storage
      if (row.storage_path) {
        await supabase.storage.from("generated-images").remove([row.storage_path])
      }
    } catch (e) {
      console.error("Delete failed", e)
      // on failure, reload list
      load()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Gallery</h1>
                <p className="text-muted-foreground">All images you've generated</p>
              </div>
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" /> {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {!hasSupabaseEnv && (
            <div className="text-sm text-red-500 mb-4">Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.</div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Generated Images</CardTitle>
              <CardDescription>Click an image to preview or download.</CardDescription>
            </CardHeader>
            <CardContent>
              {rows.length === 0 && (
                <div className="text-center text-muted-foreground py-10">No images yet.</div>
              )}
              {rows.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rows.map((row, idx) => (
                    <div key={row.id} className="relative group">
                      <img
                        src={row.image_url}
                        alt={row.prompt}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() => {
                          setPreviewUrl(row.image_url)
                          setPreviewOpen(true)
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg gap-2">
                        <Button variant="secondary" size="icon" onClick={() => download(row.image_url, `ai-architect-${idx + 1}.png`)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => remove(row, idx)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground line-clamp-2">{row.prompt}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-md" />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
