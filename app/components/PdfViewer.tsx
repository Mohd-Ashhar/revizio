"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { createClient } from "@/lib/supabase/client";


import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

interface PdfViewerProps {
  file: string | null;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const supabase = createClient();

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-800">
        <p className="text-gray-500">Select a PDF to view</p>
      </div>
    );
  }

  const { data } = supabase.storage.from("pdfs").getPublicUrl(file);
  const publicURL = data?.publicUrl;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div>
      <Document file={publicURL} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages), (el, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            renderTextLayer={true} // Ensure text layer is rendered
            renderAnnotationLayer={true} // Ensure annotation layer is rendered
          />
        ))}
      </Document>
    </div>
  );
}
