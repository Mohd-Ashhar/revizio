// app/components/ChatHistory.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
}

interface ChatHistoryProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  pdfId: string | null;
}

export default function ChatHistory({
  activeConversationId,
  onSelectConversation,
  pdfId,
}: ChatHistoryProps) {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!pdfId) {
        setConversations([]);
        return;
      }

      const { data, error } = await supabase
        .from("conversations")
        .select("id, title")
        .eq("pdf_id", pdfId) // Only show chats for the selected PDF
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
      } else {
        setConversations(data);
      }
    };

    fetchConversations();
  }, [pdfId, supabase]);

  return (
    <div className="flex flex-col h-full">
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => onSelectConversation(null)}
      >
        <PlusCircle className="size-4" /> New Chat
      </Button>
      <div className="flex-grow mt-4 space-y-2 overflow-y-auto">
        {conversations.map((convo) => (
          <Button
            key={convo.id}
            variant={activeConversationId === convo.id ? "secondary" : "ghost"}
            className="w-full justify-start gap-2 truncate"
            onClick={() => onSelectConversation(convo.id)}
          >
            <MessageSquare className="size-4 shrink-0" />
            <span className="truncate">{convo.title}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
