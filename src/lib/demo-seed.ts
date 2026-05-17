/**
 * Demo data seeder. Populates the encrypted DB with three plausible historical
 * visits and one upcoming follow-up, so the History screen + demo capture has
 * texture without requiring three real inferences.
 *
 * Only run from the History screen's long-press affordance — never from
 * production launches.
 */
import {
  createVisit,
  createFollowup,
  addDangerSign,
  listVisits,
} from './db';

export async function seedDemoData(): Promise<{ visitsCreated: number; followupsCreated: number }> {
  const existing = await listVisits(1);
  if (existing.length > 0) return { visitsCreated: 0, followupsCreated: 0 };

  const now = Date.now();

  // 1. Urgent severe pre-eclampsia (the hero case)
  const v1 = await createVisit({
    patient_name: 'Fatima Bello',
    gestational_age_weeks: 32,
    bp_sys: 158,
    bp_dia: 102,
    edema_grade: 'pitting',
    proteinuria: '2+',
    severity: 'urgent',
    refer_immediately: 1,
    recommended_action: "Ka tura Fatima zuwa Asibitin Janar na Kano cikin sa'a 12.",
    recommended_facility: 'district_hospital',
    recommended_timeframe_hours: 12,
    audio_seconds: 47,
    image_count: 3,
    created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
  });
  for (const sign of [
    'BP 158/102',
    'severe headache',
    'blurred vision',
    'pitting edema',
    'proteinuria 2+',
  ]) {
    await addDangerSign({
      visit_id: v1.id,
      severity: 'urgent',
      sign,
      protocol_id: 'MCPC-2017-§3-severe-preeclampsia',
    });
  }

  // 2. Mild pre-eclampsia — watch
  const v2 = await createVisit({
    patient_name: 'Hadiza Ibrahim',
    gestational_age_weeks: 28,
    bp_sys: 142,
    bp_dia: 94,
    edema_grade: 'mild',
    proteinuria: '2+',
    severity: 'watch',
    refer_immediately: 0,
    recommended_action: 'Sake gan ta sau biyu a wannan sati; ka auna jini a kowane ziyara.',
    recommended_facility: 'health_post',
    recommended_timeframe_hours: 72,
    audio_seconds: 38,
    image_count: 3,
    created_at: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
  });
  await addDangerSign({
    visit_id: v2.id,
    severity: 'warning',
    sign: 'BP 142/94 with proteinuria 2+',
    protocol_id: 'MCPC-2017-§3-mild-preeclampsia',
  });

  // 3. Clear — routine ANC
  const v3 = await createVisit({
    patient_name: 'Aisha Yusuf',
    gestational_age_weeks: 24,
    bp_sys: 118,
    bp_dia: 76,
    edema_grade: 'none',
    proteinuria: 'negative',
    severity: 'clear',
    refer_immediately: 0,
    recommended_action: 'Ci gaba da shan folic acid; sake gan ta a cikin sati biyu.',
    recommended_facility: 'home_care',
    recommended_timeframe_hours: 336,
    audio_seconds: 28,
    image_count: 3,
    created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    synced_at: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
  });

  // Upcoming follow-up tied to v3
  await createFollowup({
    visit_id: v3.id,
    patient_name: 'Aisha Yusuf',
    due_at: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(),
    reason: 'Routine ANC follow-up',
  });

  return { visitsCreated: 3, followupsCreated: 1 };
}
