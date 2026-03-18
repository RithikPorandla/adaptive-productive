import { useState, useRef } from "react";
import { api } from "../api";
import { extractTextFromPDF } from "../pdf-utils";

const STEPS = ["Welcome", "About You", "Import", "Ready"];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [syllabusText, setSyllabusText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [icsResult, setIcsResult] = useState(null);
  const pdfRef = useRef();
  const icsRef = useRef();

  const handleNext = async () => {
    if (step === 1) {
      const user = await api.createUser({
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@student.edu`,
        name: name || "Student",
      });
      window.__userId = user.id;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handlePdf = async (e) => {
    const file = e.target.files[0];
    if (!file || !window.__userId) return;
    setImporting(true);
    try {
      const text = await extractTextFromPDF(file);
      setSyllabusText(text.slice(0, 200) + "...");
      const result = await api.importSyllabus(window.__userId, text);
      setImportResult(result);
    } catch (err) { setImportResult({ error: err.message }); }
    finally { setImporting(false); if (pdfRef.current) pdfRef.current.value = ""; }
  };

  const handleSyllabusText = async () => {
    if (!syllabusText.trim() || !window.__userId) return;
    setImporting(true);
    try {
      const result = await api.importSyllabus(window.__userId, syllabusText);
      setImportResult(result);
    } catch (err) { setImportResult({ error: err.message }); }
    finally { setImporting(false); }
  };

  const handleIcs = async (e) => {
    const file = e.target.files[0];
    if (!file || !window.__userId) return;
    try {
      const text = await file.text();
      const result = await api.importICS(window.__userId, text);
      setIcsResult(result);
    } catch (err) { setIcsResult({ error: err.message }); }
    finally { if (icsRef.current) icsRef.current.value = ""; }
  };

  return (
    <div className="onboard-container">
      {/* Progress dots */}
      <div className="onboard-progress">
        {STEPS.map((s, i) => (
          <div key={i} className={`onboard-dot${i === step ? " active" : i < step ? " done" : ""}`} />
        ))}
      </div>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div className="onboard-step">
          <div className="onboard-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h1 className="onboard-title">Welcome to Adaptive</h1>
          <p className="onboard-desc">Your AI-powered study companion. Import your courses, and Ada will help you stay on top of everything.</p>
          <p className="onboard-subdesc">Takes about 2 minutes to set up.</p>
          <button className="btn btn-primary onboard-btn" onClick={handleNext}>Get started</button>
        </div>
      )}

      {/* Step 1: About You */}
      {step === 1 && (
        <div className="onboard-step">
          <h1 className="onboard-title">About you</h1>
          <p className="onboard-desc">Tell us a bit about yourself so Ada can personalize your experience.</p>
          <div className="onboard-form">
            <div className="form-group">
              <label>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Alex" autoFocus />
            </div>
            <div className="form-group">
              <label>School (optional)</label>
              <input value={school} onChange={e => setSchool(e.target.value)} placeholder="State University" />
            </div>
            <div className="form-group">
              <label>Major (optional)</label>
              <input value={major} onChange={e => setMajor(e.target.value)} placeholder="Computer Science" />
            </div>
          </div>
          <button className="btn btn-primary onboard-btn" onClick={handleNext} disabled={!name.trim()}>Continue</button>
        </div>
      )}

      {/* Step 2: Import */}
      {step === 2 && (
        <div className="onboard-step">
          <h1 className="onboard-title">Import your courses</h1>
          <p className="onboard-desc">Upload your syllabus or calendar. Ada will extract all your deadlines automatically. You can skip this and do it later.</p>

          <div className="onboard-import-grid">
            <div className="onboard-import-card">
              <div className="onboard-import-icon" style={{ background: "rgba(129,140,248,0.15)", color: "var(--accent)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3-3 3 3"/></svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Syllabus PDF</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Ada reads your syllabus and creates tasks for every deadline</div>
              <label className="btn btn-primary" style={{ cursor: "pointer" }}>
                Upload PDF
                <input ref={pdfRef} type="file" accept=".pdf" onChange={handlePdf} style={{ display: "none" }} />
              </label>
              {importing && <div style={{ marginTop: 8, fontSize: 13, color: "var(--accent)" }}>Ada is reading...</div>}
              {importResult && !importResult.error && <div style={{ marginTop: 8, fontSize: 13, color: "var(--success)" }}>Created {importResult.total} tasks</div>}
              {importResult?.error && <div style={{ marginTop: 8, fontSize: 13, color: "var(--danger)" }}>Error: {importResult.error}</div>}
            </div>

            <div className="onboard-import-card">
              <div className="onboard-import-icon" style={{ background: "rgba(52,211,153,0.15)", color: "var(--success)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Calendar (.ics)</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Import from Outlook, Google Calendar, or Canvas</div>
              <label className="btn btn-primary" style={{ cursor: "pointer" }}>
                Upload .ics
                <input ref={icsRef} type="file" accept=".ics,.ical" onChange={handleIcs} style={{ display: "none" }} />
              </label>
              {icsResult && !icsResult.error && <div style={{ marginTop: 8, fontSize: 13, color: "var(--success)" }}>{icsResult.classes.length} classes + {icsResult.tasks.length} tasks imported</div>}
              {icsResult?.error && <div style={{ marginTop: 8, fontSize: 13, color: "var(--danger)" }}>Error: {icsResult.error}</div>}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button className="btn btn-primary onboard-btn" onClick={handleNext}>
              {importResult || icsResult ? "Continue" : "Skip for now"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Ready */}
      {step === 3 && (
        <div className="onboard-step">
          <div className="onboard-icon" style={{ fontSize: 48 }}>🎓</div>
          <h1 className="onboard-title">You're all set, {name || "Student"}!</h1>
          <p className="onboard-desc">Ada is ready to help you stay organized and focused. Your dashboard is personalized just for you.</p>
          {(importResult || icsResult) && (
            <div style={{ marginBottom: 20, padding: "14px 20px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--border)", fontSize: 14, color: "var(--text-secondary)" }}>
              {importResult && !importResult.error && <div>📋 {importResult.total} assignments extracted from syllabus</div>}
              {icsResult && !icsResult.error && <div>📅 {icsResult.classes.length} classes + {icsResult.tasks.length} tasks from calendar</div>}
            </div>
          )}
          <button className="btn btn-primary onboard-btn" onClick={() => onComplete(window.__userId)}>
            Go to dashboard
          </button>
        </div>
      )}
    </div>
  );
}
