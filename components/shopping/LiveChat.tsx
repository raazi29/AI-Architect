'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
}

interface LiveChatProps {
  productId?: string;
  productName?: string;
  retailer?: string;
}

export default function LiveChat({ productId, productName, retailer }: LiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: `Hello! I'm your customer support assistant. How can I help you with ${productName || 'this product'} today?`,
          sender: 'support',
          timestamp: new Date(),
        }
      ]);
    }
  }, [isOpen, productName, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
 }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate support response after a delay
    setTimeout(() => {
      const responses = [
        `I understand you're asking about "${inputValue}". Let me check the details for you.`,
        `Thanks for your question about ${productName || 'this product'}. I'll look that up for you right away.`,
        `I can help you with that! ${productName || 'This product'} is currently in stock and available for delivery.`,
        `Great question! ${retailer || 'Our retailers'} typically offer a 7-day return policy for this item.`,
        `I see you're interested in more details. Would you like me to connect you with a product specialist?`,
        `Based on your question, I recommend checking the product specifications tab for more detailed information.`
      ];

      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'support',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, supportMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-80 h-96 flex flex-col shadow-xl">
          <CardHeader className="p-3 bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Customer Support</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-primary-foreground hover:text-primary-foreground"
                onClick={() => setIsOpen(false)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start gap-2 max-w-[80%] ${
                        message.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar className="w-6 h-6">
                        {message.sender === 'user' ? (
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="w-3 h-3" />
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-secondary">
                            <Bot className="w-3 h-3" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-secondary text-secondary-foreground rounded-tl-none'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[80%]">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-secondary">
                          <Bot className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="px-3 py-2 rounded-lg text-sm bg-secondary text-secondary-foreground rounded-tl-none">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="text-sm h-8"
                />
                <Button
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-12 w-12 p-0 shadow-lg"
          variant="default"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}