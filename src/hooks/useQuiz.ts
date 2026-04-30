import { useState, useEffect, useRef, useCallback } from 'react';
import { QUESTIONS, QUIZ_CONFIG } from '../data/mockData';

export function useQuiz(
  subjectId: string,
  forcedQuestions: any[] | null = null
) {
  const loadQuestions = useCallback(() => {
    if (forcedQuestions) return forcedQuestions;
    const pool = QUESTIONS[subjectId] || [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, QUIZ_CONFIG.questionsPerQuiz);
  }, [subjectId, forcedQuestions]);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUIZ_CONFIG.timerPerQuestion);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);
  const [finalResults, setFinalResults] = useState<any>(null); // ← stocke les résultats finaux

  const timerRef = useRef<any>(null);
  const answersRef = useRef<any[]>([]); // ← référence sync pour les réponses
  const questionsRef = useRef<any[]>([]); // ← référence sync pour les questions

  useEffect(() => {
    const qs = loadQuestions();
    setQuestions(qs);
    questionsRef.current = qs;
    const emptyAnswers = new Array(qs.length).fill(null);
    setAnswers(emptyAnswers);
    answersRef.current = emptyAnswers;
    resetTimer();
  }, [subjectId]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (QUIZ_CONFIG.timerPerQuestion === 0) return;
    setTimeLeft(QUIZ_CONFIG.timerPerQuestion);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const answer = useCallback(
    (optionIndex: number) => {
      if (isAnswered) return;
      stopTimer();
      setIsAnswered(true);
      const question = questionsRef.current[currentIndex];
      const isCorrect = optionIndex === question.correct;
      const newAnswer = { chosenIndex: optionIndex, isCorrect, skipped: false };

      setAnswers((prev) => {
        const updated = [...prev];
        updated[currentIndex] = newAnswer;
        answersRef.current = updated; // ← sync la référence
        return updated;
      });
    },
    [isAnswered, currentIndex, stopTimer]
  );

  const skip = useCallback(() => {
    if (isAnswered) return;
    stopTimer();
    setIsAnswered(true);
    setSkippedCount((prev) => prev + 1);
    const newAnswer = { chosenIndex: null, isCorrect: false, skipped: true };

    setAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = newAnswer;
      answersRef.current = updated;
      return updated;
    });
  }, [isAnswered, currentIndex, stopTimer]);

  const handleTimeout = useCallback(() => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSkippedCount((prev) => prev + 1);
    const newAnswer = {
      chosenIndex: null,
      isCorrect: false,
      skipped: true,
      timedOut: true,
    };

    setAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = newAnswer;
      answersRef.current = updated;
      return updated;
    });
  }, [isAnswered, currentIndex]);

  const next = useCallback(() => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questionsRef.current.length) {
      // ── Calcule les résultats DIRECTEMENT depuis les refs (valeurs sync) ──
      const computed = computeResults(questionsRef.current, answersRef.current);
      setFinalResults(computed);
      setIsFinished(true);
      return;
    }

    setCurrentIndex(nextIndex);
    setIsAnswered(false);
    resetTimer();
  }, [currentIndex, resetTimer]);

  return {
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex] || null,
    answers,
    timeLeft,
    isAnswered,
    isFinished,
    skippedCount,
    results: finalResults, // ← utilise les résultats stockés
    totalQuestions: questions.length,
    progress:
      questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0,
    answer,
    skip,
    next,
  };
}

function computeResults(questions: any[], answers: any[]) {
  let correct = 0,
    wrong = 0,
    skipped = 0;

  const details = questions.map((q, i) => {
    const ans = answers[i];
    if (!ans) return { question: q, status: 'skipped', chosenIndex: null };
    if (ans.skipped) {
      skipped++;
      return {
        question: q,
        status: 'skipped',
        chosenIndex: null,
        timedOut: ans.timedOut,
      };
    }
    if (ans.isCorrect) {
      correct++;
      return { question: q, status: 'correct', chosenIndex: ans.chosenIndex };
    }
    wrong++;
    return { question: q, status: 'wrong', chosenIndex: ans.chosenIndex };
  });

  const scoreOn20 = Math.round((correct / questions.length) * 20 * 10) / 10;
  let appreciation = 'À retravailler';
  if (scoreOn20 >= 18) appreciation = 'Excellent !';
  else if (scoreOn20 >= 14) appreciation = 'Très bien';
  else if (scoreOn20 >= 10) appreciation = 'Bien';

  return { correct, wrong, skipped, scoreOn20, appreciation, details };
}
