"use client"

import { useState, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
} from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  suggestions?: string[]
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

const quickPrompts = [
  {
    icon: Home,
    text: "Help me redesign my living room",
    category: "Room Design",
  },
  {
    icon: Palette,
    text: "What colors work well together?",
    category: "Color Advice",
  },
  {
    icon: ShoppingCart,
    text: "Find furniture under $500",
    category: "Shopping",
  },
  {
    icon: Lightbulb,
    text: "Small space decorating tips",
    category: "Tips",
  },
]

const sampleResponses = {
  "help me redesign my living room": {
    content:
      "I'd love to help you redesign your living room! To give you the best recommendations, could you tell me:\n\n• What's your current style preference? (Modern, Traditional, Scandinavian, etc.)\n• What's your approximate budget?\n• What are the room dimensions?\n• Any specific challenges or must-have features?\n\nI can also analyze a photo of your current space if you'd like to upload one to the AI Generator!",
    suggestions: ["Upload a room photo", "Browse design styles", "Set my budget", "Show me modern living rooms"],
  },
  "what colors work well together": {
    content:
      "Great question! Here are some timeless color combinations that work beautifully in interior design:\n\n🎨 **Classic Combinations:**\n• Navy + White + Gold accents\n• Sage Green + Cream + Natural wood\n• Charcoal + Blush Pink + Brass\n• Terracotta + Ivory + Black accents\n\n🌟 **Pro Tips:**\n• Use the 60-30-10 rule: 60% dominant color, 30% secondary, 10% accent\n• Consider your room's natural light\n• Test colors in different lighting conditions\n\nWould you like specific suggestions for a particular room?",
    suggestions: [
      "Show me color palettes",
      "Help with my bedroom colors",
      "Lighting and color tips",
      "Browse colorful designs",
    ],
  },
  "find furniture under $500": {
    content:
      "I can help you find great furniture pieces under $500! Here are some budget-friendly options:\n\n💺 **Seating ($200-$450):**\n• Accent chairs from Target, IKEA\n• Small sectionals from Wayfair\n• Dining chairs (set of 2-4)\n\n🪑 **Tables ($150-$400):**\n• Coffee tables with storage\n• Side tables and nightstands\n• Small dining tables\n\n📚 **Storage ($100-$350):**\n• Bookcases and shelving units\n• Storage ottomans\n• TV stands and media consoles\n\nWant me to search for specific pieces or show you our shopping integration?",
    suggestions: ["Browse budget furniture", "Search specific items", "Compare prices", "View shopping deals"],
  },
  "small space decorating tips": {
    content:
      "Small spaces can be incredibly stylish with the right approach! Here are my top tips:\n\n✨ **Maximize Space:**\n• Use vertical storage (tall bookcases, wall shelves)\n• Choose furniture with legs to create visual flow\n• Opt for multi-functional pieces (storage ottomans, nesting tables)\n\n🪞 **Create Illusion of Space:**\n• Add mirrors to reflect light and expand views\n• Use light, neutral colors on walls\n• Keep window treatments minimal\n\n💡 **Smart Lighting:**\n• Layer different light sources\n• Use wall sconces to save floor space\n• Choose light fixtures that don't overwhelm\n\nWould you like specific product recommendations for your space?",
    suggestions: ["Show small space designs", "Find space-saving furniture", "Lighting solutions", "Storage ideas"],
  },
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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("default")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log("AI Assistant page loaded successfully")
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

    // Simulate AI response delay
    setTimeout(() => {
      const lowerContent = content.toLowerCase()
      const response = Object.entries(sampleResponses).find(([key]) => lowerContent.includes(key.toLowerCase()))

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response ? response[1].content : generateGenericResponse(content),
        sender: "assistant",
        timestamp: new Date(),
        suggestions: response ? response[1].suggestions : generateGenericSuggestions(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateGenericResponse = (userInput: string) => {
    const responses = [
      `That's a great question about ${userInput}! I'd be happy to help you with that. Could you provide more details about your specific needs or preferences?`,
      `I understand you're interested in ${userInput}. Let me help you explore some options and ideas that might work for your space.`,
      `Thanks for asking about ${userInput}! I can definitely assist with that. What's your current situation and what are you hoping to achieve?`,
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const generateGenericSuggestions = () => {
    return ["Tell me more details", "Show me examples", "What's my budget?", "Browse related designs"]
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

  const startNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Chat ${chatSessions.length + 1}`,
      messages: [
        {
          id: "welcome-new",
          content: "Hello! I'm ready to help you with your interior design questions. What would you like to discuss?",
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
    }

    setChatSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setMessages(newSession.messages)
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">AI Design Assistant</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Get personalized interior design advice, recommendations, and expert tips from your AI assistant.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={startNewChat}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button variant="outline" onClick={exportChat}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {chatSessions.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <Badge
                  variant={currentSessionId === "default" ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
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
                  <Clock className="h-3 w-3 mr-1" />
                  Current Chat
                </Badge>
                {chatSessions.map((session) => (
                  <Badge
                    key={session.id}
                    variant={currentSessionId === session.id ? "default" : "outline"}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setCurrentSessionId(session.id)
                      setMessages(session.messages)
                    }}
                  >
                    {session.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Chat with AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask questions about interior design, get recommendations, and receive expert advice
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 px-6">
                    <div className="space-y-4 pb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {message.sender === "assistant" && (
                            <Avatar className="w-8 h-8 mt-1">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`max-w-[80%] ${message.sender === "user" ? "order-first" : ""}`}>
                            <div
                              className={`rounded-lg p-3 ${
                                message.sender === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-line">{message.content}</p>
                            </div>

                            {message.suggestions && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {message.suggestions.map((suggestion, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 bg-transparent"
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
                            <Avatar className="w-8 h-8 mt-1">
                              <AvatarFallback className="bg-accent text-accent-foreground text-xs">You</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="w-8 h-8 mt-1">
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
                    </div>
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          ref={inputRef}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Ask me about interior design, colors, furniture, or decorating tips..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage(inputValue)
                            }
                          }}
                          className="pr-12"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={handleVoiceInput}
                          disabled={isListening}
                        >
                          {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isTyping}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Prompts</CardTitle>
                  <CardDescription>Get started with these common questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-3 text-left bg-transparent"
                      onClick={() => handleSendMessage(prompt.text)}
                    >
                      <div className="flex items-start gap-3">
                        <prompt.icon className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{prompt.text}</p>
                          <p className="text-xs text-muted-foreground">{prompt.category}</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What I Can Help With</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Home className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Room Design</p>
                        <p className="text-muted-foreground text-xs">
                          Layout planning, style recommendations, space optimization
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Palette className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Color & Style</p>
                        <p className="text-muted-foreground text-xs">
                          Color palettes, design styles, material suggestions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShoppingCart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Furniture & Shopping</p>
                        <p className="text-muted-foreground text-xs">
                          Product recommendations, budget planning, comparisons
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Expert Tips</p>
                        <p className="text-muted-foreground text-xs">Professional advice, trends, problem-solving</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pro Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Be specific about your room dimensions and budget</p>
                    <p>• Mention your style preferences and lifestyle needs</p>
                    <p>• Ask about specific challenges you're facing</p>
                    <p>• Use voice input for hands-free interaction</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
