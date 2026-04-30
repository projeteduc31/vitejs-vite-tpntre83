import React, { useEffect } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { ProgressBar } from '../components/UI';
import { QUIZ_CONFIG } from '../data/mockData';

export default function QuizPage({
  subjectId,
  subjectName,
  onFinish,
  onBack,
  forcedQuestions,
}: {
  subjectId: string;
  subjectName: string;
  onFinish: (r: any, q: any) => void;
  onBack: () => void;
  forcedQuestions: any[] | null;
}) {
  const quiz = useQuiz(subjectId, forcedQuestions);

  useEffect(() => {
    if (quiz.isFinished && quiz.results) onFinish(quiz.results, quiz.questions);
  }, [quiz.isFinished]);

  if (!quiz.currentQuestion) return null;

  const { timeLeft, isAnswered, currentIndex, totalQuestions, skippedCount } =
    quiz;

  return (
    <div className="page-container" style={{ paddingBottom: 20 }}>
      <div className="bg-glow" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* En-tête */}
        <div
          style={{
            padding: '24px 20px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={onBack}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--muted)',
            }}
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: 14 }} />
          </button>
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--muted)',
            }}
          >
            Question{' '}
            <span style={{ color: 'var(--text)' }}>{currentIndex + 1}</span>/
            {totalQuestions}
          </div>
          <TimerCircle
            timeLeft={timeLeft}
            maxTime={QUIZ_CONFIG.timerPerQuestion}
          />
        </div>

        {/* Progress */}
        <div style={{ padding: '14px 20px 0' }}>
          <ProgressBar percent={(currentIndex / totalQuestions) * 100} />
        </div>

        {/* Questions passées */}
        {skippedCount > 0 && (
          <div
            style={{
              margin: '10px 20px 0',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 10,
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--amber)',
            }}
          >
            <i className="fa-solid fa-forward" style={{ fontSize: 11 }} />
            {skippedCount} question{skippedCount > 1 ? 's' : ''} passée
            {skippedCount > 1 ? 's' : ''} — comptée{skippedCount > 1 ? 's' : ''}{' '}
            comme mauvaise réponse
          </div>
        )}

        {/* Question */}
        <div style={{ padding: '16px 20px 0' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 22,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(79,142,247,0.1)',
                border: '1px solid rgba(79,142,247,0.2)',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 11,
                color: 'var(--accent)',
                marginBottom: 12,
              }}
            >
              <i className="fa-solid fa-diagram-project" /> {subjectName}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 600,
                fontSize: 16,
                lineHeight: 1.5,
              }}
            >
              {quiz.currentQuestion.text}
            </div>
          </div>
        </div>

        {/* Options */}
        <div style={{ padding: '14px 20px 0' }}>
          {quiz.currentQuestion.options.map((option: string, index: number) => (
            <OptionButton
              key={index}
              index={index}
              text={option}
              isAnswered={isAnswered}
              answer={quiz.answers[currentIndex]}
              correctIndex={quiz.currentQuestion.correct}
              onClick={() => quiz.answer(index)}
            />
          ))}
        </div>

        {/* Explication */}
        {isAnswered && (
          <ExplanationBox
            answer={quiz.answers[currentIndex]}
            explanation={quiz.currentQuestion.explanation}
          />
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 20px 0' }}>
          {!isAnswered && (
            <button
              onClick={quiz.skip}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--muted)',
                fontFamily: 'var(--font-title)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <i className="fa-solid fa-forward-step" /> Passer
            </button>
          )}
          {isAnswered && (
            <button
              onClick={quiz.next}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                color: '#fff',
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <i
                className={
                  currentIndex >= totalQuestions - 1
                    ? 'fa-solid fa-flag-checkered'
                    : 'fa-solid fa-arrow-right'
                }
              />
              {currentIndex >= totalQuestions - 1
                ? 'Voir mes résultats'
                : 'Question suivante'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TimerCircle({
  timeLeft,
  maxTime,
}: {
  timeLeft: number;
  maxTime: number;
}) {
  const R = 18;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - timeLeft / maxTime);
  const color =
    timeLeft <= 8 ? '#EF4444' : timeLeft <= 15 ? '#F59E0B' : '#4F8EF7';
  return (
    <div style={{ position: 'relative', width: 44, height: 44 }}>
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'rotate(-90deg)',
        }}
      >
        <circle
          cx="22"
          cy="22"
          r={R}
          fill="none"
          stroke="var(--surface2)"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-title)',
          fontWeight: 700,
          fontSize: 13,
          color,
          transition: 'color 0.3s',
        }}
      >
        {timeLeft}
      </div>
    </div>
  );
}

function OptionButton({
  index,
  text,
  isAnswered,
  answer,
  correctIndex,
  onClick,
}: any) {
  const letters = ['A', 'B', 'C', 'D'];
  let state = 'default';
  if (isAnswered) {
    if (index === correctIndex) state = 'correct';
    else if (answer && answer.chosenIndex === index) state = 'wrong';
    else state = 'neutral';
  }
  const styles: Record<string, any> = {
    correct: {
      border: 'rgba(16,185,129,0.4)',
      bg: 'rgba(16,185,129,0.08)',
      lBg: 'rgba(16,185,129,0.2)',
      lColor: 'var(--green)',
      tColor: 'var(--green)',
    },
    wrong: {
      border: 'rgba(239,68,68,0.4)',
      bg: 'rgba(239,68,68,0.08)',
      lBg: 'rgba(239,68,68,0.2)',
      lColor: 'var(--red)',
      tColor: 'var(--red)',
    },
    neutral: {
      border: 'var(--border)',
      bg: 'var(--surface)',
      lBg: 'var(--surface2)',
      lColor: 'var(--muted)',
      tColor: 'var(--muted)',
      opacity: 0.38,
    },
    default: {
      border: 'var(--border)',
      bg: 'var(--surface)',
      lBg: 'var(--surface2)',
      lColor: 'var(--muted)',
      tColor: 'var(--text)',
    },
  };
  const s = styles[state];
  return (
    <div
      onClick={!isAnswered ? onClick : undefined}
      style={{
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        marginBottom: 10,
        cursor: isAnswered ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: s.opacity || 1,
        transition: 'all 0.2s',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: s.lBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-title)',
          fontWeight: 700,
          fontSize: 12,
          color: s.lColor,
          flexShrink: 0,
        }}
      >
        {state === 'correct' ? (
          <i className="fa-solid fa-check" style={{ fontSize: 11 }} />
        ) : state === 'wrong' ? (
          <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
        ) : (
          letters[index]
        )}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.4, color: s.tColor }}>
        {text}
      </div>
    </div>
  );
}

function ExplanationBox({ answer, explanation }: any) {
  if (!answer) return null;
  const isSkipped = answer.skipped;
  const isCorrect = answer.isCorrect && !isSkipped;
  const config = {
    bg: isSkipped
      ? 'rgba(245,158,11,0.06)'
      : isCorrect
      ? 'rgba(16,185,129,0.06)'
      : 'rgba(239,68,68,0.06)',
    border: isSkipped
      ? 'rgba(245,158,11,0.2)'
      : isCorrect
      ? 'rgba(16,185,129,0.2)'
      : 'rgba(239,68,68,0.2)',
    iconBg: isSkipped
      ? 'rgba(245,158,11,0.2)'
      : isCorrect
      ? 'rgba(16,185,129,0.2)'
      : 'rgba(239,68,68,0.2)',
    icon: isSkipped ? 'fa-clock' : isCorrect ? 'fa-check' : 'fa-xmark',
    color: isSkipped
      ? 'var(--amber)'
      : isCorrect
      ? 'var(--green)'
      : 'var(--red)',
    label: isSkipped
      ? answer.timedOut
        ? 'Temps écoulé'
        : 'Question passée'
      : isCorrect
      ? 'Bonne réponse !'
      : 'Mauvaise réponse',
  };
  return (
    <div
      style={{
        margin: '0 20px',
        padding: 14,
        borderRadius: 'var(--radius)',
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: config.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            color: config.color,
          }}
        >
          <i className={`fa-solid ${config.icon}`} />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: 13,
            color: config.color,
          }}
        >
          {config.label}
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        {explanation}
      </div>
    </div>
  );
}
