// app/dashboard/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server"; // We need a server client here
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// This is an async Server Component
export default async function DashboardPage() {
  const supabase = createClient();

  const { data: attempts, error } = await supabase
    .from("quiz_attempts")
    .select(
      `
      id,
      score,
      created_at,
      quizzes (
        pdfs (
          file_name
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching attempts:", error);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Progress Dashboard</h1>
        <Button asChild>
          <Link href="/">Back to Quiz</Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Your Quiz History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coursebook</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts && attempts.length > 0 ? (
                attempts.map((attempt: any) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">
                      {attempt.quizzes.pdfs.file_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      {attempt.score}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(attempt.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    You haven't taken any quizzes yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
