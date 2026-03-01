"use client";

import { forwardRef } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { getScoreColor } from "@/lib/utils";

interface ResultCardProps {
  data: AnalyzeResponse;
}

// Explicit font stacks — CSS vars don't always resolve in dom-to-image-more
const HEADING_FONT = "'Space Grotesk', 'Arial Black', sans-serif";
const BODY_FONT = "'JetBrains Mono', 'Courier New', monospace";

const ResultCard = forwardRef<HTMLDivElement, ResultCardProps>(
  function ResultCard({ data }, ref) {
    const scoreColor = getScoreColor(data.score);
    const scoreColorRgba = (alpha: number) =>
      scoreColor.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);

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
        }}
      >
        {/* Layer 1: Score-colored top gradient */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "900px",
            background: `radial-gradient(circle, ${scoreColorRgba(0.12)} 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />

        {/* Layer 2: Bottom accent gradient */}
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            right: "-100px",
            width: "600px",
            height: "600px",
            background: `radial-gradient(circle, rgba(123, 97, 255, 0.08) 0%, transparent 70%)`,
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
            padding: "72px 64px",
          }}
        >
          {/* App title */}
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: "36px",
              fontWeight: 700,
              color: "#FF3B3B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Rate My Unhinged Decision
          </div>

          {/* Hairline divider */}
          <div
            style={{
              marginTop: "28px",
              height: "2px",
              width: "120px",
              backgroundColor: "#FF3B3B",
            }}
          />

          {/* Score section */}
          <div
            style={{
              marginTop: "80px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
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
                  width: "360px",
                  height: "360px",
                  borderRadius: "50%",
                  backgroundColor: scoreColor,
                  opacity: 0.12,
                  filter: "blur(80px)",
                }}
              />
              <span
                style={{
                  position: "relative",
                  fontFamily: HEADING_FONT,
                  fontSize: "220px",
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
                fontFamily: HEADING_FONT,
                fontSize: "26px",
                fontWeight: 500,
                color: "#71717A",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              Unhinged Level
            </span>
          </div>

          {/* Verdict */}
          <div
            style={{
              marginTop: "64px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderLeft: `4px solid ${scoreColor}`,
              borderRadius: "16px",
              padding: "36px",
            }}
          >
            <span
              style={{
                fontFamily: BODY_FONT,
                fontSize: "34px",
                fontWeight: 700,
                color: "#FAFAFA",
                lineHeight: 1.35,
                display: "block",
              }}
            >
              &ldquo;{data.verdict}&rdquo;
            </span>
          </div>

          {/* Comparisons */}
          <div
            style={{
              marginTop: "56px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <span
              style={{
                fontFamily: HEADING_FONT,
                fontSize: "20px",
                fontWeight: 500,
                color: "#71717A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
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
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: "30px",
                    fontWeight: 600,
                    color: "#FAFAFA",
                    flexShrink: 0,
                    maxWidth: "700px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {comp.name}
                </span>
                <div
                  style={{
                    flex: 1,
                    borderBottom: "2px dashed rgba(255, 255, 255, 0.1)",
                    minWidth: "20px",
                  }}
                />
                <span
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: "30px",
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

          {/* Bottom section */}
          <div
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: "36px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: "30px",
                  fontWeight: 600,
                  color: "#FAFAFA",
                }}
              >
                How unhinged are you?
              </span>
              <span
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: "22px",
                  fontWeight: 400,
                  color: "#71717A",
                }}
              >
                ratemyunhinged.app
              </span>
            </div>
            <span
              style={{
                fontFamily: BODY_FONT,
                fontSize: "18px",
                fontWeight: 400,
                color: "#52525B",
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
