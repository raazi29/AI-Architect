"use client"

import { useState, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ImageAnalysisDisplay } from "@/components/image-analysis-display"
import { analyzeImage, chatWithAI, API_BASE_URL } from "@/lib/api"
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Home,
  Palette,
  ShoppingCart,
  Lightbulb,
  Clock,
  Download,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  History,
  Trash2,
  Menu,
  Plus,
} from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  suggestions?: string[]
  imageUrl?: string
  imageAnalysis?: {
    room_type: string
    design_style: string
    furniture_objects: string[]
    color_palette: string[]
    improvement_suggestions: string[]
  }
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your AI Interior Design Assistant. I can help you with room design, color advice, furniture recommendations, and decorating tips. What would you like to work on today?",
      sender: "assistant",
      timestamp: new Date(),
      suggestions: [
        "Help me redesign my living room",
        "What colors work well together?",
        "Find furniture under $500",
        "Small space decorating tips",
      ],
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("default")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isFullscreenChat, setIsFullscreenChat] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load chat sessions on component mount
  useEffect(() => {
    loadChatSessions()
    console.log("AI Assistant page loaded successfully")
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Save chat history when messages change
  useEffect(() => {
    if (currentSessionId !== "default" && messages.length > 1) {
      saveChatHistory()
    }
  }, [messages, currentSessionId])

  const loadChatSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat-sessions`)

      if (response.ok) {
        const data = await response.json()
        const sessions = data.sessions.map((session: any) => ({
          id: session.id,
          title: session.title,
          messages: [],
          createdAt: new Date(session.created_at),
          updatedAt: new Date(session.updated_at),
        }))
        setChatSessions(sessions)
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error)
    }
  }

  const saveChatHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/save-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          title: `Chat ${currentSessionId.slice(0, 8)}`,
          messages: messages,
        }),
      })

      if (response.ok) {
        // Refresh session list
        loadChatSessions()
      }
    } catch (error) {
      console.error("Failed to save chat history:", error)
    }
  }

  const loadChatHistory = async (sessionId: string) => {
    if (sessionId === "default") {
      setMessages([
        {
          id: "welcome",
          content:
            "Hello! I'm your AI Interior Design Assistant. I can help you with room design, color advice, furniture recommendations, and decorating tips. What would you like to work on today?",
          sender: "assistant",
          timestamp: new Date(),
          suggestions: [
            "Help me redesign my living room",
            "What colors work well together?",
            "Find furniture under $500",
            "Small space decorating tips",
          ],
        },
      ])
      return
    }

    setIsLoadingHistory(true)
    try {
      const response = await fetch(`${API_BASE_URL}/chat-history/${sessionId}`)

      if (response.ok) {
        const data = await response.json()
        const loadedMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(loadedMessages)
      } else {
        // If no history found, start with empty chat
        setMessages([
          {
            id: "welcome-" + Date.now(),
            content:
              "Hello! I'm your AI Interior Design Assistant. I can help you with room design, color advice, furniture recommendations, and decorating tips. What would you like to work on today?",
            sender: "assistant",
            timestamp: new Date(),
            suggestions: [
              "Help me redesign my living room",
              "What colors work well together?",
              "Find furniture under $500",
              "Small space decorating tips",
            ],
          },
        ])
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
      // Fallback to default message
      setMessages([
        {
          id: "welcome-" + Date.now(),
          content:
            "Hello! I'm your AI Interior Design Assistant. I can help you with room design, color advice, furniture recommendations, and decorating tips. What would you like to work on today?",
          sender: "assistant",
          timestamp: new Date(),
          suggestions: [
            "Help me redesign my living room",
            "What colors work well together?",
            "Find furniture under $500",
            "Small space decorating tips",
          ],
        },
      ])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // Prepare messages for AI (excluding suggestions and image analysis data)
      const aiMessages = messages.map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content
      })).concat({
        role: "user",
        content: content.trim()
      });

      // Get response from AI
      const aiResponse = await chatWithAI(aiMessages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: "assistant",
        timestamp: new Date(),
        suggestions: ["Tell me more", "Show me examples", "What's my budget?", "Browse related designs"],
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("AI chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
        suggestions: ["Try again", "Ask something else", "Upload an image instead"],
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputValue(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
      alert("Speech recognition error. Please try again.")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return

    try {
      setIsAnalyzing(true)
      
      // Add user image message to chat
      const userImageMessage: Message = {
        id: Date.now().toString(),
        content: "Analyze this image",
        sender: "user",
        timestamp: new Date(),
        imageUrl: imagePreview || undefined
      }
      
      setMessages((prev) => [...prev, userImageMessage])
      setSelectedImage(null)
      setImagePreview(null)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      // Analyze the image
      const result = await analyzeImage(selectedImage)
      
      // Create assistant response with analysis
      const analysis = result.analysis
      const analysisContent = `Here's my analysis of your image:\n\n` +
        `**Room Type:** ${analysis.room_type}\n` +
        `**Design Style:** ${analysis.design_style}\n` +
        `**Furniture/Objects:** ${analysis.furniture_objects.join(", ")}\n` +
        `**Color Palette:** ${analysis.color_palette.join(", ")}\n\n` +
        `**Improvement Suggestions:**\n${analysis.improvement_suggestions.join("\n")}`
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: analysisContent,
        sender: "assistant",
        timestamp: new Date(),
        suggestions: ["Tell me more about the design style", "Suggest furniture for this room", "Show me similar designs"],
        imageUrl: imagePreview || undefined,
        imageAnalysis: analysis
      }
      
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Image analysis failed:", error)
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I couldn't analyze the image. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
        suggestions: ["Try uploading a different image", "Ask me about design principles instead"],
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const startNewChat = () => {
    const newSessionId = Date.now().toString()
    const newSession: ChatSession = {
      id: newSessionId,
      title: `Chat ${newSessionId.slice(0, 8)}`,
      messages: [
        {
          id: "welcome-new",
          content: "Hello! I'm your AI Interior Design Assistant. I can help you with room design, color advice, furniture recommendations, and decorating tips. What would you like to work on today?",
          sender: "assistant",
          timestamp: new Date(),
          suggestions: [
            "Help me redesign my living room",
            "What colors work well together?",
            "Find furniture under $500",
            "Small space decorating tips",
          ],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setChatSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSessionId)
    setMessages(newSession.messages)
    setSelectedImage(null)
    setImagePreview(null)
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const deleteChatSession = async (sessionId: string) => {
    // Remove from local state
    setChatSessions(prev => prev.filter(session => session.id !== sessionId))
    
    // If we're deleting the current session, switch to default
    if (currentSessionId === sessionId) {
      setCurrentSessionId("default")
      setMessages([
        {
          id: "welcome",
          content:
            "Hello! I'm your AI Interior Design Assistant. I can help you with room design, color advice, furniture recommendations, and decorating tips. What would you like to work on today?",
          sender: "assistant",
          timestamp: new Date(),
          suggestions: [
            "Help me redesign my living room",
            "What colors work well together?",
            "Find furniture under $500",
            "Small space decorating tips",
          ],
        },
      ])
    }
  }

  const exportChat = () => {
    const chatData = {
      sessionId: currentSessionId,
      messages: messages,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ai-assistant-chat-${currentSessionId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleFullscreen = () => {
    setIsFullscreenChat(!isFullscreenChat)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-64 bg-muted/50 border-r flex flex-col">
          <div className="p-3 border-b">
            <Button 
              onClick={startNewChat} 
              className="w-full justify-start gap-2"
              variant="ghost"
            >
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              <div 
                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${currentSessionId === "default" ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => {
                  setCurrentSessionId("default")
                  setMessages([
                    {
                      id: "welcome",
                      content:
                        "Hello! I'm your AI Interior Design Assistant. I can help you with room design, color advice, furniture recommendations, and decorating tips. What would you like to work on today?",
                      sender: "assistant",
                      timestamp: new Date(),
                      suggestions: [
                        "Help me redesign my living room",
                        "What colors work well together?",
                        "Find furniture under $500",
                        "Small space decorating tips",
                      ],
                    },
                  ])
                }}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm truncate">Current Chat</span>
              </div>
              
              {chatSessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`flex items-center justify-between p-2 rounded cursor-pointer ${currentSessionId === session.id ? "bg-muted" : "hover:bg-muted"}`}
                  onClick={() => {
                    setCurrentSessionId(session.id)
                    loadChatHistory(session.id)
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <History className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{session.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteChatSession(session.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={exportChat}
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Export chat</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-foreground">AI Design Assistant</h1>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={startNewChat}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
            >
              {isFullscreenChat ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.sender === "assistant" && (
                  <Avatar className="w-6 h-6 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[85%] ${message.sender === "user" ? "order-first" : ""}`}>
                  {message.imageUrl && (
                    <div className="mb-2">
                      <img
                        src={message.imageUrl}
                        alt="Uploaded content"
                        className="max-w-[200px] max-h-[200px] rounded-md object-cover"
                      />
                    </div>
                  )}
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      message.sender === "user" 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                    {message.imageAnalysis && (
                      <div className="mt-3">
                        <ImageAnalysisDisplay analysis={message.imageAnalysis} />
                      </div>
                    )}
                  </div>

                  {message.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 bg-background hover:bg-muted"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {message.sender === "user" && (
                  <Avatar className="w-6 h-6 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-6 h-6 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            {isLoadingHistory && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-6 h-6 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="border-t p-3 bg-background">
          {/* Image preview */}
          {imagePreview && (
            <div className="mb-3 flex items-center gap-2 p-2 bg-muted rounded">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded border"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[8px] hover:bg-destructive/90"
                  aria-label="Remove image"
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Image selected</p>
              </div>
              <Button
                onClick={handleAnalyzeImage}
                disabled={isAnalyzing}
                size="sm"
                className="h-7 text-xs px-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-3 w-3" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          )}
          
          <div className="flex gap-2 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message AI Assistant..."
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(inputValue)
                  }
                }}
                className="pr-20 py-5"
              />
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={triggerFileSelect}
                  disabled={isAnalyzing}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={handleVoiceInput}
                  disabled={isListening || isAnalyzing}
                >
                  {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping || isAnalyzing}
              className="h-11 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}