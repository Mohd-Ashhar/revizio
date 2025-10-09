// app/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ListChecks, Target, ArrowLeft } from "lucide-react";
import ProgressChart from "./ProgressChart";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: attempts, error }: any = await supabase
    .from("quiz_attempts")
    .select(
      `
      id,
      score,
      created_at,
      results,
      quizzes (
        quiz_content,
        pdfs (
          file_name
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching attempts:", error);
  }

  // --- CALCULATE STATS ---
  const totalQuizzes = attempts?.length || 0;
  let totalCorrect = 0;
  let totalMcqs = 0;

  attempts?.forEach((attempt: any) => {
    totalCorrect += attempt.score || 0;
    totalMcqs += attempt.quizzes?.quiz_content?.mcqs?.length || 0;
  });

  const averageScore =
    totalMcqs > 0 ? ((totalCorrect / totalMcqs) * 100).toFixed(2) : 0;

  // --- PREPARE DATA FOR THE CHART ---
  const chartData =
    attempts
      ?.map((attempt: any) => {
        const total = attempt.quizzes?.quiz_content?.mcqs?.length || 0;
        const percentage = total > 0 ? (attempt.score / total) * 100 : 0;
        return {
          date: new Date(attempt.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          Score: parseFloat(percentage.toFixed(2)),
        };
      })
      .reverse() || [];

  // --- ANALYZE STRENGTHS AND WEAKNESSES ---
  const topicStats: { [key: string]: { correct: number; total: number } } = {};
  attempts?.forEach((attempt: any) => {
    attempt.results?.forEach((result: any) => {
      if (result.topic) {
        if (!topicStats[result.topic]) {
          topicStats[result.topic] = { correct: 0, total: 0 };
        }
        topicStats[result.topic].total++;
        if (result.isCorrect) {
          topicStats[result.topic].correct++;
        }
      }
    });
  });

  const sortedTopics = Object.entries(topicStats)
    .filter(([, stats]) => stats.total > 0) // Ensure we don't divide by zero
    .sort(([, a], [, b]) => a.correct / a.total - b.correct / b.total);

  const weaknesses = sortedTopics.slice(0, 3);
  const strengths = sortedTopics.slice(-3).reverse();

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Progress Dashboard
          </h1>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to App
            </Link>
          </Button>
        </header>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Quizzes Taken
              </CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuizzes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Correct MCQs
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCorrect}</div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths and Weaknesses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Strengths & Weaknesses</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-green-600">
                Strengths (Top Topics)
              </h3>
              <div className="space-y-4">
                {strengths.map(([topic, stats]) => {
                  const percentage = (stats.correct / stats.total) * 100;
                  return (
                    <div key={topic}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{topic}</span>
                        <Badge variant="outline">
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-red-600">
                Areas for Improvement
              </h3>
              <div className="space-y-4">
                {weaknesses.map(([topic, stats]) => {
                  const percentage = (stats.correct / stats.total) * 100;
                  return (
                    <div key={topic}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{topic}</span>
                        <Badge variant="destructive">
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History and Chart */}
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Score Over Time (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressChart data={chartData} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Quiz History</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[350px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coursebook</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts && attempts.length > 0 ? (
                    attempts.slice(0, 10).map(
                      (
                        attempt: any // Show latest 10
                      ) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium truncate max-w-[150px]">
                            {attempt.quizzes?.pdfs?.file_name || "N/A"}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {new Date(attempt.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">
                        You haven't taken any quizzes yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
