import { useEffect, useState } from 'react';
import { deriveSeverity, runDemo, tryLoadWebGpuModel, webGpuSupported, type DemoResult } from './lib/gemma';

const SEVERITY_COPY: Record<'urgent' | 'watch' | 'clear', { en: string; ha: string; sub: string }> = {
  urgent: { en: 'URGENT', ha: 'ZAFI', sub: 'Refer to a facility now' },
  watch: { en: 'WATCH', ha: 'A KULA', sub: 'Recheck soon' },
  clear: { en: 'CLEAR', ha: 'LAFIYA', sub: 'No danger signs' },
};

export function App() {
  const [gpuStatus, setGpuStatus] = useState<'unknown' | 'supported' | 'unsupported'>('unknown');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);

  useEffect(() => {
    setGpuStatus(webGpuSupported() ? 'supported' : 'unsupported');
    void tryLoadWebGpuModel(); // best-effort warm-up
  }, []);

  async function onRun() {
    setLoading(true);
    setResult(null);
    try {
      const r = await runDemo();
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  const severity = result ? deriveSeverity(result.functionCalls) : null;
  const copy = severity ? SEVERITY_COPY[severity] : null;

  return (
    <>
      <div className="banner">
        Browser demo. The full product runs 100% offline on a $200 Android phone —{' '}
        <a href="https://github.com/chwcompanion/chw-companion/releases" target="_blank" rel="noreferrer">
          download APK
        </a>
        .
      </div>

      <div className="app">
        <h1>CHW Companion</h1>
        <p className="lead">A midwife in every pocket — offline multimodal maternal-health triage with Gemma 4.</p>

        <div className="card">
          <h2>See a visit run</h2>
          <p>
            A community health worker's voice note, three clinical photos (face, ankle, urinalysis
            dipstick), and a tool schema — all consumed by Gemma 4 in a single multimodal forward pass.
            Tap below; the same structured tool call you'd see on a real phone renders here.
          </p>
          <div className="sample-grid">
            <img src="/sample/ankle.jpg" alt="Face photo (stand-in)" />
            <img src="/sample/ankle.jpg" alt="Ankle photo showing pitting edema" />
            <img src="/sample/ankle.jpg" alt="Urinalysis dipstick" />
          </div>
          <audio src="/sample/audio.wav" controls preload="metadata" />
          <div className="status">
            WebGPU {gpuStatus === 'unknown' ? '…' : gpuStatus} · {navigator.userAgent.split(' ').slice(-1)[0]}
          </div>
          {gpuStatus === 'unsupported' ? (
            <div className="warn">
              Your browser doesn't support WebGPU. The demo will replay the exact JSON the Android
              build produced on a real device. Use Chrome 113+ to see live in-browser inference.
            </div>
          ) : null}
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn" onClick={onRun} disabled={loading}>
              {loading ? 'Reasoning over audio + 3 photos…' : 'Run the visit'}
            </button>
            <a className="btn secondary" href="https://github.com/chwcompanion/chw-companion" target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
          </div>
        </div>

        {result && copy ? (
          <>
            <div className={`severity-banner severity-${severity}`}>
              <div className="severity-label">{copy.ha}</div>
              <div className="severity-sub">{copy.en} · {copy.sub}</div>
            </div>
            <div className="status" style={{ marginTop: 8 }}>
              source: {result.source} · confidence {result.confidence.toFixed(4)} · {result.totalTimeMs} ms
            </div>
            <div className="card">
              <h2>Tool calls emitted by Gemma 4</h2>
              <pre className="json-output">{JSON.stringify(result.functionCalls, null, 2)}</pre>
              <p style={{ fontSize: 13, color: 'var(--slate)', marginTop: 12, marginBottom: 0 }}>
                Each call is zod-validated and routed to a SQLite handler on the device. The protocol_id
                links the flagged sign back to the exact WHO MCPC §3 section it matches.
              </p>
            </div>
          </>
        ) : null}

        <footer>
          Built with Gemma 4. Apache 2.0. Clinical thresholds from{' '}
          <a href="https://www.who.int/publications/i/item/9789241565493" target="_blank" rel="noreferrer">
            WHO MCPC 2017 §3
          </a>
          . Decision support — not a medical diagnosis.
        </footer>
      </div>
    </>
  );
}
