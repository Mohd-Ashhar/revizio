// app/components/ChatView.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, BotMessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  pdfId: string | null;
  conversationId: string | null;
  setConversationId: (id: string) => void;
  isPdfEmbedded: boolean;
}

interface Message {
  id?: string;
  content: string;
  role: "user" | "bot";
}

export default function ChatView({
  pdfId,
  conversationId,
  setConversationId,
  isPdfEmbedded,
}: ChatViewProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) {
        setMessages([]);
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, role")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      } else {
        setMessages(data as Message[]);
      }
      setIsLoading(false);
    };
    loadMessages();
  }, [conversationId, supabase]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !pdfId) return;

    const userMessage: Message = { content: inputValue, role: "user" };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    let currentConversationId = conversationId;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      if (!currentConversationId) {
        const { data: newConvo, error: convoError } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            pdf_id: pdfId,
            title:
              currentInput.substring(0, 50) +
              (currentInput.length > 50 ? "..." : ""),
          })
          .select()
          .single();
        if (convoError) throw convoError;
        currentConversationId = newConvo.id;
        setConversationId(newConvo.id);
      }

      const { error: userMessageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversationId,
          user_id: user.id,
          content: currentInput,
          role: "user",
        });
      if (userMessageError) throw userMessageError;

      const { data: functionData, error: functionError } =
        await supabase.functions.invoke("chat-with-pdf", {
          body: { query: currentInput, pdf_id: pdfId },
        });
      if (functionError) throw functionError;

      const botMessage: Message = { content: functionData.answer, role: "bot" };

      const { error: botMessageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversationId,
          user_id: user.id,
          content: botMessage.content,
          role: "bot",
        });
      if (botMessageError) throw botMessageError;

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          content: "Sorry, I encountered an error. Please try again.",
          role: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  const getPlaceholderText = () => {
    if (!pdfId) {
      return "Please select a PDF first";
    }
    if (!isPdfEmbedded) {
      return "Please process the PDF for chat first";
    }
    return "Ask a question...";
  };
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* The ScrollArea now takes up the flexible space */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="space-y-6 px-4 py-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
              <div className="p-3 mb-4 border-2 border-dashed rounded-full">
                <BotMessageSquare className="size-8" />
              </div>
              <h2 className="text-xl font-semibold">Welcome to Revizio</h2>
              <p>Select a document, process it, and start asking questions.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={message.id || `local-${index}`}
              className={cn(
                "flex items-start gap-3 text-sm",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "bot" && (
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "rounded-lg p-3 max-w-[85%] whitespace-pre-wrap",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 border">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="rounded-lg p-3 bg-muted">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      {/* The form container no longer grows or shrinks */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <form
          onSubmit={handleSendMessage}
          className="relative flex items-center"
        >
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={getPlaceholderText()}
            disabled={!pdfId || isLoading || !isPdfEmbedded}
            rows={1}
            className="pr-12 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            disabled={
              !pdfId || isLoading || !inputValue.trim() || !isPdfEmbedded
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
