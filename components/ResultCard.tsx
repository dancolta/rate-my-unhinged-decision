"use client";

import { forwardRef } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { getScoreColor } from "@/lib/utils";

interface ResultCardProps {
  data: AnalyzeResponse;
  userInput?: string;
}

const H = "'Space Grotesk', 'Arial Black', sans-serif";
const B = "'Plus Jakarta Sans', 'Helvetica Neue', sans-serif";

/** Reset object — prevents html-to-image rendering artifacts */
const R: React.CSSProperties = {
  border: "none",
  outline: "none",
  boxShadow: "none",
  margin: 0,
  textDecoration: "none",
  boxSizing: "border-box" as const,
};

/** Reset for elements that need their own border/boxShadow (e.g. the meter marker).
 *  Omits border & boxShadow so they aren't silently overridden by the reset. */
const R_NO_BOX: React.CSSProperties = {
  outline: "none",
  margin: 0,
  textDecoration: "none",
  boxSizing: "border-box" as const,
};

const ResultCard = forwardRef<HTMLDivElement, ResultCardProps>(
  function ResultCard({ data, userInput }, ref) {
    const sc = getScoreColor(data.score);
    const scA = (a: number) =>
      sc.replace("rgb(", "rgba(").replace(")", `, ${a})`);
    const confession = userInput || data.verdict;
    const scorePct = `${Math.max(0, Math.min(100, data.score))}%`;

    return (
      <div
        ref={ref}
        style={{
          ...R,
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "1080px",
          height: "1920px",
          backgroundColor: "#0f0f1a",
          overflow: "hidden",
          fontFamily: B,
        }}
      >
        {/* ═══ BACKGROUND ORBS ═══ */}
        <div
          style={{
            ...R,
            position: "absolute",
            top: "-8%",
            right: "-10%",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,45,85,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            ...R,
            position: "absolute",
            top: "28%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "950px",
            height: "950px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${scA(0.1)} 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            ...R,
            position: "absolute",
            bottom: "5%",
            left: "-12%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(175,82,222,0.14) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* ═══ DIAGONAL ACCENT STRIPES ═══ */}
        <div
          style={{
            ...R,
            position: "absolute",
            top: "-200px",
            right: "190px",
            width: "3px",
            height: "2400px",
            background: "linear-gradient(180deg, transparent 5%, #FF2D55, #AF52DE, #FFD60A, transparent 95%)",
            transform: "rotate(-15deg)",
            opacity: 0.25,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            ...R,
            position: "absolute",
            top: "-200px",
            right: "224px",
            width: "1px",
            height: "2400px",
            background: "linear-gradient(180deg, transparent 10%, #FFD60A, #AF52DE, #FF2D55, transparent 90%)",
            transform: "rotate(-15deg)",
            opacity: 0.12,
            pointerEvents: "none",
          }}
        />

        {/* ═══ MAIN CONTENT ═══ */}
        <div
          style={{
            ...R,
            position: "relative",
            zIndex: 3,
            height: "100%",
            padding: "64px 72px 56px",
          }}
        >
          {/* ─── TOP: Brand + Confession ─── */}
          <div style={{ ...R }}>
            {/* Confession label */}
            <div
              style={{
                ...R,
                fontFamily: H,
                fontSize: "42px",
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "0.25em",
                color: "#FF2D55",
              }}
            >
              I confessed
            </div>

            {/* Confession text */}
            <div
              style={{
                ...R,
                marginTop: "12px",
                fontFamily: B,
                fontSize: "32px",
                fontWeight: 500,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              &ldquo;{confession}&rdquo;
            </div>
          </div>

          {/* ─── CENTER: Score + Meter + Verdict ─── */}
          <div
            style={{
              ...R,
              textAlign: "center" as const,
              paddingTop: "40px",
              paddingBottom: "40px",
            }}
          >
            {/* Giant score */}
            <div
              style={{
                ...R,
                fontFamily: H,
                fontSize: "260px",
                fontWeight: 700,
                lineHeight: 0.85,
                color: sc,
                textShadow: `0 0 80px ${scA(0.4)}, 0 0 160px ${scA(0.15)}`,
                textAlign: "center" as const,
                paddingBottom: "30px",
              }}
            >
              {data.score}
            </div>

            {/* Score label */}
            <div
              style={{
                ...R,
                fontFamily: H,
                fontSize: "32px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.3em",
                textAlign: "center" as const,
                marginTop: "10px",
              }}
            >
              / 100 <span style={{ ...R, color: "#FF2D55" }}>UNHINGED</span>
            </div>

            {/* Meter bar */}
            <div
              style={{
                ...R,
                maxWidth: "720px",
                marginTop: "28px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {/* Track */}
              <div
                style={{
                  ...R,
                  height: "12px",
                  borderRadius: "100px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  position: "relative" as const,
                  overflow: "visible",
                }}
              >
                {/* Fill */}
                <div
                  style={{
                    ...R,
                    height: "100%",
                    borderRadius: "100px",
                    background: "linear-gradient(90deg, #30D158, #FFD60A, #FF9500, #FF453A, #FF2D55)",
                    width: scorePct,
                  }}
                />
                {/* Marker — uses R_NO_BOX so border & boxShadow are NOT reset */}
                <div
                  style={{
                    ...R_NO_BOX,
                    position: "absolute" as const,
                    top: "50%",
                    left: scorePct,
                    transform: "translate(-50%, -50%)",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "#FAFAFA",
                    border: `3px solid ${sc}`,
                    boxShadow: `0 0 12px rgba(255,255,255,0.5), 0 0 28px ${scA(0.4)}`,
                  }}
                />
              </div>
              {/* Labels */}
              <div
                style={{
                  ...R,
                  marginTop: "12px",
                  fontFamily: B,
                  fontSize: "16px",
                  fontWeight: 600,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.08em",
                  overflow: "hidden" as const,
                }}
              >
                <span style={{ ...R, color: "#30D158", float: "left" as const }}>Sane</span>
                <span style={{ ...R, color: "#FF2D55", float: "right" as const }}>Absolutely Unhinged</span>
              </div>
            </div>

            {/* Verdict */}
            <div
              style={{
                ...R,
                marginTop: "32px",
                fontFamily: H,
                fontSize: "36px",
                fontWeight: 600,
                lineHeight: 1.3,
                color: "#FAFAFA",
                textAlign: "center" as const,
                maxWidth: "860px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              &ldquo;{data.verdict}&rdquo;
            </div>
          </div>

          {/* ─── BOTTOM: Comparisons + Footer ─── */}
          <div style={{ ...R, position: "absolute" as const, bottom: "56px", left: "72px", right: "72px" }}>
            {/* Comparisons label */}
            <div
              style={{
                ...R,
                fontFamily: H,
                fontSize: "27px",
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.55)",
                marginBottom: "22px",
              }}
            >
              My energy matches
            </div>

            {/* Comparison rows */}
            <div style={{ ...R }}>
              {data.comparisons.slice(0, 3).map((comp, i) => {
                const emoji = ["🎭", "📺", "🃏"][i] ?? "✨";
                return (
                  <div
                    key={comp.name}
                    style={{
                      ...R,
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderRadius: "20px",
                      padding: "30px 35px",
                      marginBottom: "18px",
                    }}
                  >
                    <span style={{ ...R, fontSize: "45px", flexShrink: 0, marginRight: "22px" }}>{emoji}</span>
                    <div
                      style={{
                        ...R,
                        flex: 1,
                      }}
                    >
                      <span
                        style={{
                          ...R,
                          fontFamily: H,
                          fontSize: "35px",
                          fontWeight: 600,
                          color: "#FAFAFA",
                          lineHeight: 1.2,
                        }}
                      >
                        {comp.name}
                      </span>
                      <span
                        style={{
                          ...R,
                          fontFamily: B,
                          fontSize: "25px",
                          color: "rgba(255,255,255,0.3)",
                          lineHeight: 1.3,
                          marginTop: "5px",
                          display: "block" as const,
                        }}
                      >
                        {comp.description}
                      </span>
                    </div>
                    <span
                      style={{
                        ...R,
                        fontFamily: H,
                        fontSize: "38px",
                        fontWeight: 700,
                        color: "#AF52DE",
                        flexShrink: 0,
                        marginLeft: "22px",
                      }}
                    >
                      {comp.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Site URL */}
            <div
              style={{
                ...R,
                textAlign: "center" as const,
                marginTop: "20px",
                fontFamily: B,
                fontSize: "20px",
                color: "#5A5A64",
              }}
            >
              ratemyunhinged.app
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ResultCard;
