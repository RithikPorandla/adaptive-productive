import React, { useState, useEffect } from "react";
import { getAdaBriefing } from "../ada.js";
import { mockUser, mockTasks, mockBehaviorLog } from "../store.js";

const moodConfig = {
  critical: { border: "#fb7185", glow: "rgba(251,113,133,0.2)", dot: "#fb7185", label: "Critical" },
  warning:  { border: "#fbbf24", glow: "rgba(251,191,36,0.15)", dot: "#fbbf24", label: "Heads up" },
  focused:  { border: "#38bdf8", glow: "rgba(56,189,248,0.15)", dot: "#38bdf8", label: "On track" },
  calm:     { border: "#34d399", glow: "rgba(52,211,153,0.15)", dot: "#34d399", label: "All good" },
};

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", marginLeft: 4 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%",
          background: "var(--ada-cyan)",
          animation: `typing-dot 1.2s ${i * 0.2}s infinite`,
          display: "inline-block"
        }} />
      ))}
    </span>
  );
}

export default function AdaBriefing({ apiKey }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!apiKey) { setLoading(false); return; }
    getAdaBriefing(mockUser, mockTasks, mockBehaviorLog, apiKey)
      .then(b => { setBriefing(b); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [apiKey]);

  if (dismissed) return null;

  const mood = moodConfig[briefing?.mood || "focused"];

  return (
    <div className="fade-up" style={{
      background: `linear-gradient(135deg, #0d1929 0%, #0a1520 100%)`,
      border: `1px solid ${mood.border}`,
      boxShadow: `0 0 40px ${mood.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      borderRadius: 16,
      padding: "28px 32px",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.5s ease, box-shadow 0.5s ease",
    }}>
      {/* Background texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: `radial-gradient(circle at 20% 50%, ${mood.border} 0%, transparent 60%),
                          radial-gradient(circle at 80% 20%, var(--ada-cyan) 0%, transparent 50%)`,
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Ada pulse indicator */}
          <div style={{ position: "relative", width: 36, height: 36 }}>
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${mood.border}30 0%, transparent 70%)`,
              animation: loading ? "ada-breathe 1.5s ease infinite" : "pulse-ring 2.5s ease infinite",
            }} />
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${mood.border}20, ${mood.border}05)`,
              border: `1.5px solid ${mood.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16
            }}>✦</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-ada)", fontSize: 18, fontWeight: 400, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              Ada
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: mood.dot, animation: "ada-breathe 2s ease infinite" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: mood.dot, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {loading ? "Analyzing..." : mood.label}
              </span>
            </div>
          </div>
        </div>

        <button onClick={() => setDismissed(true)} style={{
          background: "none", border: "none", color: "var(--text-muted)",
          cursor: "pointer", fontSize: 18, padding: 4, lineHeight: 1,
          transition: "color 0.2s"
        }} onMouseOver={e => e.target.style.color = "var(--text-secondary)"}
           onMouseOut={e => e.target.style.color = "var(--text-muted)"}>×</button>
      </div>

      {/* Content */}
      {loading && (
        <div style={{ fontFamily: "var(--font-ada)", fontSize: 22, color: "var(--text-secondary)", fontStyle: "italic" }}>
          Reading your week<TypingDots />
        </div>
      )}

      {error && !apiKey && (
        <div>
          <div style={{ fontFamily: "var(--font-ada)", fontSize: 22, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 12 }}>
            "You have a quiz in 2 days and a lab report due Friday — your Physics history says start now, not tomorrow."
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
            Add your Claude API key to activate Ada's live intelligence. She's analyzed your behavior patterns and has things to tell you.
          </div>
          <div style={{
            display: "inline-block", fontFamily: "var(--font-mono)", fontSize: 11,
            color: "var(--ada-cyan)", background: "var(--ada-cyan-dim)",
            padding: "4px 10px", borderRadius: 6, letterSpacing: "0.05em"
          }}>⚡ DEMO MODE — Real AI disabled</div>
        </div>
      )}

      {briefing && (
        <div>
          {/* Headline */}
          <div style={{
            fontFamily: "var(--font-ada)", fontSize: 24, fontWeight: 400,
            color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 16,
            letterSpacing: "-0.02em"
          }}>
            "{briefing.headline}"
          </div>

          {/* Insight */}
          <div style={{
            fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7,
            marginBottom: 20, maxWidth: 680
          }}>
            {briefing.insight}
          </div>

          {/* Bottom row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Directive */}
            <div style={{
              flex: 1, minWidth: 240,
              background: `${mood.border}0f`,
              border: `1px solid ${mood.border}30`,
              borderRadius: 10, padding: "12px 16px",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: mood.dot, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                ▸ Next action
              </div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
                {briefing.directive}
              </div>
            </div>

            {/* Risk alert */}
            {briefing.riskAlert && (
              <div style={{
                flex: 1, minWidth: 240,
                background: "rgba(251,113,133,0.06)",
                border: "1px solid rgba(251,113,133,0.2)",
                borderRadius: 10, padding: "12px 16px",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#fb7185", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  ⚠ Risk
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {briefing.riskAlert}
                </div>
              </div>
            )}
          </div>

          {/* Adaptation note */}
          {briefing.adaptationNote && (
            <div style={{
              marginTop: 16, display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, color: "var(--text-muted)"
            }}>
              <span style={{ color: "var(--ada-cyan)", fontSize: 14 }}>◈</span>
              <span style={{ fontStyle: "italic" }}>{briefing.adaptationNote}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
