"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, FlagTriangleRight, Sparkles } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { submitInterviewAnswerAction, finishInterviewSessionAction, type InterviewSessionDetail } from "@/app/dashboard/interview-prep/actions";
import type { InterviewAnswerRow } from "@/types/database";

type Feedback = {
  relevance: string;
  clarity: string;
  structure: string;
  specificity: string;
  confidence: string;
  missingDetail: string;
  score: number;
  summary: string;
};

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

const FEEDBACK_ROWS: { key: keyof Feedback; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "clarity", label: "Clarity" },
  { key: "structure", label: "Structure" },
  { key: "specificity", label: "Specificity" },
  { key: "confidence", label: "Confidence" },
  { key: "missingDetail", label: "What's missing" },
];

interface InterviewSessionViewProps {
  detail: InterviewSessionDetail;
}

export function InterviewSessionView({ detail: initialDetail }: InterviewSessionViewProps) {
  const router = useRouter();
  const [questions, setQuestions] = React.useState(initialDetail.questions);
  const [index, setIndex] = React.useState(() => {
    const firstUnanswered = initialDetail.questions.findIndex((q) => !q.answer);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });

  const question = questions[index];
  const answeredCount = questions.filter((q) => q.answer).length;

  // Reset the answer draft whenever the shown question changes — adjusted
  // during render (React's documented pattern for "state derived from a prop
  // that changed"), not in an effect, so switching questions never flashes
  // the previous question's draft first.
  const [draft, setDraft] = React.useState(question?.answer?.answer_text ?? "");
  const [draftQuestionId, setDraftQuestionId] = React.useState(question?.id);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFinishing, setIsFinishing] = React.useState(false);

  if (question && question.id !== draftQuestionId) {
    setDraftQuestionId(question.id);
    setDraft(question.answer?.answer_text ?? "");
  }

  if (!question) return null;

  const feedback = question.answer?.feedback as Feedback | null;

  async function handleSubmit() {
    if (!draft.trim()) return;
    setIsSubmitting(true);
    const result = await submitInterviewAnswerAction({ questionId: question.id, answerText: draft });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? { ...q, answer: result.data as InterviewAnswerRow } : q)),
    );
    toast.success("Answer scored");
  }

  async function handleFinish() {
    setIsFinishing(true);
    const result = await finishInterviewSessionAction(initialDetail.session.id);
    setIsFinishing(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Interview session completed");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                i === index ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                q.answer && i !== index && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {q.answer ? <CheckCircle2 className="size-3.5" /> : i + 1}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground shrink-0 text-xs">
          {answeredCount}/{questions.length} answered
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {question.category}
            </Badge>
            <CardDescription>Question {question.question_number}</CardDescription>
          </div>
          <CardTitle className="text-lg leading-snug font-medium text-pretty">{question.question_text}</CardTitle>
          {Array.isArray(question.grounded_in) && question.grounded_in.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(question.grounded_in as string[]).map((g) => (
                <Badge key={g} variant="secondary">
                  {g}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Type your answer here…"
            className="min-h-40"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={isSubmitting}
            maxLength={6000}
          />
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index === questions.length - 1}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !draft.trim()}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {isSubmitting ? "Scoring…" : question.answer ? "Re-submit answer" : "Submit answer"}
          </Button>
        </CardFooter>
      </Card>

      {feedback && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Feedback</CardTitle>
              <span className={cn("text-2xl font-semibold tabular-nums", scoreTone(feedback.score))}>{feedback.score}/100</span>
            </div>
            <CardDescription>{feedback.summary}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {FEEDBACK_ROWS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <p className="text-xs font-medium">{label}</p>
                <p className="text-muted-foreground text-sm text-pretty">{feedback[key] as string}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={handleFinish} disabled={isFinishing || answeredCount === 0}>
          {isFinishing ? <Loader2 className="size-4 animate-spin" /> : <FlagTriangleRight className="size-4" />}
          {isFinishing ? "Finishing…" : "Finish interview & get final score"}
        </Button>
      </div>
    </div>
  );
}
