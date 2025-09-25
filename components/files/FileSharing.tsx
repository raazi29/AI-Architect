"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Plus,
  Upload,
  Download,
  Share2,
  Trash2,
  Eye,
  MessageSquare,
  Filter,
  Search,
  File,
  Image,
  Video,
  Music,
  Archive,
  Code,
  FileText,
  Presentation,
  Database,
  Globe
} from "lucide-react";

interface FileItem {
  id: string;
  project_id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  creator?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface FileSharingProps {
  projectId: string;
}

export default function FileSharing({ projectId }: FileSharingProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchFiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_files")
        .select(`
          *,
          creator:profiles!created_by(id, username, avatar_url)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching files:", error);
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    };

    fetchFiles();

    // Subscribe to file changes
    const channel = supabase
      .channel("files-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_files",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          fetchFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;

    const file = e.target.files[0];
    if (!file) return;

    try {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("project_files")
        .upload(`${projectId}/${fileName}`, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        return;
      }

      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from("project_files")
        .getPublicUrl(`${projectId}/${fileName}`);

      // Insert file record in database
      const { data, error } = await supabase
        .from("project_files")
        .insert([
          {
            project_id: projectId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: urlData?.publicUrl || "",
            created_by: user.id,
            is_public: false,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating file record:", error);
      } else if (data) {
        setFiles([data[0], ...files]);
        setShowUploadForm(false);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;

    try {
      // Get file info to delete from storage
      const { data: fileInfo, error: fetchError } = await supabase
        .from("project_files")
        .select("url")
        .eq("id", fileId)
        .single();

      if (fetchError) {
        console.error("Error fetching file info:", fetchError);
        return;
      }

      // Delete file from storage
      const filePath = fileInfo.url.split("/").pop();
      const { error: deleteError } = await supabase.storage
        .from("project_files")
        .remove([`${projectId}/${filePath}`]);

      if (deleteError) {
        console.error("Error deleting file from storage:", deleteError);
        return;
      }

      // Delete file record from database
      const { error } = await supabase
        .from("project_files")
        .delete()
        .eq("id", fileId);

      if (error) {
        console.error("Error deleting file record:", error);
      } else {
        setFiles(files.filter(file => file.id !== fileId));
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-5 w-5 text-blue-500" />;
    if (fileType.startsWith("video/")) return <Video className="h-5 w-5 text-purple-500" />;
    if (fileType.startsWith("audio/")) return <Music className="h-5 w-5 text-pink-500" />;
    if (fileType.includes("zip") || fileType.includes("rar")) return <Archive className="h-5 w-5 text-yellow-500" />;
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return <Presentation className="h-5 w-5 text-orange-500" />;
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <Database className="h-5 w-5 text-green-500" />;
    if (fileType.includes("code") || fileType.includes("javascript") || fileType.includes("typescript")) return <Code className="h-5 w-5 text-indigo-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = 
      file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || file.type.includes(filterType);
    const matchesVisibility = filterVisibility === "all" || 
      (filterVisibility === "public" && file.is_public) || 
      (filterVisibility === "private" && !file.is_public);
    return matchesSearch && matchesType && matchesVisibility;
  });

  if (loading) {
    return <div className="p-4 text-center">Loading files...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Files</h2>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="text">Documents</SelectItem>
            <SelectItem value="application">Applications</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterVisibility} onValueChange={setFilterVisibility}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFiles.map((file) => (
          <Card key={file.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getFileIcon(file.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base line-clamp-2">{file.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(file.size)}
                      </Badge>
                      {file.is_public ? (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800">
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDownloadFile(file.url, file.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>0</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage 
                      src={file.creator?.avatar_url || "/placeholder.svg"} 
                      alt={file.creator?.username || "User"} 
                    />
                    <AvatarFallback className="text-xs">
                      {file.creator?.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {file.creator?.username || "Unknown"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(file.created_at), "MMM d, yyyy")}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => navigator.clipboard.writeText(file.url)}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFiles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <File className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Upload your first file to this project"}
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}