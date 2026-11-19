export type RouteId = 'overview' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'formulas';

export interface SectionAnchor {
  id: string;
  title: string;
  isLab?: boolean;
  keywords?: string[];
}

export interface ModuleMeta {
  id: Exclude<RouteId, 'overview' | 'formulas'>;
  code: string;
  shortTitle: string;
  title: string;
  sourceFile: string;
  slideCount: number;
  summary: string;
  labCount: number;
  sections: SectionAnchor[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}
