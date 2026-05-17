/**
 * Rotating field tips shown on the Home screen.
 *
 * Tips are sourced from WHO MCPC §3. They are *reminders*, not novel medical
 * advice; the language is brief and the source is the CHW's own training
 * material. We never invent a tip — every one has a section anchor.
 */
import { getLanguage } from './i18n';

interface Tip {
  ha: string;
  en: string;
  source: string; // e.g. "MCPC §3.4-severe-preeclampsia"
}

const TIPS: Tip[] = [
  {
    ha: "Hawan jini 160/110 ko fiye da haka tare da fitsari mai protein 2+ na nuna pre-eclampsia mai tsanani — tura zuwa asibiti cikin sa'a 12.",
    en: 'BP ≥ 160/110 with proteinuria 2+ is severe pre-eclampsia — refer within 12 hours.',
    source: 'MCPC 2017 §3-severe-preeclampsia',
  },
  {
    ha: "Idon sawu da ke kumbura tare da hawan jini mai sama da 140/90 bayan makonni 20 — auna fitsari, sake duba bayan kwana uku.",
    en: 'Ankle swelling + BP > 140/90 after 20 weeks of pregnancy — test urine, recheck in three days.',
    source: 'MCPC 2017 §3-mild-preeclampsia',
  },
  {
    ha: "Zubar jini mai yawa bayan haihuwa, mara saurin numfashi, ko kodaye — fara oxytocin yanzu, tura zuwa asibiti.",
    en: 'Heavy bleeding postpartum, rapid pulse, or pallor — start oxytocin, refer to hospital.',
    source: 'MCPC 2017 §3-pph',
  },
  {
    ha: "Zazzabi sama da 38 °C tare da fitsari mai wari — yiwuwar amnionitis ko cutar koda. A fara magani.",
    en: 'Fever > 38 °C with foul-smelling discharge — possible amnionitis or kidney infection. Begin antibiotics.',
    source: 'MCPC 2017 §3-infection',
  },
  {
    ha: 'Magana ta dauki sakanni 60 ne kawai. Magana a fili, sannan ka ɗauki hotuna uku: fuska, idon sawu, fitsari.',
    en: 'Voice notes are capped at 60 seconds. Speak clearly, then capture three photos: face, ankle, dipstick.',
    source: 'Visit checklist',
  },
];

/** Returns a stable tip-of-the-day, rotating by calendar day. */
export function tipOfTheDay(now = new Date()): { text: string; source: string } {
  const dayIndex = Math.floor(now.getTime() / 86400_000);
  const tip = TIPS[dayIndex % TIPS.length]!;
  const lang = getLanguage();
  return { text: lang === 'ha' ? tip.ha : tip.en, source: tip.source };
}
