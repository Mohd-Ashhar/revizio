// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PanelLeftClose, PanelRight, Menu, X } from "lucide-react";
import { useMediaQuery } from "./hooks/use-media-query"; // We will create this custom hook

import SourceSelector, { Pdf } from "./components/SourceSelector";
import QuizView from "./components/QuizView";
import ChatView from "./components/ChatView";
import ChatHistory from "./components/ChatHistory";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const PdfViewer = dynamic(() => import("./components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-muted">
      <p>Loading PDF Viewer...</p>
    </div>
  ),
});

// Custom hook to check screen size
const useIsDesktop = () => {
  return useMediaQuery("(min-width: 768px)");
};

export default function Home() {
  const [selectedPdf, setSelectedPdf] = useState<Pdf | null>(null);
  const [isEmbedding, setIsEmbedding] = useState(false);

  const isDesktop = useIsDesktop();
  // Sidebar is open by default on desktop, closed on mobile
  const [isSourceSidebarOpen, setIsSourceSidebarOpen] = useState(isDesktop);
  const [isPdfSidebarOpen, setIsPdfSidebarOpen] = useState(false);

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const supabase = createClient();

  // Adjust sidebar state when viewport size changes
  useEffect(() => {
    setIsSourceSidebarOpen(isDesktop);
    setIsPdfSidebarOpen(false); // Keep PDF view closed by default on resize
  }, [isDesktop]);

  useEffect(() => {
    setActiveConversationId(null);
  }, [selectedPdf]);

  useEffect(() => {
    const ensureSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) toast.error("Auth error", { description: error.message });
      }
    };
    ensureSession();
  }, [supabase]);

  const handleEmbed = async () => {
    if (!selectedPdf) return;
    setIsEmbedding(true);
    toast.info("Processing PDF...", { description: "This may take a moment." });
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-embeddings",
        { body: { pdf_id: selectedPdf.id } }
      );
      if (error) throw error;
      toast.success("Success!", {
        description:
          `"${selectedPdf.file_name}" is now ready for chat.` +
          (data?.message ? ` ${data.message}` : ""),
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Error", {
        description: error?.message || "Failed to process the PDF for chat.",
      });
    } finally {
      setIsEmbedding(false);
    }
  };

  return (
    <div className="relative flex h-screen bg-background text-foreground overflow-hidden">
      {/* Overlay for mobile */}
      {(isSourceSidebarOpen || isPdfSidebarOpen) && !isDesktop && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => {
            setIsSourceSidebarOpen(false);
            setIsPdfSidebarOpen(false);
          }}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r transition-all duration-300 ease-in-out z-40 h-full",
          "bg-background md:bg-muted/20", // Solid background on mobile
          "fixed md:relative md:translate-x-0",
          isSourceSidebarOpen
            ? "translate-x-0 w-4/5 md:w-[300px]"
            : "-translate-x-full w-4/5 md:w-16"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center border-b px-4 shrink-0">
          <h1
            className={cn(
              "text-xl font-bold",
              !isSourceSidebarOpen && "hidden"
            )}
          >
            Revizio
          </h1>
          {/* Desktop Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden md:flex"
            onClick={() => setIsSourceSidebarOpen(!isSourceSidebarOpen)}
          >
            <PanelLeftClose className="size-5" />
          </Button>
          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            onClick={() => setIsSourceSidebarOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Collapsed Desktop Sidebar Content */}
        {!isSourceSidebarOpen && isDesktop && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSourceSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        )}

        {/* Expanded Sidebar Content */}
        <div
          className={cn(
            "flex-grow p-4 flex-col gap-4 overflow-y-auto",
            isSourceSidebarOpen ? "flex" : "hidden"
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
          <div className="flex-grow overflow-hidden flex flex-col">
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

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between md:justify-end h-16 border-b md:border-none px-4">
          {/* Mobile Header Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSourceSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="text-xl font-bold md:hidden">Revizio</h1>

          {/* Universal PDF Toggle */}
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
          <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto shrink-0">
            <TabsTrigger value="chat">Chat with PDF</TabsTrigger>
            <TabsTrigger value="quiz">Generate Quiz</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-grow mt-4 overflow-y-auto">
            <ChatView
              key={activeConversationId || "new"}
              pdfId={selectedPdf?.id ?? null}
              conversationId={activeConversationId}
              setConversationId={setActiveConversationId}
            />
          </TabsContent>
          <TabsContent
            value="quiz"
            className="flex-grow mt-4 overflow-y-auto p-4"
          >
            <QuizView pdfId={selectedPdf?.id ?? null} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Right Sidebar (PDF Viewer) */}
      <div
        className={cn(
          "border-l overflow-y-auto transition-transform duration-300 ease-in-out z-40 h-full",
          "bg-background", // Always solid background
          "fixed right-0 md:relative md:translate-x-0",
          isPdfSidebarOpen ? "translate-x-0" : "translate-x-full",
          "w-4/5 md:w-1/2"
        )}
      >
        <div className="h-16 border-b flex items-center px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setIsPdfSidebarOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>
        <PdfViewer file={selectedPdf?.storage_path ?? null} />
      </div>
    </div>
  );
}
