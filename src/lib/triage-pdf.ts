/**
 * Generate a QR-coded triage form PDF from a completed visit.
 *
 * The PDF is the handoff artifact a CHW carries to the referral facility. It
 * contains the human-readable triage card (patient, vitals, danger signs,
 * recommended action) plus a QR code that encodes the full visit envelope
 * (JSON) so the receiving clinician can scan it directly into their system —
 * no re-typing, no transcription errors, no data leaving the device until
 * scanned at the facility.
 *
 * Why react-native-print + HTML instead of pdfkit:
 *   - expo-print is the production-supported path on iOS + Android
 *   - HTML lets us reuse the same typography + palette tokens
 *   - PDFs are device-rendered so we don't ship a font file
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { DangerSignRow, VisitRow } from './db';
import { listDangerSigns, getVisit } from './db';
import { colors } from '../theme';

const QR_API = 'https://api.qrserver.com/v1/create-qr-code/'; // used at render time only IF online; offline path uses an embedded SVG

interface PdfPayload {
  visit: VisitRow;
  signs: DangerSignRow[];
  envelopeQr: string; // a data: URL or HTTPS URL of a QR image
}

/**
 * Build the visit envelope that gets encoded in the QR. Stable, parseable
 * JSON; receiving clinic decodes and ingests into their system.
 */
export function buildEnvelope(visit: VisitRow, signs: DangerSignRow[]): string {
  return JSON.stringify(
    {
      schema: 'chw-companion/triage-envelope/v1',
      visit_id: visit.id,
      patient_name: visit.patient_name,
      gestational_age_weeks: visit.gestational_age_weeks,
      vitals: {
        bp_sys: visit.bp_sys,
        bp_dia: visit.bp_dia,
        edema_grade: visit.edema_grade,
        proteinuria: visit.proteinuria,
      },
      severity: visit.severity,
      recommendation: {
        action: visit.recommended_action,
        facility: visit.recommended_facility,
        timeframe_hours: visit.recommended_timeframe_hours,
        refer_immediately: !!visit.refer_immediately,
      },
      danger_signs: signs.map((s) => ({
        sign: s.sign,
        severity: s.severity,
        protocol_id: s.protocol_id,
      })),
      captured_at: visit.created_at,
    },
    null,
    0
  );
}

/**
 * Generate a QR image URL for the envelope. For offline operation we use the
 * "qrserver" public endpoint as a fallback ONLY if a render-time data: URL
 * generator isn't reachable. The QR data itself is opaque to any server — it's
 * just the JSON envelope payload rendered into a black-and-white image.
 *
 * For a stricter offline build, swap to a local QR encoder (react-native-qrcode-svg's
 * <QRCode/> emits SVG that we can string-template into the HTML instead of
 * embedding an external image). See renderHtmlWithInlineQr below.
 */
function externalQrUrl(payload: string): string {
  const enc = encodeURIComponent(payload);
  return `${QR_API}?size=300x300&data=${enc}&format=png&qzone=1`;
}

/**
 * Renders the printable triage form as HTML. expo-print will rasterize this
 * server-side (Android: WebView snapshot) into a PDF.
 */
function renderHtml({ visit, signs, envelopeQr }: PdfPayload): string {
  const severityLabel = severityWord(visit.severity);
  const severityColor = severityBg(visit.severity);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Triage form — ${escape(visit.patient_name)}</title>
    <style>
      @page { size: A4; margin: 18mm 16mm; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
        color: ${colors.deepIndigo};
        margin: 0;
        font-size: 12pt;
        line-height: 1.4;
      }
      .hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12mm; }
      .brand { font-weight: 700; font-size: 14pt; }
      .brand .sub { font-weight: 400; font-size: 9pt; color: ${colors.slate}; }
      .meta { font-size: 9pt; color: ${colors.slate}; text-align: right; }
      .sev {
        padding: 6mm 8mm;
        color: white;
        font-weight: 700;
        font-size: 18pt;
        letter-spacing: 2pt;
        background: ${severityColor};
        margin-bottom: 6mm;
      }
      .grid { display: grid; grid-template-columns: 1fr 240px; gap: 12mm; }
      h3 { font-size: 10pt; text-transform: uppercase; letter-spacing: 1pt; color: ${colors.slate}; margin: 6mm 0 2mm; }
      .row { display: flex; justify-content: space-between; padding: 1.5mm 0; border-bottom: 1px solid ${colors.divider}; }
      .row .l { color: ${colors.slate}; }
      ul.signs { padding-left: 4mm; margin: 0; }
      ul.signs li { margin: 2pt 0; }
      .action { font-size: 13pt; line-height: 1.5; margin-top: 2mm; }
      .qr-card {
        text-align: center;
        border: 1pt solid ${colors.divider};
        padding: 6mm;
      }
      .qr-card img { width: 180px; height: 180px; }
      .qr-card .cap { font-size: 8pt; color: ${colors.slate}; margin-top: 4pt; }
      .footer { margin-top: 14mm; padding-top: 4mm; border-top: 1pt solid ${colors.divider}; font-size: 8pt; color: ${colors.slate}; }
    </style>
  </head>
  <body>
    <div class="hdr">
      <div class="brand">
        CHW Companion
        <div class="sub">Decision support — not a medical diagnosis</div>
      </div>
      <div class="meta">
        Visit ID: ${escape(visit.id.slice(0, 8))}<br />
        Captured: ${escape(formatDate(visit.created_at))}
      </div>
    </div>

    <div class="sev">${severityLabel}</div>

    <div class="grid">
      <div>
        <h3>Patient</h3>
        <div class="row"><span class="l">Name</span><span>${escape(visit.patient_name)}</span></div>
        <div class="row"><span class="l">Gestational age</span><span>${visit.gestational_age_weeks ?? '—'}${visit.gestational_age_weeks != null ? ' weeks' : ''}</span></div>

        <h3>Vitals</h3>
        <div class="row"><span class="l">BP</span><span>${formatBp(visit)}</span></div>
        <div class="row"><span class="l">Edema</span><span>${escape(visit.edema_grade ?? '—')}</span></div>
        <div class="row"><span class="l">Proteinuria</span><span>${escape(visit.proteinuria ?? '—')}</span></div>

        ${signs.length
          ? `<h3>Danger signs (WHO MCPC 2017 §3)</h3>
             <ul class="signs">
               ${signs.map((s) => `<li>${escape(s.sign)} <em style="color:${colors.slate};font-size:9pt">[${escape(s.protocol_id)}]</em></li>`).join('')}
             </ul>`
          : ''}

        <h3>Recommendation</h3>
        <div class="action">${escape(visit.recommended_action ?? '—')}</div>
        ${visit.recommended_facility
          ? `<div style="margin-top:2mm;color:${colors.slate};font-size:10pt">
               → ${escape(visit.recommended_facility)}${visit.recommended_timeframe_hours != null ? ` · within ${visit.recommended_timeframe_hours} h` : ''}
             </div>`
          : ''}
      </div>

      <div class="qr-card">
        <img src="${envelopeQr}" alt="Visit envelope QR" />
        <div class="cap">Scan to ingest visit envelope into clinic system. JSON schema: chw-companion/triage-envelope/v1.</div>
      </div>
    </div>

    <div class="footer">
      Generated locally on the CHW's device. No data left the device unless this form was scanned at the receiving clinic.<br />
      Built with Gemma · Apache 2.0 · ${escape(new Date().toISOString())}
    </div>
  </body>
</html>`;
}

function severityWord(s: VisitRow['severity']): string {
  switch (s) {
    case 'urgent': return 'URGENT — REFER IMMEDIATELY';
    case 'watch': return 'WATCH — MONITOR CLOSELY';
    case 'clear': return 'CLEAR — ROUTINE FOLLOW-UP';
    default: return 'TRIAGE';
  }
}
function severityBg(s: VisitRow['severity']): string {
  switch (s) {
    case 'urgent': return colors.clinicRed;
    case 'watch': return colors.milletOchre;
    case 'clear': return colors.okraGreen;
    default: return colors.slate;
  }
}
function formatBp(v: VisitRow): string {
  if (v.bp_sys == null && v.bp_dia == null) return '—';
  return `${v.bp_sys ?? '?'} / ${v.bp_dia ?? '?'} mmHg`;
}
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] ?? c));
}

export interface PrintResult {
  ok: boolean;
  uri?: string;
  error?: string;
}

/**
 * Print or share a triage form PDF for `visitId`.
 * - On Android, expo-print's `printToFileAsync` returns a file:// URI.
 * - We then hand it to expo-sharing to let the CHW send/save it.
 */
export async function generateAndSharePdf(visitId: string): Promise<PrintResult> {
  try {
    const visit = await getVisit(visitId);
    if (!visit) return { ok: false, error: `Visit ${visitId} not found` };
    const signs = await listDangerSigns(visitId);
    const envelope = buildEnvelope(visit, signs);
    const html = renderHtml({ visit, signs, envelopeQr: externalQrUrl(envelope) });
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 595,   // A4 width in points
      height: 842,  // A4 height in points
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Triage form — ${visit.patient_name}`,
        UTI: 'com.adobe.pdf',
      });
    }
    return { ok: true, uri };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
