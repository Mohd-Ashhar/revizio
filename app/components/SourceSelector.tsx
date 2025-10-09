// app/components/SourceSelector.tsx
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FileUpload from "./FileUpload";

export interface Pdf {
  id: string;
  file_name: string;
  storage_path: string;
}

interface SourceSelectorProps {
  onPdfSelect: (pdf: Pdf) => void;
}

export default function SourceSelector({ onPdfSelect }: SourceSelectorProps) {
  const supabase = createClient();
  const [pdfs, setPdfs] = useState<Pdf[]>([]);

  const fetchPdfs = useCallback(async () => {
    const { data } = await supabase
      .from("pdfs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPdfs(data);
  }, [supabase]);

  useEffect(() => {
    fetchPdfs();
  }, [fetchPdfs]);

  const handleSelect = (pdfId: string) => {
    const selected = pdfs.find((pdf) => pdf.id === pdfId);
    if (selected) {
      onPdfSelect(selected);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a coursebook" />
        </SelectTrigger>
        <SelectContent>
          {pdfs.map((pdf) => (
            <SelectItem key={pdf.id} value={pdf.id}>
              {pdf.file_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FileUpload onUploadSuccess={fetchPdfs} />
    </div>
  );
}
