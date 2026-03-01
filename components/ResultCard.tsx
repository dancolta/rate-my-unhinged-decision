"use client";

import { forwardRef } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { getScoreColor } from "@/lib/utils";

interface ResultCardProps {
  data: AnalyzeResponse;
}

const NOISE_SVG =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+";

const ResultCard = forwardRef<HTMLDivElement, ResultCardProps>(
  function ResultCard({ data }, ref) {
    const scoreColor = getScoreColor(data.score);

    return (
      <div
        ref={ref}
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "1080px",
          height: "1920px",
          backgroundColor: "#0D0D0F",
          overflow: "hidden",
          fontFamily:
            "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
        }}
      >
        {/* Layer 1: Noise texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${NOISE_SVG}')`,
            opacity: 0.03,
            pointerEvents: "none",
          }}
        />

        {/* Layer 2: Score-colored atmospheric gradient */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            left: "-200px",
            width: "600px",
            height: "600px",
            background: `radial-gradient(circle, ${scoreColor} 0%, transparent 70%)`,
            opacity: 0.06,
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "64px",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontFamily:
                "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              fontSize: "64px",
              fontWeight: 700,
              color: "#FAFAFA",
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
            }}
          >
            Rate My
            <br />
            Unhinged Decision
          </div>

          {/* Hairline divider */}
          <div
            style={{
              marginTop: "24px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          />

          {/* Score */}
          <div
            style={{
              marginTop: "80px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Score glow */}
              <div
                style={{
                  position: "absolute",
                  width: "300px",
                  height: "300px",
                  borderRadius: "50%",
                  backgroundColor: scoreColor,
                  opacity: 0.15,
                  filter: "blur(60px)",
                }}
              />
              <span
                style={{
                  position: "relative",
                  fontFamily:
                    "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                  fontSize: "200px",
                  fontWeight: 700,
                  lineHeight: 1,
                  color: scoreColor,
                }}
              >
                {data.score}
              </span>
            </div>
            <span
              style={{
                fontFamily:
                  "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                fontSize: "24px",
                fontWeight: 500,
                color: "#71717A",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Unhinged Level
            </span>
          </div>

          {/* Verdict card */}
          <div
            style={{
              marginTop: "60px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderLeft: "4px solid #FF3B3B",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <span
              style={{
                fontFamily:
                  "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                fontSize: "36px",
                fontWeight: 700,
                color: "#FAFAFA",
                lineHeight: 1.3,
              }}
            >
              {data.verdict}
            </span>
          </div>

          {/* Comparisons */}
          <div
            style={{
              marginTop: "60px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <span
              style={{
                fontFamily:
                  "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                fontSize: "20px",
                fontWeight: 500,
                color: "#71717A",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              You Are Compared To
            </span>
            {data.comparisons.map((comp) => (
              <div
                key={comp.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontFamily:
                      "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                    fontSize: "28px",
                    fontWeight: 500,
                    color: "#FAFAFA",
                    flexShrink: 0,
                  }}
                >
                  {comp.name}
                </span>
                <div
                  style={{
                    flex: 1,
                    borderBottom: "1px dashed rgba(255, 255, 255, 0.15)",
                    marginBottom: "4px",
                  }}
                />
                <span
                  style={{
                    fontFamily:
                      "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#7B61FF",
                    flexShrink: 0,
                  }}
                >
                  {comp.percentage}%
                </span>
              </div>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Bottom divider */}
          <div
            style={{
              height: "1px",
              width: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          />

          {/* Hook CTA */}
          <div
            style={{
              marginTop: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontFamily:
                  "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                fontSize: "28px",
                fontWeight: 500,
                color: "#A1A1AA",
              }}
            >
              How unhinged are you?
            </span>
            <span
              style={{
                fontFamily:
                  "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                fontSize: "24px",
                fontWeight: 400,
                color: "#71717A",
              }}
            >
              ratemyunhinged.app
            </span>
          </div>

          {/* NodeSparks branding */}
          <div style={{ marginTop: "32px" }}>
            <span
              style={{
                fontFamily:
                  "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                fontSize: "18px",
                fontWeight: 400,
                color: "#71717A",
              }}
            >
              NodeSparks
            </span>
          </div>
        </div>
      </div>
    );
  }
);

export default ResultCard;
