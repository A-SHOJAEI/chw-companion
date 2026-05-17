// Lightweight i18n. Two languages bundled: Hausa (primary, the target user's
// language) and English (for supervisors, judges, and code reviewers).
//
// Voice rules:
//   - Hausa: warm, concrete, never clinical jargon a CHW wouldn't use.
//   - English: plain. No product-speak. No debug language in the UI ever.
//
// Real localization (i18next + ICU plurals) replaces this once we go beyond
// two languages. Native-speaker review pending on every Hausa string.

export type Language = 'ha' | 'en';

export type StringKey =
  // App-level
  | 'app.name'
  | 'app.tagline'
  // Welcome / onboarding
  | 'welcome.title'
  | 'welcome.lead'
  | 'welcome.point1Title'
  | 'welcome.point1Body'
  | 'welcome.point2Title'
  | 'welcome.point2Body'
  | 'welcome.point3Title'
  | 'welcome.point3Body'
  | 'welcome.nameLabel'
  | 'welcome.namePlaceholder'
  | 'welcome.continue'
  | 'welcome.skipForNow'
  // Home greeting
  | 'home.greetingMorning'
  | 'home.greetingAfternoon'
  | 'home.greetingEvening'
  | 'home.statusOffline'
  | 'home.statusOnDevice'
  | 'home.statusEncrypted'
  | 'home.statusModelReady'
  | 'home.tipLabel'
  // Result detail
  | 'result.whyTitle'
  | 'result.whyHint'
  // Boot / loading
  | 'boot.openingDb'
  | 'boot.loadingModel'
  | 'boot.downloadingWeights'
  | 'boot.firstLaunchHint'
  | 'boot.ready'
  // Home
  | 'home.today'
  | 'home.visitsThisWeek'
  | 'home.startVisit'
  | 'home.tryDemo'
  | 'home.tryDemoSub'
  | 'home.history'
  | 'home.offlineBadge'
  // Visit screen — steps
  | 'visit.heading'
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
  | 'visit.reasonButton'
  | 'visit.cancel'
  | 'visit.preparingSample'
  | 'visit.readingNotes'
  | 'visit.reasoning'
  // Result screen
  | 'result.urgent'
  | 'result.urgentSub'
  | 'result.watch'
  | 'result.watchSub'
  | 'result.clear'
  | 'result.clearSub'
  | 'result.recommendation'
  | 'result.facility'
  | 'result.timeframe'
  | 'result.speakAloud'
  | 'result.printForm'
  | 'result.done'
  | 'result.patient'
  | 'result.vitals'
  | 'result.dangerSigns'
  | 'result.followup'
  | 'result.noVitals'
  | 'result.noDangerSigns'
  | 'result.noRecommendation'
  | 'result.unknownPatient'
  | 'result.gaWeeks'
  // History
  | 'history.title'
  | 'history.empty'
  | 'history.emptyHint'
  | 'history.syncPending'
  | 'history.synced'
  // Errors
  | 'error.couldntHear'
  | 'error.couldntSeePhoto'
  | 'error.modelNotReady'
  | 'error.tryAgain'
  | 'error.title'
  // Footer / attribution
  | 'footer.who'
  | 'footer.decisionSupport';

const ha: Record<StringKey, string> = {
  'app.name': 'CHW Companion',
  'app.tagline': 'Likita a aljihu ɗaya',

  'welcome.title': 'Maraba',
  'welcome.lead': 'CHW Companion yana taimaka maka yanke shawara ta hanya mai sauri yayin ziyarar haihuwa — gaba ɗaya akan wayar, ba tare da intanet ba.',
  'welcome.point1Title': 'Yana saurara kuma yana gani',
  'welcome.point1Body': 'Magana cikin Hausa, ɗauki hotuna uku, sannan Gemma 4 zai ba ka shawarwarin asibiti.',
  'welcome.point2Title': 'Yana aiki ko\'ina',
  'welcome.point2Body': "Babu intanet, babu uwar garken da'a — duk yana faruwa a wannan wayar.",
  'welcome.point3Title': 'Bayanan mara lafiya na zaman a wayar',
  'welcome.point3Body': 'An ɓoye SQLite a kan na\'urar; ba bayanai da ke barin wayar har sai ka aika takarda.',
  'welcome.nameLabel': 'Sunan ka',
  'welcome.namePlaceholder': 'Misali: Aisha',
  'welcome.continue': 'Ci gaba',
  'welcome.skipForNow': 'Tsallake yanzu',

  'boot.openingDb': 'Ana buɗe bayanan da aka kiyaye',
  'boot.loadingModel': 'Ana sa Gemma 4 a kan na\'urar',
  'boot.downloadingWeights': 'Ana saukar da samfurin',
  'boot.firstLaunchHint': 'Wannan yana faruwa ne sau ɗaya kawai a farkon zama',
  'boot.ready': 'A shirye',

  'home.today': 'Yau',
  'home.greetingMorning': 'Ina kwana',
  'home.greetingAfternoon': 'Ina yini',
  'home.greetingEvening': 'Ina yamma',
  'home.statusOffline': 'Babu intanet',
  'home.statusOnDevice': 'A kan na\'urar',
  'home.statusEncrypted': 'Bayanai a ɓoye',
  'home.statusModelReady': 'Gemma 4 a shirye',
  'home.tipLabel': 'Tunatarwa',
  'home.visitsThisWeek': 'Ziyarce-ziyarcen wannan sati',
  'home.startVisit': 'Fara Ziyara',
  'home.tryDemo': 'Misalin Ziyara',
  'home.tryDemoSub': 'Ka ga yadda yake aiki tare da mara lafiya na gwaji',
  'home.history': 'Tarihi',
  'home.offlineBadge': 'Yana aiki ba tare da intanet ba',

  'visit.heading': 'Ziyara',
  'visit.step1Title': 'Mataki 1 — Saurara',
  'visit.step2Title': 'Mataki 2 — Duba',
  'visit.step3Title': 'Mataki 3 — Tunani',
  'visit.listenHint': "Danna ka yi magana. Za a saurara har sakanni 60.",
  'visit.recording': 'Ana saurare',
  'visit.recordingDone': 'An saurara',
  'visit.photoFace': 'Fuska',
  'visit.photoAnkle': 'Idon sawu',
  'visit.photoDipstick': 'Fitsari',
  'visit.captureTap': 'Danna ka ɗauki hoto',
  'visit.recaptureTap': 'Sake ɗauka',
  'visit.reasonButton': 'Bincika',
  'visit.cancel': 'Soke',
  'visit.preparingSample': 'Ana shirya bayanan misali',
  'visit.readingNotes': 'Ana karanta bayanan ziyara',
  'visit.reasoning': 'Ana tunani kan saurara da hotuna',

  'result.urgent': 'ZAFI',
  'result.urgentSub': 'Tura zuwa asibiti yanzu',
  'result.watch': 'A KULA',
  'result.watchSub': 'Sake gani da wuri',
  'result.clear': 'LAFIYA',
  'result.clearSub': 'Babu alamar hatsari yanzu',
  'result.whyTitle': 'Me yasa wannan?',
  'result.whyHint': 'Alamomin da aka samu da kuma sashin ka\'idar WHO',
  'result.recommendation': 'Shawarwari',
  'result.facility': 'Wurin kulawa',
  'result.timeframe': 'A cikin (sa\'o\'i)',
  'result.speakAloud': 'Sake Karatu',
  'result.printForm': 'Buga Takarda',
  'result.done': 'An Gama',
  'result.patient': 'Mara lafiya',
  'result.vitals': 'Alamomin lafiya',
  'result.dangerSigns': 'Alamomin hatsari',
  'result.followup': 'Sake duba',
  'result.noVitals': 'Babu alamomin da aka auna',
  'result.noDangerSigns': 'Babu alamar hatsari',
  'result.noRecommendation': 'Babu shawarwari na musamman',
  'result.unknownPatient': 'Sunan mara lafiya ba a sani ba',
  'result.gaWeeks': 'makonni',

  'history.title': 'Tarihin Ziyara',
  'history.empty': 'Babu ziyara tukuna',
  'history.emptyHint': 'Ziyarcen da ka yi za a iya gani a nan',
  'history.syncPending': 'Jiran haɗawa',
  'history.synced': 'An haɗa',

  'error.couldntHear': 'Ban ji sosai ba. Sake danna ka yi magana.',
  'error.couldntSeePhoto': 'Hoton ya yi duhu. Sake ɗaukar hoto.',
  'error.modelNotReady': 'Ana shiryawa. Jira sakanni.',
  'error.tryAgain': 'Sake gwadawa',
  'error.title': 'Kuskure',

  'footer.who': 'Tushen: WHO MCPC 2017 §3',
  'footer.decisionSupport': 'Wannan na taimakon yanke shawara ne — ba ganewar likita ba.',
};

const en: Record<StringKey, string> = {
  'app.name': 'CHW Companion',
  'app.tagline': 'A midwife in every pocket',

  'welcome.title': 'Welcome',
  'welcome.lead': 'CHW Companion helps you reach a fast clinical decision during a maternal home visit — fully on your phone, no internet needed.',
  'welcome.point1Title': 'It listens and it sees',
  'welcome.point1Body': 'Speak in Hausa or English, capture three photos, and Gemma 4 returns a structured triage decision in under a minute.',
  'welcome.point2Title': 'Works anywhere',
  'welcome.point2Body': 'No signal, no cloud account — everything happens on this device.',
  'welcome.point3Title': 'Patient data stays here',
  'welcome.point3Body': 'Encrypted SQLite on-device; nothing leaves the phone until you choose to print a paper handoff.',
  'welcome.nameLabel': 'Your name',
  'welcome.namePlaceholder': 'e.g. Aisha',
  'welcome.continue': 'Continue',
  'welcome.skipForNow': 'Skip for now',

  'boot.openingDb': 'Opening encrypted records',
  'boot.loadingModel': 'Loading Gemma 4 on this device',
  'boot.downloadingWeights': 'Downloading model',
  'boot.firstLaunchHint': 'This happens once, on first launch',
  'boot.ready': 'Ready',

  'home.today': 'Today',
  'home.greetingMorning': 'Good morning',
  'home.greetingAfternoon': 'Good afternoon',
  'home.greetingEvening': 'Good evening',
  'home.statusOffline': 'Offline',
  'home.statusOnDevice': 'On device',
  'home.statusEncrypted': 'Encrypted',
  'home.statusModelReady': 'Gemma 4 ready',
  'home.tipLabel': 'Field tip',
  'home.visitsThisWeek': 'Visits this week',
  'home.startVisit': 'Start a visit',
  'home.tryDemo': 'Sample visit',
  'home.tryDemoSub': 'See how it works with a demo patient',
  'home.history': 'History',
  'home.offlineBadge': 'Runs offline',

  'visit.heading': 'Visit',
  'visit.step1Title': 'Step 1 — Listen',
  'visit.step2Title': 'Step 2 — See',
  'visit.step3Title': 'Step 3 — Reason',
  'visit.listenHint': 'Tap and speak. Up to 60 seconds.',
  'visit.recording': 'Listening',
  'visit.recordingDone': 'Recorded',
  'visit.photoFace': 'Face',
  'visit.photoAnkle': 'Ankle',
  'visit.photoDipstick': 'Dipstick',
  'visit.captureTap': 'Tap to capture',
  'visit.recaptureTap': 'Retake',
  'visit.reasonButton': 'Review',
  'visit.cancel': 'Cancel',
  'visit.preparingSample': 'Preparing the demo case',
  'visit.readingNotes': 'Reading visit notes',
  'visit.reasoning': 'Reasoning over the audio and photos',

  'result.urgent': 'URGENT',
  'result.urgentSub': 'Refer now',
  'result.watch': 'WATCH',
  'result.watchSub': 'Recheck soon',
  'result.clear': 'CLEAR',
  'result.clearSub': 'No danger signs',
  'result.whyTitle': 'Why this severity?',
  'result.whyHint': 'The findings and the matching WHO protocol section',
  'result.recommendation': 'Recommendation',
  'result.facility': 'Facility',
  'result.timeframe': 'Within (hours)',
  'result.speakAloud': 'Read aloud',
  'result.printForm': 'Print form',
  'result.done': 'Done',
  'result.patient': 'Patient',
  'result.vitals': 'Vitals',
  'result.dangerSigns': 'Danger signs',
  'result.followup': 'Follow-up',
  'result.noVitals': 'No measured vitals',
  'result.noDangerSigns': 'No danger signs flagged',
  'result.noRecommendation': 'No specific recommendation',
  'result.unknownPatient': 'Patient name not captured',
  'result.gaWeeks': 'weeks',

  'history.title': 'Visit history',
  'history.empty': 'No visits yet',
  'history.emptyHint': 'Visits you complete will appear here',
  'history.syncPending': 'Pending sync',
  'history.synced': 'Synced',

  'error.couldntHear': "Couldn't hear you — tap and speak again.",
  'error.couldntSeePhoto': 'Photo was unclear — please retake.',
  'error.modelNotReady': 'Still preparing — give it a moment.',
  'error.tryAgain': 'Try again',
  'error.title': 'Error',

  'footer.who': 'Source: WHO MCPC 2017 §3',
  'footer.decisionSupport': 'Decision support — not a medical diagnosis.',
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

/**
 * Bilingual helper — returns "<primary> · <other>" so reviewers who don't
 * read Hausa still understand status banners and key labels at a glance.
 */
export function tDual(key: StringKey): string {
  const a = t(key, currentLanguage);
  const b = t(key, currentLanguage === 'ha' ? 'en' : 'ha');
  if (a === b) return a;
  return `${a} · ${b}`;
}
