'use client';

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Compass,
  Home,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Info,
  Calculator,
  Palette,
  Wind,
  Droplets,
  Flame,
  Mountain,
  Sun,
  Moon,
  Star,
  BookOpen,
  RefreshCw,
  MessageCircle,
  Send,
  Bot,
  User,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Zap,
  Shield,
  Heart
} from 'lucide-react';

// Types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface RoomType {
  value: string;
  label: string;
}

interface Direction {
  value: string;
  label: string;
}

interface VastuAnalysis {
  vastu_score: number;
  status: string;
  analysis: string;
  benefits: string[];
  issues: string[];
  recommendations: string[];
  remedies: {
    crystals: string[];
    plants: string[];
    colors: string[];
    symbols: string[];
    general_tips: string[];
  };
}

const VastuPage = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [roomType, setRoomType] = useState('');
  const [direction, setDirection] = useState('');
  const [analysis, setAnalysis] = useState<VastuAnalysis | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Namaste! I am your Vastu Shastra consultant. I can help you analyze your home according to ancient Vastu principles using AI and traditional astrology. How can I assist you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Astrology state
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  // Additional state for elements, guidelines, and tips
  const [vastuElements, setVastuElements] = useState<any[]>([]);
  const [roomGuidelines, setRoomGuidelines] = useState<any[]>([]);
  const [vastuTipsData, setVastuTipsData] = useState<any[]>([]);

  // Load data
  useEffect(() => {
    fetchRoomTypes();
    fetchDirections();
    fetchVastuElements();
    fetchRoomGuidelines();
    fetchVastuTips();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vastu/room-types`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRoomTypes(data.room_types || []);
    } catch (error) {
      console.error('Error fetching room types:', error);
      setError('Failed to load room types. Please refresh the page.');
      // Fallback data
      setRoomTypes([
        { value: "main_entrance", label: "Main Entrance" },
        { value: "living_room", label: "Living Room" },
        { value: "master_bedroom", label: "Master Bedroom" },
        { value: "kitchen", label: "Kitchen" },
        { value: "bathroom", label: "Bathroom" },
        { value: "study_room", label: "Study Room" },
        { value: "dining_room", label: "Dining Room" },
        { value: "pooja_room", label: "Pooja Room" }
      ]);
    }
  };

  const fetchDirections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vastu/directions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDirections(data.directions || []);
    } catch (error) {
      console.error('Error fetching directions:', error);
      setError('Failed to load directions. Please refresh the page.');
      // Fallback data
      setDirections([
        { value: "north", label: "North" },
        { value: "north-east", label: "North-East" },
        { value: "east", label: "East" },
        { value: "south-east", label: "South-East" },
        { value: "south", label: "South" },
        { value: "south-west", label: "South-West" },
        { value: "west", label: "West" },
        { value: "north-west", label: "North-West" }
      ]);
    }
  };

  const fetchVastuElements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vastu/elements`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVastuElements(data.elements || []);
    } catch (error) {
      console.error('Error fetching vastu elements:', error);
    }
  };

  const fetchRoomGuidelines = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vastu/room-guidelines`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRoomGuidelines(data.guidelines || []);
    } catch (error) {
      console.error('Error fetching room guidelines:', error);
    }
  };

  const fetchVastuTips = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vastu/tips`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVastuTipsData(data.tips || []);
    } catch (error) {
      console.error('Error fetching vastu tips:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendChatMessage = async () => {
    if (!currentMessage.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/vastu/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          chat_history: chatMessages,
          user_info: {
            birth_date: birthDate || null,
            birth_time: birthTime || null,
            birth_place: birthPlace || null,
            has_birth_details: !!(birthDate && birthTime && birthPlace)
          }
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();

      if (data.success) {
        setChatMessages(prev => [...prev, data.message]);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const analyzeRoom = async () => {
    if (!roomType || !direction) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/vastu/analyze-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_type: roomType,
          direction: direction,
          birth_date: birthDate || null,
          birth_time: birthTime || null,
          birth_place: birthPlace || null
        })
      });

      if (!response.ok) throw new Error('Failed to analyze room');
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      setError('Failed to analyze room. Please try again.');
      console.error('Error analyzing room:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-50 text-green-700 border-green-200';
      case 'good': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'average': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'poor': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <div className="grid gap-1">
                <h1 className="text-xl font-semibold">Vastu Shastra</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Ancient Wisdom</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:flex">
              <Sparkles className="mr-1 h-3 w-3" />
              Prokerala API
            </Badge>
            <Button size="sm">
              <BookOpen className="mr-2 h-4 w-4" />
              Learn More
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Analyzer</span>
            </TabsTrigger>
            <TabsTrigger value="elements" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Elements</span>
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Guidelines</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Tips</span>
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-4">
              {/* Main Chat */}
              <div className="lg:col-span-3">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">Vastu AI Consultant</CardTitle>
                        <CardDescription className="text-sm">
                          Powered by AI architect team
                        </CardDescription>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-muted-foreground">Online</span>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {chatMessages.map((message, index) => (
                        <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {message.role === 'assistant' && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`max-w-[70%] ${message.role === 'user' ? 'order-1' : ''}`}>
                            <div className={`rounded-lg px-3 py-2 text-sm ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground ml-auto'
                                : 'bg-muted'
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            <p className={`text-xs text-muted-foreground mt-1 ${
                              message.role === 'user' ? 'text-right' : 'text-left'
                            }`}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>

                          {message.role === 'user' && (
                            <Avatar className="h-8 w-8 order-2">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {chatLoading && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-lg px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <Separator />

                  {/* Input */}
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ask about Vastu principles, room placement, remedies..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                          }
                        }}
                        className="min-h-[60px] max-h-[120px] resize-none"
                        disabled={chatLoading}
                      />
                      <Button
                        onClick={sendChatMessage}
                        disabled={!currentMessage.trim() || chatLoading}
                        size="icon"
                        className="h-[60px] w-[60px]"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {["🏠 Analyze bedroom", "🍳 Kitchen colors", "💎 Vastu remedies", "🚪 Entrance direction"].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentMessage(suggestion)}
                          disabled={chatLoading}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Astrology Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-purple-500" />
                      Astrology Integration
                    </CardTitle>
                    <CardDescription>
                      Add birth details for personalized recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="birth-date">Birth Date</Label>
                      <Input
                        id="birth-date"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birth-time">Birth Time</Label>
                      <Input
                        id="birth-time"
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birth-place">Birth Place</Label>
                      <Input
                        id="birth-place"
                        placeholder="City, State, Country"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={() => {
                        if (birthDate && birthTime && birthPlace) {
                          setCurrentMessage(`Please provide personalized Vastu recommendations based on my birth chart. Birth details: ${birthDate} at ${birthTime} in ${birthPlace}`);
                        }
                      }}
                      className="w-full"
                      disabled={!birthDate || !birthTime || !birthPlace}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get Personalized Analysis
                    </Button>

                    {birthDate && birthTime && birthPlace && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          ✅ Authentic astrology data will be fetched from Prokerala API
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      "🏠 Complete home analysis",
                      "🛏️ Best bedroom direction",
                      "🍳 Kitchen placement guide",
                      "🚪 Main entrance analysis",
                      "💊 Vastu remedies",
                      "🧭 Direction meanings",
                      "🌿 Plant recommendations"
                    ].map((action) => (
                      <Button
                        key={action}
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentMessage(action)}
                        className="w-full justify-start"
                        disabled={chatLoading}
                      >
                        {action}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analyzer Tab */}
          <TabsContent value="analyzer" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-orange-500" />
                    Room Analyzer
                  </CardTitle>
                  <CardDescription>
                    Analyze your room placement according to Vastu principles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Room Type</Label>
                      <Select value={roomType} onValueChange={setRoomType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((room) => (
                            <SelectItem key={room.value} value={room.value}>
                              {room.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Direction</Label>
                      <Select value={direction} onValueChange={setDirection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                        <SelectContent>
                          {directions.map((dir) => (
                            <SelectItem key={dir.value} value={dir.value}>
                              {dir.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={analyzeRoom}
                    className="w-full"
                    disabled={!roomType || !direction || loading}
                  >
                    {loading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Compass className="mr-2 h-4 w-4" />
                    )}
                    {loading ? 'Analyzing...' : 'Analyze Room'}
                  </Button>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Analysis Results
                    </CardTitle>
                    <CardDescription>
                      {roomTypes.find(rt => rt.value === roomType)?.label} in {directions.find(d => d.value === direction)?.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(analysis.status)}>
                        {analysis.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">Score: {analysis.vastu_score}/100</span>
                    </div>

                    <Progress value={analysis.vastu_score} className="w-full" />

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Analysis</h4>
                        <p className="text-sm text-muted-foreground">{analysis.analysis}</p>
                      </div>

                      {analysis.benefits.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Benefits
                          </h4>
                          <ul className="text-sm space-y-1">
                            {analysis.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            Recommendations
                          </h4>
                          <ul className="text-sm space-y-1">
                            {analysis.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-yellow-500 mt-1">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Elements Tab */}
          <TabsContent value="elements" className="mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  Panchabhutas - Five Elements
                </CardTitle>
                <CardDescription>
                  Understanding the fundamental elements of Vastu Shastra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {vastuElements.length > 0 ? vastuElements.map((element) => (
                    <Card key={element.name} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`h-8 w-8 ${element.color} rounded-full flex items-center justify-center`}>
                            <Star className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{element.name}</h3>
                            <p className="text-sm text-muted-foreground">{element.direction}</p>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{element.properties}</p>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">{element.tips}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-muted-foreground">Loading Vastu elements...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guidelines Tab */}
          <TabsContent value="guidelines" className="mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  Room Placement Guidelines
                </CardTitle>
                <CardDescription>
                  Optimal directions and placements for different rooms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roomGuidelines.length > 0 ? roomGuidelines.map((guideline) => (
                    <Card key={guideline.room} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{guideline.room}</h3>
                          <Badge variant={
                            guideline.status === 'excellent' ? 'default' :
                            guideline.status === 'warning' ? 'secondary' : 'outline'
                          }>
                            {guideline.status}
                          </Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-sm font-medium text-green-700 mb-1">Best Direction</p>
                            <p className="text-sm">{guideline.bestDirection}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-red-700 mb-1">Avoid</p>
                            <p className="text-sm">{guideline.avoid}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-700 mb-1">Tips</p>
                            <p className="text-sm">{guideline.tips}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading room guidelines...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="mt-6">
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
              {vastuTipsData.length > 0 ? vastuTipsData.map((category: any) => (
                <Card key={category.category} className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-orange-500" />
                      {category.category}
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.tips.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-500 mt-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">Loading Vastu tips...</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VastuPage;