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
import { CheckCircle2, ListChecks, Target } from "lucide-react";
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
  const totalScore =
    attempts?.reduce(
      (acc: number, attempt: any) => acc + (attempt.score || 0),
      0
    ) || 0;
  const totalQuestions =
    attempts?.reduce((acc: number, attempt: any) => {
      const mcqCount = attempt.quizzes?.quiz_content?.mcqs?.length || 0;
      return acc + mcqCount;
    }, 0) || 0;
  const averageScore =
    totalQuestions > 0 ? ((totalScore / totalQuestions) * 100).toFixed(2) : 0;

  // --- PREPARE DATA FOR THE CHART ---
  const chartData =
    attempts
      ?.map((attempt: any) => ({
        date: new Date(attempt.created_at).toLocaleDateString(),
        score: attempt.score,
      }))
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
  const sortedTopics = Object.entries(topicStats).sort(
    ([, a], [, b]) => a.correct / a.total - b.correct / b.total
  );
  const weaknesses = sortedTopics.slice(0, 3);
  const strengths = sortedTopics.slice(-3).reverse();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Progress Dashboard</h1>
        <Button asChild>
          <Link href="/">Back to Quiz</Link>
        </Button>
      </header>

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
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Correct MCQs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScore}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Strengths & Weaknesses</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2 text-green-600">
              Strengths (Top Topics)
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {strengths.map(([topic, stats]) => (
                <li key={topic}>
                  {topic} ({((stats.correct / stats.total) * 100).toFixed(0)}%)
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-red-600">
              Areas for Improvement
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {weaknesses.map(([topic, stats]) => (
                <li key={topic}>
                  {topic} ({((stats.correct / stats.total) * 100).toFixed(0)}%)
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={chartData} />
          </CardContent>
        </Card>
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
                        {attempt.quizzes?.pdfs?.file_name || "N/A"}
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
    </div>
  );
}
