// Lightweight i18n. We bundle two languages here to keep the production app
// honest: Hausa (default for the target user) and English (for the demo / for
// supervisors). Real localization should be replaced with i18next + ICU plurals
// once we ship more than two languages.

export type Language = 'ha' | 'en';

export type StringKey =
  // Home
  | 'app.name'
  | 'home.today'
  | 'home.visitsThisWeek'
  | 'home.startVisit'
  | 'home.history'
  // Visit screen — steps
  | 'visit.step1Title'
  | 'visit.step2Title'
  | 'visit.step3Title'
  | 'visit.listenHint'
  | 'visit.recording'
  | 'visit.recordingDone'
  | 'visit.photoFace'
  | 'visit.photoAnkle'
  | 'visit.photoDipstick'
  | 'visit.captureTap'
  | 'visit.recaptureTap'
  | 'visit.thinking'
  | 'visit.next'
  // Result screen
  | 'result.urgent'
  | 'result.watch'
  | 'result.clear'
  | 'result.recommendation'
  | 'result.facility'
  | 'result.timeframeHours'
  | 'result.speakAloud'
  | 'result.printForm'
  | 'result.done'
  | 'result.patient'
  | 'result.vitals'
  | 'result.dangerSigns'
  | 'result.followup'
  // History
  | 'history.title'
  | 'history.empty'
  | 'history.syncPending'
  | 'history.synced'
  // Errors
  | 'error.couldntHear'
  | 'error.couldntSeePhoto'
  | 'error.modelNotReady'
  | 'error.tryAgain'
  | 'error.title'
  // Status
  | 'status.idle'
  | 'status.listening'
  | 'status.thinking'
  | 'status.reading';

const ha: Record<StringKey, string> = {
  'app.name': 'CHW Companion',
  'home.today': 'Yau',
  'home.visitsThisWeek': 'Ziyarce-ziyarcen wannan sati',
  'home.startVisit': 'Fara Ziyara',
  'home.history': 'Tarihi',
  'visit.step1Title': 'Mataki 1 — Saurara',
  'visit.step2Title': 'Mataki 2 — Duba',
  'visit.step3Title': 'Mataki 3 — Tunani',
  'visit.listenHint': 'Danna kuma yi magana. Za a saurara har sa\'a daya.',
  'visit.recording': 'Ana saurare…',
  'visit.recordingDone': 'An saurara',
  'visit.photoFace': 'Fuska',
  'visit.photoAnkle': 'Idon sawu',
  'visit.photoDipstick': 'Fitsari',
  'visit.captureTap': 'Danna ka dauki hoto',
  'visit.recaptureTap': 'Sake daukar hoto',
  'visit.thinking': 'Ana tunani…',
  'visit.next': 'Cigaba',
  'result.urgent': 'ZAFI',
  'result.watch': 'A Kula',
  'result.clear': 'Lafiya',
  'result.recommendation': 'Shawarwari',
  'result.facility': 'Wurin kulawa',
  'result.timeframeHours': 'A cikin sa\'o\'i',
  'result.speakAloud': 'Sake Karatu',
  'result.printForm': 'Buga Takarda',
  'result.done': 'An Gama',
  'result.patient': 'Mara lafiya',
  'result.vitals': 'Alamomi',
  'result.dangerSigns': 'Alamomin hatsari',
  'result.followup': 'Sake duba',
  'history.title': 'Tarihin Ziyarce-ziyarce',
  'history.empty': 'Babu ziyara tukuna',
  'history.syncPending': 'Yana jiran haɗawa',
  'history.synced': 'An haɗa',
  'error.couldntHear': 'Ban ji sosai ba. Sake danna ka yi magana.',
  'error.couldntSeePhoto': 'Hoton ya yi duhu. Sake daukar hoto.',
  'error.modelNotReady': 'Ana shiryawa. Jira sakanni.',
  'error.tryAgain': 'Sake gwadawa',
  'error.title': 'Kuskure',
  'status.idle': 'A shirye',
  'status.listening': 'Ana saurare',
  'status.thinking': 'Ana tunani',
  'status.reading': 'Ana karantawa',
};

const en: Record<StringKey, string> = {
  'app.name': 'CHW Companion',
  'home.today': 'Today',
  'home.visitsThisWeek': 'Visits this week',
  'home.startVisit': 'Start Visit',
  'home.history': 'History',
  'visit.step1Title': 'Step 1 — Listen',
  'visit.step2Title': 'Step 2 — See',
  'visit.step3Title': 'Step 3 — Reason',
  'visit.listenHint': 'Tap and speak. Up to 60 seconds.',
  'visit.recording': 'Listening…',
  'visit.recordingDone': 'Recorded',
  'visit.photoFace': 'Face',
  'visit.photoAnkle': 'Ankle',
  'visit.photoDipstick': 'Dipstick',
  'visit.captureTap': 'Tap to capture',
  'visit.recaptureTap': 'Retake',
  'visit.thinking': 'Thinking…',
  'visit.next': 'Continue',
  'result.urgent': 'URGENT',
  'result.watch': 'Watch',
  'result.clear': 'Clear',
  'result.recommendation': 'Recommendation',
  'result.facility': 'Facility',
  'result.timeframeHours': 'Within (hours)',
  'result.speakAloud': 'Read aloud',
  'result.printForm': 'Print form',
  'result.done': 'Done',
  'result.patient': 'Patient',
  'result.vitals': 'Vitals',
  'result.dangerSigns': 'Danger signs',
  'result.followup': 'Follow-up',
  'history.title': 'Visit History',
  'history.empty': 'No visits yet',
  'history.syncPending': 'Pending sync',
  'history.synced': 'Synced',
  'error.couldntHear': "Couldn't hear you — tap and speak again.",
  'error.couldntSeePhoto': 'Photo was unclear — please retake.',
  'error.modelNotReady': 'Model is loading. Wait a few seconds.',
  'error.tryAgain': 'Try again',
  'error.title': 'Error',
  'status.idle': 'Ready',
  'status.listening': 'Listening',
  'status.thinking': 'Thinking',
  'status.reading': 'Reading',
};

const dictionaries: Record<Language, Record<StringKey, string>> = { ha, en };

let currentLanguage: Language = 'ha';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: StringKey, lang?: Language): string {
  const dict = dictionaries[lang ?? currentLanguage];
  return dict[key];
}
