// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import QuizView from "./components/QuizView";
import SourceSelector, { Pdf } from "./components/SourceSelector"; // <-- Import Pdf type
import { createClient } from "@/lib/supabase/client";

const PdfViewer = dynamic(() => import("./components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <p>Loading PDF Viewer...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedPdf, setSelectedPdf] = useState<Pdf | null>(null); // <-- Use the Pdf type
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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full md:w-1/2 h-1/2 md:h-screen overflow-y-auto border-b md:border-r">
        {/* Pass the correct storage_path */}
        <PdfViewer file={selectedPdf?.storage_path ?? null} />
      </div>
      <div className="w-full md:w-1/2 p-6 h-1/2 md:h-screen overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Revizio</h1>
          <p className="text-gray-500">Your AI-powered study companion</p>
        </header>
        <SourceSelector onPdfSelect={setSelectedPdf} />
        <main className="mt-6">
          {/* Pass the correct database id */}
          <QuizView pdfId={selectedPdf?.id ?? null} />
        </main>
      </div>
    </div>
  );
}
