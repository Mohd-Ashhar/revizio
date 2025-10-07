import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FileUpload from "./FileUpload";

interface Pdf {
  id: string;
  file_name: string;
  storage_path: string;
}

interface SourceSelectorProps {
  onPdfSelect: (storagePath: string) => void;
}

export default function SourceSelector({ onPdfSelect }: SourceSelectorProps) {
  const supabase = createClient();
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function fetchPdfs() {
      const { data, error } = await supabase.from("pdfs").select("*");
      if (data) setPdfs(data);
    }
    fetchPdfs();
  }, [supabase]);

  const handleSelect = (pdfId: string) => {
    const selected = pdfs.find((pdf) => pdf.id === pdfId);
    if (selected) {
      onPdfSelect(selected.storage_path);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="w-[280px]">
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
      <FileUpload
        onUploadSuccess={() => {
          /* Optionally refresh PDF list */
        }}
      />
    </div>
  );
}
