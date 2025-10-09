import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface QuizViewProps {
  pdfId: string | null;
}

interface MCQ {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic?: string; // Added topic
}
interface SAQ {
  question: string;
  answer: string;
  explanation: string;
  topic?: string; // Added topic
}
interface LAQ {
  question: string;
  answer: string;
  explanation: string;
  topic?: string; // Added topic
}
interface QuizContent {
  mcqs: MCQ[];
  saqs: SAQ[];
  laqs: LAQ[];
}

export default function QuizView({ pdfId }: QuizViewProps) {
  const supabase = createClient();
  const [quizContent, setQuizContent] = useState<QuizContent | null>(null);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const generateQuiz = async () => {
    if (!pdfId) return;
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: JSON.stringify({ pdf_id: pdfId }),
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        console.error("Quiz generation error:", error);
      } else {
        setQuizContent(data.quiz.quiz_content);
        setQuizId(data.quiz.id);
        setUserAnswers({});
        setShowResults(false);
        setScore(null);
      }
    }
    setIsLoading(false);
  };

  const handleAnswerChange = (questionIndex: string, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmit = async () => {
    if (!quizContent || !quizId) return;

    let calculatedScore = 0;
    const attemptResults = quizContent.mcqs.map((mcq, index) => {
      const isCorrect = userAnswers[`mcq-${index}`] === mcq.answer;
      if (isCorrect) {
        calculatedScore++;
      }
      return {
        question: mcq.question,
        topic: mcq.topic || "General",
        isCorrect: isCorrect,
      };
    });

    setScore(calculatedScore);
    setShowResults(true);

    const { error } = await supabase.from("quiz_attempts").insert({
      quiz_id: quizId,
      score: calculatedScore,
      results: attemptResults,
    });

    if (error) {
      console.error("Error saving quiz attempt:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Time!</CardTitle>
        <Button onClick={generateQuiz} disabled={!pdfId || isLoading}>
          {isLoading ? "Generating..." : "Generate New Quiz"}
        </Button>
      </CardHeader>
      <CardContent>
        {quizContent ? (
          <div className="space-y-8">
            {!showResults ? (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Multiple Choice Questions
                  </h3>
                  {quizContent.mcqs.map((mcq, index) => (
                    <div key={`mcq-${index}`} className="mb-6">
                      <p className="mb-2 font-medium">
                        {index + 1}. {mcq.question}
                      </p>
                      <RadioGroup
                        onValueChange={(value) =>
                          handleAnswerChange(`mcq-${index}`, value)
                        }
                      >
                        {mcq.options.map((option, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={option}
                              id={`mcq-${index}-option-${i}`}
                            />
                            <Label htmlFor={`mcq-${index}-option-${i}`}>
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Short Answer Questions
                  </h3>
                  {quizContent.saqs.map((saq, index) => (
                    <div key={`saq-${index}`} className="mb-6">
                      <Label
                        htmlFor={`saq-${index}`}
                        className="font-medium mb-2 block"
                      >
                        {quizContent.mcqs.length + index + 1}. {saq.question}
                      </Label>
                      <Input
                        id={`saq-${index}`}
                        value={userAnswers[`saq-${index}`] || ""}
                        onChange={(e) =>
                          handleAnswerChange(`saq-${index}`, e.target.value)
                        }
                        placeholder="Your answer..."
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Long Answer Questions
                  </h3>
                  {quizContent.laqs.map((laq, index) => (
                    <div key={`laq-${index}`} className="mb-6">
                      <Label
                        htmlFor={`laq-${index}`}
                        className="font-medium mb-2 block"
                      >
                        {quizContent.mcqs.length +
                          quizContent.saqs.length +
                          index +
                          1}
                        . {laq.question}
                      </Label>
                      <Textarea
                        id={`laq-${index}`}
                        value={userAnswers[`laq-${index}`] || ""}
                        onChange={(e) =>
                          handleAnswerChange(`laq-${index}`, e.target.value)
                        }
                        placeholder="Your detailed answer..."
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSubmit}>Submit Quiz</Button>
              </>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
                <p className="text-xl mb-6">
                  Your Score: {score} / {quizContent.mcqs.length}
                </p>
                {quizContent.mcqs.map((mcq, index) => {
                  const userAnswer = userAnswers[`mcq-${index}`];
                  const isCorrect = userAnswer === mcq.answer;
                  return (
                    <div
                      key={`result-${index}`}
                      className="mb-6 p-4 rounded-md border bg-gray-50 dark:bg-gray-800"
                    >
                      <p className="font-medium mb-2">{mcq.question}</p>
                      <p
                        className={
                          isCorrect ? "text-green-600" : "text-red-600"
                        }
                      >
                        Your answer: {userAnswer || "No answer"}
                      </p>
                      {!isCorrect && (
                        <p className="text-blue-600">
                          Correct answer: {mcq.answer}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <span className="font-semibold">Explanation:</span>{" "}
                        {mcq.explanation}
                      </p>
                    </div>
                  );
                })}
                {quizContent.saqs.map((saq, index) => (
                  <div
                    key={`saq-result-${index}`}
                    className="mb-6 p-4 rounded-md border bg-gray-50 dark:bg-gray-800"
                  >
                    <p className="font-medium mb-2">{saq.question}</p>
                    <p>
                      Your answer: {userAnswers[`saq-${index}`] || "No answer"}
                    </p>
                    <p className="text-blue-600 mt-1">
                      Suggested answer: {saq.answer}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span className="font-semibold">Explanation:</span>{" "}
                      {saq.explanation}
                    </p>
                  </div>
                ))}
                {quizContent.laqs.map((laq, index) => (
                  <div
                    key={`laq-result-${index}`}
                    className="mb-6 p-4 rounded-md border bg-gray-50 dark:bg-gray-800"
                  >
                    <p className="font-medium mb-2">{laq.question}</p>
                    <p>
                      Your answer: {userAnswers[`laq-${index}`] || "No answer"}
                    </p>
                    <p className="text-blue-600 mt-1">
                      Suggested answer: {laq.answer}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span className="font-semibold">Explanation:</span>{" "}
                      {laq.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p>
            Select a coursebook and click &quot;Generate Quiz&quot; to get
            started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
