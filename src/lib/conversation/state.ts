// Stub de compatibilité — le vrai état est dans engine.ts
export type FieldStatus = 'unknown'|'confirmed'|'skipped';
export interface Field { value: string|null; status: FieldStatus; }
export interface ConversationState { [key: string]: any; }
export const INITIAL_STATE: ConversationState = {};
export function mergeState(cur: any, upd: any): any { return { ...cur, ...upd }; }
export function stateToContext(): string { return ''; }
