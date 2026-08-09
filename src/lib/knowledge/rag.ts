import { SCENARIOS, Scenario } from './scenarios';
import { GMF_DOCTORS, PHYSIO } from './doctors';
import { detectService } from './services';

interface RAGResult {
  scenarios:    Scenario[];
  context:      string;
  detectedDept?: string;
  detectedLang?: string;
}

export function detectPractitioner(msg: string) { return null; }

export function retrieveContext(msg: string, hist: any[] = []): RAGResult {
  return { scenarios: [], context: '', detectedLang: 'fr' };
}

// Gardé pour compatibilité mais le vrai workflow est dans engine.ts
export function buildSystemPrompt(): string { return ''; }
