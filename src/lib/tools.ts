/**
 * Gemma 4 tool schemas + zod parsers + handlers.
 *
 * The model emits structured function calls; each handler validates the
 * arguments with zod (fail loudly, never silently coerce) and mutates the
 * encrypted SQLite store. Handlers return what the UI needs to render —
 * never the raw model output.
 *
 * Adding a tool: define the args schema, register it in TOOLS, implement
 * a handler in HANDLERS, and add a test in __tests__/tools.test.ts.
 */
import { z } from 'zod';
import {
  addDangerSign,
  createFollowup,
  createVisit,
  updateVisit,
  type FacilityType,
  type Severity,
  type VisitRow,
} from './db';
import { emit } from './events';

// -----------------------------------------------------------------------------
// Schemas — surface presented to the model. These are the *flat* shape that
// cactus-react-native's CactusLMTool expects (name + description + parameters).
// -----------------------------------------------------------------------------

const edemaGradeEnum = z.enum(['none', 'mild', 'moderate', 'pitting']);
const proteinuriaEnum = z.enum(['negative', 'trace', '1+', '2+', '3+', '4+']);
const dangerSeverityEnum = z.enum(['info', 'warning', 'urgent']);
const facilityEnum = z.enum([
  'home_care',
  'health_post',
  'district_hospital',
  'referral_hospital',
]);

export const RecordVitalsArgs = z.object({
  patient_name: z.string().min(1, 'patient_name required'),
  gestational_age_weeks: z.number().int().min(0).max(48),
  bp_sys: z.number().int().min(40).max(260).nullable(),
  bp_dia: z.number().int().min(20).max(180).nullable(),
  edema_grade: edemaGradeEnum,
  proteinuria: proteinuriaEnum,
});
export type RecordVitalsArgs = z.infer<typeof RecordVitalsArgs>;

export const FlagDangerSignArgs = z.object({
  severity: dangerSeverityEnum,
  // Cap signs to keep prompt fidelity; model occasionally over-generates.
  signs: z.array(z.string().min(1)).min(1).max(10),
  protocol_id: z.string().min(1),
});
export type FlagDangerSignArgs = z.infer<typeof FlagDangerSignArgs>;

export const RecommendActionArgs = z.object({
  action: z.string().min(1),
  timeframe_hours: z.number().int().min(0).max(24 * 30),
  facility_type: facilityEnum,
});
export type RecommendActionArgs = z.infer<typeof RecommendActionArgs>;

export const ScheduleFollowupArgs = z.object({
  patient_name: z.string().min(1),
  days_from_now: z.number().int().min(0).max(365),
  reason: z.string().min(1),
});
export type ScheduleFollowupArgs = z.infer<typeof ScheduleFollowupArgs>;

// -----------------------------------------------------------------------------
// Tool catalog — the exact shape passed to CactusLM.complete({tools})
// -----------------------------------------------------------------------------

import type { CactusLMTool } from 'cactus-react-native';

export const TOOLS: CactusLMTool[] = [
  {
    name: 'record_vitals',
    description:
      'Record the maternal vitals captured during this home visit. Call this for every visit, before any danger-sign flagging or recommendation. Use null for any vital that could not be measured.',
    parameters: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: "Patient's name (as spoken by the CHW)" },
        gestational_age_weeks: {
          type: 'integer',
          description: 'Estimated weeks of gestation (0 if unknown)',
        },
        bp_sys: {
          type: 'integer',
          description: 'Systolic blood pressure in mmHg, or null if not measured',
        },
        bp_dia: {
          type: 'integer',
          description: 'Diastolic blood pressure in mmHg, or null if not measured',
        },
        edema_grade: {
          type: 'string',
          description: 'Visible edema: none | mild | moderate | pitting',
        },
        proteinuria: {
          type: 'string',
          description: 'Urinalysis dipstick reading: negative | trace | 1+ | 2+ | 3+ | 4+',
        },
      },
      required: [
        'patient_name',
        'gestational_age_weeks',
        'bp_sys',
        'bp_dia',
        'edema_grade',
        'proteinuria',
      ],
    },
  },
  {
    name: 'flag_danger_sign',
    description:
      'Flag a clinical danger sign matching WHO MCPC §3 criteria. Call once per concern; severity "urgent" forces immediate referral. protocol_id must reference a section (e.g. "MCPC-2017-§3.4-severe-preeclampsia").',
    parameters: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          description: 'info | warning | urgent',
        },
        signs: {
          type: 'array',
          description: 'List of observed danger signs (short phrases).',
        },
        protocol_id: {
          type: 'string',
          description: 'Reference to the WHO protocol section that triggered the flag.',
        },
      },
      required: ['severity', 'signs', 'protocol_id'],
    },
  },
  {
    name: 'recommend_action',
    description:
      'Emit one concrete next action for the CHW. Imperative, short, in Hausa or English depending on input language. timeframe_hours = 0 means "now"; 12 means "within 12 hours".',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description:
            'A single-sentence imperative recommendation. Example: "Refer to district hospital within 12 hours."',
        },
        timeframe_hours: { type: 'integer', description: 'Hours until the action must occur' },
        facility_type: {
          type: 'string',
          description:
            'home_care | health_post | district_hospital | referral_hospital',
        },
      },
      required: ['action', 'timeframe_hours', 'facility_type'],
    },
  },
  {
    name: 'schedule_followup',
    description:
      'Schedule a routine follow-up visit. Use this for every clear/watch outcome where the patient will be seen again on a schedule.',
    parameters: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: "Patient's name" },
        days_from_now: { type: 'integer', description: 'Days until the next visit' },
        reason: { type: 'string', description: 'Short reason / topic for the follow-up' },
      },
      required: ['patient_name', 'days_from_now', 'reason'],
    },
  },
];

// -----------------------------------------------------------------------------
// Handler dispatch
// -----------------------------------------------------------------------------

export interface ToolResult {
  tool: string;
  ok: boolean;
  error?: string;
}

/**
 * Apply a single model-emitted function call to the local DB.
 * Returns an array of results in invocation order so the UI can render a
 * timeline. Errors are captured per-call rather than thrown so one bad call
 * doesn't tear down the whole visit.
 */
export async function applyToolCalls(args: {
  visitId: string;
  calls: Array<{ name: string; arguments: Record<string, unknown> }>;
}): Promise<ToolResult[]> {
  const out: ToolResult[] = [];
  for (const call of args.calls) {
    try {
      switch (call.name) {
        case 'record_vitals': {
          const parsed = RecordVitalsArgs.parse(call.arguments);
          await updateVisit(args.visitId, {
            patient_name: parsed.patient_name,
            gestational_age_weeks: parsed.gestational_age_weeks,
            bp_sys: parsed.bp_sys,
            bp_dia: parsed.bp_dia,
            edema_grade: parsed.edema_grade,
            proteinuria: parsed.proteinuria,
          });
          out.push({ tool: 'record_vitals', ok: true });
          break;
        }
        case 'flag_danger_sign': {
          const parsed = FlagDangerSignArgs.parse(call.arguments);
          for (const sign of parsed.signs) {
            await addDangerSign({
              visit_id: args.visitId,
              severity: parsed.severity,
              sign,
              protocol_id: parsed.protocol_id,
            });
          }
          if (parsed.severity === 'urgent') {
            await updateVisit(args.visitId, {
              refer_immediately: 1,
              severity: 'urgent',
            });
          } else if (parsed.severity === 'warning') {
            await updateVisit(args.visitId, { severity: 'watch' });
          }
          out.push({ tool: 'flag_danger_sign', ok: true });
          break;
        }
        case 'recommend_action': {
          const parsed = RecommendActionArgs.parse(call.arguments);
          await updateVisit(args.visitId, {
            recommended_action: parsed.action,
            recommended_timeframe_hours: parsed.timeframe_hours,
            recommended_facility: parsed.facility_type as FacilityType,
          });
          out.push({ tool: 'recommend_action', ok: true });
          break;
        }
        case 'schedule_followup': {
          const parsed = ScheduleFollowupArgs.parse(call.arguments);
          const due = new Date(Date.now() + parsed.days_from_now * 86400_000).toISOString();
          await createFollowup({
            visit_id: args.visitId,
            patient_name: parsed.patient_name,
            due_at: due,
            reason: parsed.reason,
          });
          out.push({ tool: 'schedule_followup', ok: true });
          break;
        }
        default:
          out.push({
            tool: call.name,
            ok: false,
            error: `Unknown tool: ${call.name}`,
          });
      }
    } catch (e) {
      out.push({
        tool: call.name,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Derive final severity: urgent > watch > clear, default clear if none set.
  const finalSeverity = await deriveSeverity(args.visitId);
  emit('visit:completed', { visitId: args.visitId, severity: finalSeverity });

  return out;
}

async function deriveSeverity(visitId: string): Promise<Severity> {
  const { getVisit } = await import('./db');
  const v = await getVisit(visitId);
  if (!v) return 'clear';
  if (v.severity) return v.severity;
  return 'clear';
}

/**
 * Convenience: start a visit, run inference, apply the calls.
 * Returns the final {visit, severity, results}.
 */
export async function startVisitAndApply(args: {
  patient_name_hint: string;
  rawCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
  audioSeconds: number;
  imageCount: number;
  rawJson: string;
}): Promise<{ visit: VisitRow; results: ToolResult[] }> {
  const visit = await createVisit({
    patient_name: args.patient_name_hint,
    audio_seconds: args.audioSeconds,
    image_count: args.imageCount,
    raw_function_calls_json: args.rawJson,
  });
  const results = await applyToolCalls({ visitId: visit.id, calls: args.rawCalls });
  const { getVisit } = await import('./db');
  const refreshed = await getVisit(visit.id);
  return { visit: refreshed ?? visit, results };
}
