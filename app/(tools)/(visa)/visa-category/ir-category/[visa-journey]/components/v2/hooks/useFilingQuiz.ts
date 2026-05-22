import { useState } from "react";

export interface FilingQuizResult {
  type: "online" | "paper" | "lean-online" | "discuss";
  headline: string;
  body: string;
  factors: { icon: string; text: string }[];
  emphasize: "online" | "paper" | null;
}

interface UseFilingQuizProps {
  currentStep: any;
  isCompleted: boolean;
  actions: {
    updateMetadata: (data: Record<string, unknown>) => void;
  };
  handleToggleComplete: () => void;
  metadata: any;
}

export const useFilingQuiz = ({
  currentStep,
  isCompleted,
  actions,
  handleToggleComplete,
  metadata,
}: UseFilingQuizProps) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScreenIdx, setQuizScreenIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, { value: string; signal: string }>>(
    {}
  );
  const [quizResult, setQuizResult] = useState<FilingQuizResult | null>(null);
  const [isLocked, setIsLocked] = useState(metadata.filingMethodConfirmed || false);

  const buildFactors = (a: Record<string, { value: string; signal: string }>) => {
    const f: { icon: string; text: string }[] = [];
    if (a["attorney"]) {
      const isSelf = a["attorney"].value === "no";
      f.push({
        icon: isSelf ? "Check" : "User",
        text: isSelf ? "Self-filing — the decision is yours" : "Representative involvement noted",
      });
    }
    if (a["online-account"]) {
      const m: Record<string, string> = {
        yes: "USCIS online account is manageable",
        no: "Online account not practical right now",
        unsure: "Online account readiness is unclear",
      };
      f.push({
        icon:
          a["online-account"].signal === "online"
            ? "Check"
            : a["online-account"].signal === "paper"
              ? "XCircle"
              : "HelpCircle",
        text: m[a["online-account"].value],
      });
    }
    if (a["doc-upload"]) {
      const m: Record<string, string> = {
        yes: "Documents are ready or easily scannable",
        no: "Physical copies only — digitizing is difficult now",
        unsure: "Document digitization readiness unclear",
      };
      f.push({
        icon:
          a["doc-upload"].signal === "online"
            ? "Check"
            : a["doc-upload"].signal === "paper"
              ? "XCircle"
              : "HelpCircle",
        text: m[a["doc-upload"].value],
      });
    }
    if (a["preference"]) {
      const m: Record<string, string> = {
        online: "Petitioner prefers online and the $50 saving",
        paper: "Petitioner prefers mailing a physical packet",
        neutral: "No strong preference either way",
      };
      f.push({
        icon: a["preference"].signal === "neutral" ? "ArrowRight" : "Check",
        text: m[a["preference"].value],
      });
    }
    return f;
  };

  const computeRecommendation = (answers: Record<string, { value: string; signal: string }>) => {
    const a = answers;
    if (a["attorney"]?.signal === "discuss")
      return {
        type: "discuss",
        headline: "Check with your representative",
        body: "Since a representative is managing the filing, the method choice is typically theirs. Ask whether they prefer online via their USCIS account or a mailed paper packet.",
        factors: [
          { icon: "User", text: "A representative is handling this case" },
          {
            icon: "ClipboardList",
            text: "Representatives can use either filing method",
          },
          {
            icon: "MessageSquare",
            text: "Confirm the method directly with your attorney or preparer",
          },
        ],
        emphasize: null,
      } as FilingQuizResult;

    const hardPaper = Object.values(a).some((ans) => ans.signal === "paper");
    if (hardPaper || a["preference"]?.signal === "paper")
      return {
        type: "paper",
        headline: "Paper filing looks like the better fit",
        body: "Based on your answers, mailing a paper packet is the more practical path right now. Paper filing is fully accepted and processed just as thoroughly as online submissions.",
        factors: buildFactors(a),
        emphasize: "paper",
      } as FilingQuizResult;

    const onlineCount = Object.values(a).filter((ans) => ans.signal === "online").length;

    if (onlineCount >= 2)
      return {
        type: "online",
        headline: "Online filing looks like the right choice",
        body: "You appear ready to file online. It saves $50, gives you an instant receipt number, and keeps everything — notices and evidence requests — in one place.",
        factors: buildFactors(a),
        emphasize: "online",
      } as FilingQuizResult;

    return {
      type: "lean-online",
      headline: "Either method works — online has a slight edge",
      body: "No hard blockers were found for either path. Online saves $50 and gives an instant receipt, but paper filing is equally valid if that feels more comfortable.",
      factors: buildFactors(a),
      emphasize: "online",
    } as FilingQuizResult;
  };

  const handleNextQuiz = () => {
    const quiz = currentStep.filing_data?.quiz;
    if (!quiz) return;
    const screen = quiz.screens[quizScreenIdx];

    if (screen.id === "attorney" && quizAnswers["attorney"]?.signal === "discuss") {
      setQuizResult(computeRecommendation(quizAnswers));
      return;
    }

    if (quizScreenIdx < quiz.screens.length - 1) {
      setQuizScreenIdx(quizScreenIdx + 1);
    } else {
      setQuizResult(computeRecommendation(quizAnswers));
    }
  };

  const handleConfirmation = (methodId: string) => {
    actions.updateMetadata({
      filingMethod: methodId,
      filingMethodConfirmed: true,
    });

    setIsLocked(true);
    if (!isCompleted) handleToggleComplete();
    setShowQuiz(false);
  };

  return {
    showQuiz,
    setShowQuiz,
    quizScreenIdx,
    setQuizScreenIdx,
    quizAnswers,
    setQuizAnswers,
    quizResult,
    setQuizResult,
    isLocked,
    setIsLocked,
    handleNextQuiz,
    handleConfirmation,
  };
};
