import { QuizEngine } from "@/components/quiz/QuizEngine";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  
  return <QuizEngine quizId={id} mode={mode as "preview" | undefined} />;
}
