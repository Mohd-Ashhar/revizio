import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface QuizViewProps {
  pdfId: string | null;
}

// Define types for your quiz structure
interface MCQ {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}
// Define SAQ and LAQ types similarly...

export default function QuizView({ pdfId }: QuizViewProps) {
  const supabase = createClient();
  const [quiz, setQuiz] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateQuiz = async () => {
    if (!pdfId) return;
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: JSON.stringify({ pdf_id: pdfId }),
         headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
      });
      if (error) {
        console.error("Quiz generation error:", error);
      } else {
        setQuiz(data.quiz.quiz_content);
      }
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Time!</CardTitle>
        <Button onClick={generateQuiz} disabled={!pdfId || isLoading}>
          {isLoading ? 'Generating...' : 'Generate Quiz'}
        </Button>
      </CardHeader>
      <CardContent>
        {quiz ? (
          <div className="space-y-6">
            {/* Render MCQs */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Multiple Choice Questions</h3>
              {quiz.mcqs.map((mcq: MCQ, index: number) => (
                <div key={index} className="mb-4">
                  <p className="mb-2">{mcq.question}</p>
                  <RadioGroup>
                    {mcq.options.map((option, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`mcq-${index}-option-${i}`} />
                        <Label htmlFor={`mcq-${index}-option-${i}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>

            {/* Render SAQs and LAQs similarly */}

            <Button>Submit Quiz</Button>
          </div>
        ) : (
          <p>Click "Generate Quiz" to get started.</p>
        )}
      </CardContent>
    </Card>
  );
}