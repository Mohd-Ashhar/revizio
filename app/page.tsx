// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PanelLeftClose, PanelRight } from "lucide-react";

import SourceSelector, { Pdf } from "./components/SourceSelector";
import QuizView from "./components/QuizView";
import ChatView from "./components/ChatView";
import ChatHistory from "./components/ChatHistory"; // Import the new component
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator"; // Import Separator

const PdfViewer = dynamic(() => import("./components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-800">
      <p>Loading PDF Viewer...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedPdf, setSelectedPdf] = useState<Pdf | null>(null);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [isSourceSidebarOpen, setIsSourceSidebarOpen] = useState(true);
  const [isPdfSidebarOpen, setIsPdfSidebarOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null); // New state for active chat
  const supabase = createClient();

  // Reset conversation when PDF changes
  useEffect(() => {
    setActiveConversationId(null);
  }, [selectedPdf]);

  // ... (keep your existing useEffect for session and handleEmbed function) ...
  useEffect(() => {
    const ensureSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          toast.error("Auth error", {
            description: error.message,
          });
        }
      }
    };
    ensureSession();
  }, [supabase]);

  const handleEmbed = async () => {
    if (!selectedPdf) return;
    setIsEmbedding(true);

    toast.info("Processing PDF...", {
      description: "This may take a moment. Please wait.",
    });

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-embeddings",
        {
          body: { pdf_id: selectedPdf.id },
        }
      );

      if (error) {
        throw error;
      }

      toast.success("Success!", {
        description:
          `"${selectedPdf.file_name}" is now ready for chat.` +
          (data?.message ? ` ${data.message}` : ""),
      });
    } catch (err: any) {
      toast.error("Error", {
        description: err?.message || "Failed to process the PDF for chat.",
      });
    } finally {
      setIsEmbedding(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-muted/20 transition-all duration-300",
          isSourceSidebarOpen ? "w-full md:w-[300px]" : "w-0 md:w-16"
        )}
      >
        <div className="flex h-16 items-center border-b px-4">
          <h1
            className={cn(
              "text-xl font-bold",
              !isSourceSidebarOpen && "hidden"
            )}
          >
            Revizio
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setIsSourceSidebarOpen(!isSourceSidebarOpen)}
          >
            <PanelLeftClose className="size-5" />
          </Button>
        </div>
        <div
          className={cn(
            "flex-grow p-4 flex flex-col gap-4",
            !isSourceSidebarOpen && "hidden"
          )}
        >
          <div>
            <SourceSelector onPdfSelect={setSelectedPdf} />
            <Button
              onClick={handleEmbed}
              disabled={!selectedPdf || isEmbedding}
              variant="secondary"
              className="w-full mt-2"
            >
              {isEmbedding ? "Processing..." : "Process for Chat"}
            </Button>
          </div>
          <Separator />
          {/* Chat History Section */}
          <div className="flex-grow overflow-hidden">
            <h2 className="text-lg font-semibold mb-2">Chat History</h2>
            <ChatHistory
              pdfId={selectedPdf?.id ?? null}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
            />
          </div>
          <Separator />
          <Link href="/dashboard" passHref className="block w-full">
            <Button variant="outline" className="w-full">
              View Progress
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content (Chat & Quiz) */}
      <main className="flex flex-1 flex-col p-4 md:p-6 overflow-hidden">
        <header className="flex items-center justify-end h-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPdfSidebarOpen(!isPdfSidebarOpen)}
          >
            <PanelRight className="size-5" />
          </Button>
        </header>
        <Tabs
          defaultValue="chat"
          className="flex-grow flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
            <TabsTrigger value="chat">Chat with PDF</TabsTrigger>
            <TabsTrigger value="quiz">Generate Quiz</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-grow mt-4 overflow-y-auto">
            {/* Pass state down to ChatView */}
            <ChatView
              key={activeConversationId || "new"} // Use key to force re-render
              pdfId={selectedPdf?.id ?? null}
              conversationId={activeConversationId}
              setConversationId={setActiveConversationId}
            />
          </TabsContent>
          <TabsContent value="quiz" className="flex-grow mt-4 overflow-y-auto">
            <QuizView pdfId={selectedPdf?.id ?? null} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Right Sidebar (PDF Viewer) */}
      <div
        className={cn(
          "hidden md:block border-l overflow-y-auto transition-all duration-300",
          isPdfSidebarOpen ? "w-1/2" : "w-0"
        )}
      >
        <PdfViewer file={selectedPdf?.storage_path ?? null} />
      </div>
    </div>
  );
}
