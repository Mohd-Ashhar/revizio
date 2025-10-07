// app/page.tsx

"use client";

import { useState } from "react";
import dynamic from "next/dynamic"; 
import QuizView from "./components/QuizView";
import SourceSelector from "./components/SourceSelector";

const PdfViewer = dynamic(() => import("./components/PdfViewer"), {
  ssr: false, // disable server-side rendering
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-800">
      <p className="text-gray-500">Loading PDF Viewer...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  // The rest of your component remains the same...
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Left Panel: PDF Viewer */}
      <div className="w-1/2 h-screen overflow-y-auto">
        <PdfViewer file={selectedPdf} />
      </div>

      {/* Right Panel: Interactive Area */}
      <div className="w-1/2 p-6 h-screen overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Revizio
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Your AI-powered study companion
          </p>
        </header>

        <SourceSelector onPdfSelect={setSelectedPdf} />

        <main className="mt-6">
          {/* We'll pass the selected PDF ID to the quiz view */}
          <QuizView pdfId={selectedPdf ? selectedPdf.split("/")[1] : null} />
        </main>
      </div>
    </div>
  );
}
