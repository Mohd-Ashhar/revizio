// app/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils"; // <-- This is the missing import
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

// Define a more specific type for the data we expect from Supabase
interface Attempt {
  id: string;
  score: number;
  created_at: string;
  results: { topic: string; isCorrect: boolean }[];
  quizzes: {
    quiz_content: {
      mcqs: unknown[];
    };
    pdfs: {
      file_name: string;
    };
  } | null;
}

export default async function DashboardPage() {
  const supabase = createClient();

  // Fetch the data
  const { data: attempts, error } = await supabase
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

  // Use a double assertion to safely cast the data
  const typedAttempts: Attempt[] = (attempts as unknown as Attempt[]) || [];

  // --- CALCULATE STATS ---
  const totalQuizzes = typedAttempts.length;
  let totalCorrect = 0;
  let totalMcqs = 0;

  typedAttempts.forEach((attempt) => {
    totalCorrect += attempt.score || 0;
    totalMcqs += attempt.quizzes?.quiz_content?.mcqs?.length || 0;
  });

  const averageScore =
    totalMcqs > 0 ? ((totalCorrect / totalMcqs) * 100).toFixed(2) : "0";

  // --- PREPARE DATA FOR THE CHART ---
  const dailyScores: {
    [date: string]: { totalPercent: number; count: number };
  } = {};

  typedAttempts.forEach((attempt) => {
    const total = attempt.quizzes?.quiz_content?.mcqs?.length || 0;
    const percentage = total > 0 ? (attempt.score / total) * 100 : 0;
    const date = new Date(attempt.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dailyScores[date]) {
      dailyScores[date] = { totalPercent: 0, count: 0 };
    }
    dailyScores[date].totalPercent += percentage;
    dailyScores[date].count++;
  });

  const chartData = Object.entries(dailyScores)
    .map(([date, { totalPercent, count }]) => ({
      date,
      "Daily Average": parseFloat((totalPercent / count).toFixed(2)),
    }))
    .reverse();

  // --- ANALYZE STRENGTHS AND WEAKNESSES ---
  const topicStats: { [key: string]: { correct: number; total: number } } = {};
  typedAttempts.forEach((attempt) => {
    attempt.results?.forEach((result) => {
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
    .filter(([, stats]) => stats.total > 0)
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
            <CardContent className="max-h-[350px] overflow-y-auto p-0">
              <div className="space-y-4 p-6">
                {typedAttempts.length > 0 ? (
                  typedAttempts.slice(0, 10).map((attempt) => {
                    const totalQuestions =
                      attempt.quizzes?.quiz_content?.mcqs?.length || 0;
                    const percentage =
                      totalQuestions > 0
                        ? (attempt.score / totalQuestions) * 100
                        : 0;

                    return (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full shrink-0",
                              percentage >= 75
                                ? "bg-green-500"
                                : percentage >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            )}
                          />
                          <div className="truncate">
                            <p className="font-medium truncate">
                              {attempt.quizzes?.pdfs?.file_name || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                attempt.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="font-semibold text-right">
                          {attempt.score}/{totalQuestions}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
                    <p>You haven&apos;t taken any quizzes yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
