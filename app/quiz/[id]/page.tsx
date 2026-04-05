import { QuizEngine } from "@/components/quiz/QuizEngine";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return <QuizEngine quizId={id} />;
}
