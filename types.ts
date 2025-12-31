export interface PhysicsConcept {
  name: string;
  field: string;
  description: string;
  equations: string[];
  importance: number; // 1-10 scale
  imageUrl?: string;
}

export interface Resource {
  title: string;
  type: 'Book' | 'Website' | 'Video' | 'Simulation';
  description: string;
  link?: string;
}

export interface MemorizationTip {
  concept: string;
  trick: string;
}

export interface SupportingQuote {
  text: string;
  source: string;
}

export interface RealLifeObservation {
  conceptName: string;
  description: string;
  example: string;
  imageUrl?: string;
}

export interface AnalysisResult {
  summary: string;
  concepts: PhysicsConcept[];
  resources: Resource[];
  tips: MemorizationTip[];
  complexityLevel: number; // 1-10
  sourceEvidence: SupportingQuote[];
  realLifeObservations: RealLifeObservation[];
}

export interface Inaccuracy {
  point: string;
  reason: string;
  correction: string;
}

export interface TheoryVerification {
  overallCorrectness: number; // 0-100
  verdict: 'Scientifically Sound' | 'Minor Errors' | 'Significant Flaws' | 'Incorrect';
  inaccuracies: Inaccuracy[];
  feedback: string;
  improvedTheory?: string;
  sourceEvidence: SupportingQuote[];
}

export interface KnowledgeFile {
  name: string;
  type: string;
  data: string; // Base64
  mimeType: string;
}
