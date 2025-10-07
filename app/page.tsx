// app/page.tsx
"use client"; // This directive is important for using hooks

import { useState } from "react";
import PdfViewer from "./components/PdfViewer";
import QuizView from "./components/QuizView";
import SourceSelector from "./components/SourceSelector";

export default function Home() {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

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
          <QuizView pdfId={selectedPdf} />
        </main>
      </div>
    </div>
  );
}
