import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { __mockReset } from './__mocks__/op-sqlite';
import {
  initDb,
  createVisit,
  addDangerSign,
  type VisitRow,
} from '../src/lib/db';
import { buildEnvelope } from '../src/lib/triage-pdf';
import { applyToolCalls } from '../src/lib/tools';

beforeAll(async () => {
  await initDb();
});

afterEach(() => __mockReset());

describe('triage envelope (QR payload)', () => {
  it('is stable, deterministic JSON parsed back to schema/visit_id/severity', async () => {
    const v = await createVisit({ patient_name: 'Pending' });
    await applyToolCalls({
      visitId: v.id,
      calls: [
        {
          name: 'record_vitals',
          arguments: {
            patient_name: 'Fatima Bello',
            gestational_age_weeks: 32,
            bp_sys: 158,
            bp_dia: 102,
            edema_grade: 'pitting',
            proteinuria: '2+',
          },
        },
        {
          name: 'flag_danger_sign',
          arguments: {
            severity: 'urgent',
            signs: ['BP 158/102', 'pitting edema'],
            protocol_id: 'MCPC-2017-§3-severe-preeclampsia',
          },
        },
        {
          name: 'recommend_action',
          arguments: {
            action: 'Refer within 12 hours.',
            timeframe_hours: 12,
            facility_type: 'district_hospital',
          },
        },
      ],
    });
    const { getVisit, listDangerSigns } = await import('../src/lib/db');
    const refreshed = (await getVisit(v.id)) as VisitRow;
    const signs = await listDangerSigns(v.id);
    const env = buildEnvelope(refreshed, signs);
    const parsed = JSON.parse(env);
    expect(parsed.schema).toBe('chw-companion/triage-envelope/v1');
    expect(parsed.visit_id).toBe(v.id);
    expect(parsed.severity).toBe('urgent');
    expect(parsed.vitals.bp_sys).toBe(158);
    expect(parsed.recommendation.facility).toBe('district_hospital');
    expect(parsed.danger_signs).toHaveLength(2);
  });

  it('omits danger_signs sensitive fields not in the schema (no leakage of internal severity codes)', async () => {
    const v = await createVisit({ patient_name: 'Test' });
    await addDangerSign({
      visit_id: v.id,
      severity: 'urgent',
      sign: 'test',
      protocol_id: 'MCPC-2017-§3-severe-preeclampsia',
    });
    const { getVisit, listDangerSigns } = await import('../src/lib/db');
    const refreshed = (await getVisit(v.id)) as VisitRow;
    const signs = await listDangerSigns(v.id);
    const env = JSON.parse(buildEnvelope(refreshed, signs));
    // Internal `id`, `visit_id`, `created_at` not included
    expect(env.danger_signs[0].id).toBeUndefined();
    expect(env.danger_signs[0].visit_id).toBeUndefined();
    expect(env.danger_signs[0].created_at).toBeUndefined();
    // But the load-bearing fields are
    expect(env.danger_signs[0].sign).toBe('test');
    expect(env.danger_signs[0].protocol_id).toBe('MCPC-2017-§3-severe-preeclampsia');
  });
});
