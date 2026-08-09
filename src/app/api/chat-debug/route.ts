import { NextRequest, NextResponse } from 'next/server';
import { EMPTY_STATE, extractFromMessage, applyUpdates, nextStep, extractNameFromReply } from '@/lib/conversation/engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, conversation_state = {}, pending_field } = body;

  const state = { ...EMPTY_STATE, ...conversation_state };
  const lastMsg = message || '';

  // Extraction regex
  const updates = extractFromMessage(lastMsg, state);
  const newState = applyUpdates(state, updates);

  // Extraction contextuelle
  const contextual: Record<string, any> = {};
  const nothingExtracted = Object.keys(updates).length === 0;
  if (pending_field && (nothingExtracted || !(updates as any)[pending_field])) {
    if (pending_field === 'full_name') {
      const n = extractNameFromReply(lastMsg);
      contextual.extracted_name = n;
      contextual.would_confirm = !!n;
    } else if (pending_field === 'reason') {
      contextual.extracted_reason = lastMsg.length <= 100 ? lastMsg : null;
    }
  }

  // Prochaine étape
  const step = nextStep(newState);

  return NextResponse.json({
    input: { message: lastMsg, pending_field },
    regex_updates: updates,
    nothing_extracted: nothingExtracted,
    contextual_extraction: contextual,
    state_before: {
      full_name: state.full_name,
      phone: state.phone,
      service: state.service,
    },
    state_after: {
      full_name: newState.full_name,
      phone: newState.phone,
      service: newState.service,
    },
    next_step: step,
    conclusion: step.type === 'ask'
      ? `Va demander: "${(step as any).fr}"`
      : 'Prêt pour les créneaux',
  });
}
