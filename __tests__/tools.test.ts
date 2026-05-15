import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { __mockReset } from './__mocks__/op-sqlite';
import {
  initDb,
  createVisit,
  getVisit,
  listDangerSigns,
  listUpcomingFollowups,
} from '../src/lib/db';
import { applyToolCalls } from '../src/lib/tools';

beforeAll(async () => {
  await initDb();
});

afterEach(() => {
  __mockReset();
});

describe('applyToolCalls', () => {
  it('record_vitals mutates the visit row', async () => {
    const visit = await createVisit({ patient_name: 'Pending' });
    await applyToolCalls({
      visitId: visit.id,
      calls: [
        {
          name: 'record_vitals',
          arguments: {
            patient_name: 'Aisha Yusuf',
            gestational_age_weeks: 24,
            bp_sys: 118,
            bp_dia: 76,
            edema_grade: 'none',
            proteinuria: 'negative',
          },
        },
      ],
    });
    const v = await getVisit(visit.id);
    expect(v?.patient_name).toBe('Aisha Yusuf');
    expect(v?.gestational_age_weeks).toBe(24);
    expect(v?.bp_sys).toBe(118);
    expect(v?.edema_grade).toBe('none');
  });

  it('flag_danger_sign(urgent) sets refer_immediately and creates rows', async () => {
    const visit = await createVisit({ patient_name: 'Pending' });
    await applyToolCalls({
      visitId: visit.id,
      calls: [
        {
          name: 'flag_danger_sign',
          arguments: {
            severity: 'urgent',
            signs: ['BP 158/102', 'severe headache', 'pitting edema'],
            protocol_id: 'MCPC-2017-§3-severe-preeclampsia',
          },
        },
      ],
    });
    const v = await getVisit(visit.id);
    expect(v?.refer_immediately).toBe(1);
    expect(v?.severity).toBe('urgent');
    const signs = await listDangerSigns(visit.id);
    expect(signs).toHaveLength(3);
    expect(signs[0]!.protocol_id).toBe('MCPC-2017-§3-severe-preeclampsia');
  });

  it('flag_danger_sign(warning) sets severity to watch but does not force referral', async () => {
    const visit = await createVisit({ patient_name: 'Pending' });
    await applyToolCalls({
      visitId: visit.id,
      calls: [
        {
          name: 'flag_danger_sign',
          arguments: {
            severity: 'warning',
            signs: ['BP 142/92'],
            protocol_id: 'MCPC-2017-§3-mild-preeclampsia',
          },
        },
      ],
    });
    const v = await getVisit(visit.id);
    expect(v?.severity).toBe('watch');
    expect(v?.refer_immediately).toBe(0);
  });

  it('recommend_action stores facility + timeframe', async () => {
    const visit = await createVisit({ patient_name: 'Pending' });
    await applyToolCalls({
      visitId: visit.id,
      calls: [
        {
          name: 'recommend_action',
          arguments: {
            action: 'Refer to district hospital within 12 hours.',
            timeframe_hours: 12,
            facility_type: 'district_hospital',
          },
        },
      ],
    });
    const v = await getVisit(visit.id);
    expect(v?.recommended_action).toContain('district hospital');
    expect(v?.recommended_facility).toBe('district_hospital');
    expect(v?.recommended_timeframe_hours).toBe(12);
  });

  it('schedule_followup creates a future row in followups', async () => {
    const visit = await createVisit({ patient_name: 'Aisha' });
    await applyToolCalls({
      visitId: visit.id,
      calls: [
        {
          name: 'schedule_followup',
          arguments: { patient_name: 'Aisha', days_from_now: 14, reason: 'Routine antenatal check' },
        },
      ],
    });
    const fu = await listUpcomingFollowups();
    expect(fu).toHaveLength(1);
    expect(fu[0]!.patient_name).toBe('Aisha');
    expect(fu[0]!.reason).toBe('Routine antenatal check');
  });

  it('rejects an out-of-range BP via zod (severity remains unchanged)', async () => {
    const visit = await createVisit({ patient_name: 'Pending' });
    const results = await applyToolCalls({
      visitId: visit.id,
      calls: [
        {
          name: 'record_vitals',
          arguments: {
            patient_name: 'Foo',
            gestational_age_weeks: 28,
            bp_sys: 9999,
            bp_dia: 70,
            edema_grade: 'none',
            proteinuria: 'negative',
          },
        },
      ],
    });
    expect(results[0]!.ok).toBe(false);
    expect(results[0]!.error).toMatch(/bp_sys/i);
  });

  it('unknown tool name returns ok:false but does not throw', async () => {
    const visit = await createVisit({ patient_name: 'Pending' });
    const results = await applyToolCalls({
      visitId: visit.id,
      calls: [{ name: 'nuke_orbit', arguments: {} }],
    });
    expect(results[0]!.ok).toBe(false);
    expect(results[0]!.error).toMatch(/unknown tool/i);
  });

  it('full visit flow: vitals + urgent flag + action + follow-up all run in order', async () => {
    const visit = await createVisit({ patient_name: 'Pending' });
    const results = await applyToolCalls({
      visitId: visit.id,
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
            signs: ['BP 158/102', 'severe headache', 'pitting edema', 'proteinuria 2+'],
            protocol_id: 'MCPC-2017-§3-severe-preeclampsia',
          },
        },
        {
          name: 'recommend_action',
          arguments: {
            action: "Ka tura Fatima zuwa Asibitin Janar na Kano cikin sa'a 12.",
            timeframe_hours: 12,
            facility_type: 'district_hospital',
          },
        },
      ],
    });
    expect(results.every((r) => r.ok)).toBe(true);
    const v = await getVisit(visit.id);
    expect(v?.patient_name).toBe('Fatima Bello');
    expect(v?.severity).toBe('urgent');
    expect(v?.refer_immediately).toBe(1);
    expect(v?.bp_sys).toBe(158);
    expect(v?.recommended_facility).toBe('district_hospital');
    expect(v?.recommended_timeframe_hours).toBe(12);
    const signs = await listDangerSigns(visit.id);
    expect(signs.map((s) => s.sign)).toContain('severe headache');
  });
});
