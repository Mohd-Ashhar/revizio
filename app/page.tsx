// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import SourceSelector, { Pdf } from "./components/SourceSelector";
import QuizView from "./components/QuizView";
import ChatView from "./components/ChatView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const supabase = createClient();

  useEffect(() => {
    const signIn = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        await supabase.auth.signInAnonymously();
      }
    };
    signIn();
  }, [supabase]);

  const handleEmbed = async () => {
    if (!selectedPdf) return;
    setIsEmbedding(true);
    toast.info("Processing PDF...", {
      description: "This may take a moment. Please wait.",
    });

    const { error } = await supabase.functions.invoke("generate-embeddings", {
      body: JSON.stringify({ pdf_id: selectedPdf.id }),
    });

    if (error) {
      toast.error("Error", {
        description: "Failed to process the PDF for chat.",
      });
    } else {
      toast.success("Success!", {
        description: `"${selectedPdf.file_name}" is now ready for chat.`,
      });
    }
    setIsEmbedding(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <div className="w-full md:w-1/2 h-1/2 md:h-screen overflow-y-auto border-b md:border-r">
        <PdfViewer file={selectedPdf?.storage_path ?? null} />
      </div>

      <div className="w-full md:w-1/2 p-4 flex flex-col h-1/2 md:h-screen">
        <header className="flex justify-between items-center pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold">Revizio</h1>
            <p className="text-sm text-muted-foreground">
              Your AI-powered study companion
            </p>
          </div>
          <Link href="/dashboard" passHref>
            <Button variant="outline">View Progress</Button>
          </Link>
        </header>

        <div className="flex items-center gap-2 py-4">
          <SourceSelector onPdfSelect={setSelectedPdf} />
          <Button
            onClick={handleEmbed}
            disabled={!selectedPdf || isEmbedding}
            variant="secondary"
          >
            {isEmbedding ? "Processing..." : "Process PDF for Chat"}
          </Button>
        </div>

        <Tabs defaultValue="chat" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat with PDF</TabsTrigger>
            <TabsTrigger value="quiz">Generate Quiz</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-grow mt-4">
            <ChatView pdfId={selectedPdf?.id ?? null} />
          </TabsContent>
          <TabsContent value="quiz" className="flex-grow mt-4">
            <QuizView pdfId={selectedPdf?.id ?? null} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
