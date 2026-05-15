import { useEffect, useState } from 'react';
import { deriveSeverity, runDemo, tryLoadWebGpuModel, webGpuSupported, type DemoResult } from './lib/gemma';

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
          <h2>Try a sample visit</h2>
          <p>
            Bundled audio note (Hausa, 5 sec) + 3 visit photos + a tool schema. Tap the button and the same
            structured tool call you'd see on a phone renders below.
          </p>
          <div className="sample-grid">
            <img src="/sample/ankle.jpg" alt="Sample face photo" />
            <img src="/sample/ankle.jpg" alt="Sample ankle photo" />
            <img src="/sample/ankle.jpg" alt="Sample dipstick photo" />
          </div>
          <audio src="/sample/audio.wav" controls preload="metadata" />
          <div className="status">
            WebGPU: {gpuStatus === 'unknown' ? '…' : gpuStatus} · Browser:{' '}
            {navigator.userAgent.split(' ').slice(-1)[0]}
          </div>
          {gpuStatus === 'unsupported' ? (
            <div className="warn">
              Your browser doesn't support WebGPU. The demo will run in canned-replay mode and show the
              identical tool-call JSON that the Android build produced on a real device. Use Chrome 113+ to
              see live inference.
            </div>
          ) : null}
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn" onClick={onRun} disabled={loading}>
              {loading ? 'Thinking…' : 'Run Test'}
            </button>
            <a className="btn secondary" href="https://github.com/chwcompanion/chw-companion" target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
          </div>
        </div>

        {result ? (
          <>
            <div className={`severity-banner severity-${severity ?? 'clear'}`}>
              {severity === 'urgent' ? 'URGENT' : severity === 'watch' ? 'WATCH' : 'CLEAR'}
            </div>
            <div className="status" style={{ marginTop: 8 }}>
              source: {result.source} · confidence: {result.confidence.toFixed(4)} ·{' '}
              {result.totalTimeMs} ms
            </div>
            <div className="card">
              <h2>Tool calls</h2>
              <pre className="json-output">{JSON.stringify(result.functionCalls, null, 2)}</pre>
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
