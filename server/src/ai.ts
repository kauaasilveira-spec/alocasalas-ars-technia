import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import type { Discarded, Recommendation, RecommendRequest } from './recommend.js';
import { BOOKING_TYPES, PERIODS } from './schedule.js';

let client: GoogleGenAI | null = null;

export function aiEnabled(): boolean {
  return Boolean(config.geminiApiKey);
}

function ai(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: config.geminiApiKey });
  return client;
}

/** Justificativa determinística, usada quando o Gemini não está configurado ou falha. */
export function ruleBasedExplanation(req: RecommendRequest, recs: Recommendation[], discarded: Discarded[]): string {
  if (recs.length === 0) {
    return `Nenhuma sala atende a ${req.attendees} pessoas em ${req.date} das ${req.start_time} às ${req.end_time}. Tente outro horário ou divida a turma.`;
  }
  const [best, second] = recs;
  let text = `Recomendamos ${best.room.name} (${best.score}% de compatibilidade). ${best.reasons.slice(0, 2).join(' ')}`;
  if (second) text += ` Alternativa: ${second.room.name} (${second.score}%).`;
  if (discarded.length) text += ` ${discarded.length} sala(s) foram descartadas por indisponibilidade ou restrições.`;
  return text;
}

export async function explainRecommendation(
  req: RecommendRequest,
  recs: Recommendation[],
  discarded: Discarded[],
): Promise<{ text: string; source: 'gemini' | 'regras' }> {
  const fallback = { text: ruleBasedExplanation(req, recs, discarded), source: 'regras' as const };
  if (!aiEnabled() || recs.length === 0) return fallback;

  const payload = {
    solicitacao: req,
    ranking: recs.slice(0, 3).map((r) => ({
      sala: r.room.name,
      tipo: r.room.type,
      capacidade: r.room.capacity,
      computadores: r.room.computers,
      compatibilidade: r.score,
      criterios: r.breakdown,
      motivos: r.reasons,
    })),
    descartadas: discarded.slice(0, 8),
  };
  try {
    const res = await ai().models.generateContent({
      model: config.geminiModel,
      contents: `Você é o assistente de alocação de salas de uma unidade de ensino técnico.
Com base APENAS nos dados abaixo (calculados por um algoritmo de pontuação com pesos: capacidade 45, recursos 25, equilíbrio de uso 15, continuidade 10, conforto 5),
escreva em português do Brasil uma justificativa curta (máx. 3 frases, sem markdown) explicando por que a primeira sala é a melhor escolha
e quando a alternativa poderia ser preferível. Não invente dados.

${JSON.stringify(payload)}`,
    });
    const text = res.text?.trim();
    return text ? { text, source: 'gemini' } : fallback;
  } catch (err) {
    console.warn('[gemini] falha ao gerar justificativa:', (err as Error).message);
    return fallback;
  }
}

export interface ParsedRequest {
  attendees?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  type?: string;
  needs_computers?: boolean;
  needs_projector?: boolean;
  needs_accessibility?: boolean;
  title?: string;
}

/** Interpreta um pedido em linguagem natural ("lab para 30 alunos terça à noite") em campos estruturados. */
export async function parseNaturalRequest(text: string, today: string): Promise<ParsedRequest> {
  if (!aiEnabled()) throw new Error('Gemini não configurado.');
  const res = await ai().models.generateContent({
    model: config.geminiModel,
    contents: `Hoje é ${today} (formato AAAA-MM-DD). Extraia os dados do pedido de reserva de sala abaixo.
Períodos padrão: ${Object.values(PERIODS).map((p) => `${p.label} ${p.start}-${p.end}`).join('; ')}.
Tipos válidos: ${Object.keys(BOOKING_TYPES).join(', ')}.
Use datas futuras mais próximas quando o usuário citar dia da semana. Omita campos não mencionados.

Pedido: """${text}"""`,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          attendees: { type: 'integer' },
          date: { type: 'string', description: 'AAAA-MM-DD' },
          start_time: { type: 'string', description: 'HH:MM' },
          end_time: { type: 'string', description: 'HH:MM' },
          type: { type: 'string', enum: Object.keys(BOOKING_TYPES) },
          needs_computers: { type: 'boolean' },
          needs_projector: { type: 'boolean' },
          needs_accessibility: { type: 'boolean' },
          title: { type: 'string' },
        },
      },
    },
  });
  return JSON.parse(res.text ?? '{}') as ParsedRequest;
}
