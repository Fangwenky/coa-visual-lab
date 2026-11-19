import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu } from 'lucide-react';
import type { ModuleMeta, QuizQuestion } from '../types/course';

export function ModuleHeader({ meta }: { meta: ModuleMeta }) {
  return (
    <header className="mod-header">
      <div className="mod-header-meta">
        <span className="mod-header-chip">{meta.code}</span>
        <span className="mod-header-chip">课件：{meta.sourceFile}</span>
        <span className="mod-header-chip">共 {meta.slideCount} 页</span>
        <span className="mod-header-chip">{meta.labCount} 个交互实验台</span>
      </div>
      <h1>{meta.title}</h1>
      <p>{meta.summary}</p>
    </header>
  );
}

export function ConceptSection({
  id,
  title,
  slideRef,
  children,
}: {
  id: string;
  title: string;
  slideRef?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="concept-section">
      <div className="section-heading-row">
        <h2 className="section-heading">{title}</h2>
        {slideRef && <span className="section-slide-ref">{slideRef}</span>}
      </div>
      {children}
    </section>
  );
}

export function FormulaBox({
  label,
  formula,
  note,
}: {
  label: string;
  formula: string;
  note?: string;
}) {
  return (
    <div className="formula-box">
      <div className="formula-label">{label}</div>
      <div className="formula-expr">{formula}</div>
      {note && <div className="formula-note">{note}</div>}
    </div>
  );
}

export function ExamTip({
  title = '考点与易错提示',
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="exam-tip">
      <div className="exam-tip-title">
        <AlertTriangle size={15} />
        <span>{title}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function WorkedExample({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="example-box">
      <div className="example-title">{title}</div>
      <div>{children}</div>
    </div>
  );
}

export function DatasheetTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="datasheet-wrap">
      <table className="datasheet-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LabFrame({
  id,
  code,
  title,
  desc,
  children,
}: {
  id: string;
  code: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="lab-frame">
      <div className="lab-header">
        <div className="lab-title-group">
          <span className="lab-badge">{code} · 交互硬件实验台</span>
          <h3 className="lab-title">{title}</h3>
          <p className="lab-desc">{desc}</p>
        </div>
        <Cpu size={20} color="#4ea1ff" />
      </div>
      <div className="lab-body">{children}</div>
    </div>
  );
}

export function QuizBlock({
  title = '本模块高频考点自测',
  questions,
}: {
  title?: string;
  questions: QuizQuestion[];
}) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const answeredCount = Object.keys(selected).length;
  const correctCount = questions.filter((q) => selected[q.id] === q.answerIndex).length;

  return (
    <div className="quiz-card">
      <div className="section-heading-row" style={{ marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
        <span className="mono" style={{ fontSize: 12.5, color: 'var(--emerald)' }}>
          {answeredCount > 0 ? `已答 ${answeredCount}/${questions.length} · 正确 ${correctCount}` : `共 ${questions.length} 题`}
        </span>
      </div>
      {questions.map((q, idx) => {
        const pick = selected[q.id];
        const isAnswered = pick !== undefined;
        return (
          <div key={q.id} className="quiz-q-item">
            <div className="quiz-q-text">
              {idx + 1}. {q.question}
            </div>
            <div className="quiz-options">
              {q.options.map((opt, oi) => {
                let cls = 'quiz-opt';
                if (isAnswered) {
                  if (oi === q.answerIndex) cls += ' correct';
                  else if (oi === pick) cls += ' wrong';
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    className={cls}
                    onClick={() => setSelected((prev) => ({ ...prev, [q.id]: oi }))}
                  >
                    <span className="mono" style={{ marginRight: 6 }}>
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {isAnswered && (
              <div className="quiz-explain">
                <strong style={{ color: pick === q.answerIndex ? 'var(--emerald)' : 'var(--crimson)' }}>
                  {pick === q.answerIndex ? '回答正确：' : '解析：'}
                </strong>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ModuleFooterNav({
  moduleId,
  isDone,
  onToggleDone,
  prev,
  next,
  onNavigate,
}: {
  moduleId: string;
  isDone: boolean;
  onToggleDone: (id: string) => void;
  prev?: { id: string; label: string };
  next?: { id: string; label: string };
  onNavigate: (id: any) => void;
}) {
  return (
    <div className="module-footer-nav">
      <div>
        {prev && (
          <button type="button" className="action-btn" onClick={() => onNavigate(prev.id)}>
            上一模块：{prev.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className={`action-btn ${isDone ? 'done' : ''}`}
        onClick={() => onToggleDone(moduleId)}
      >
        <CheckCircle2 size={16} />
        {isDone ? '本模块已掌握' : '标记本模块已复习'}
      </button>
      <div>
        {next && (
          <button type="button" className="action-btn" onClick={() => onNavigate(next.id)}>
            下一模块：{next.label}
          </button>
        )}
      </div>
    </div>
  );
}
