import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Rate My Unhinged Decision";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0D0D0F",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Noise/texture overlay — subtle grid of dots */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexWrap: "wrap",
            opacity: 0.04,
          }}
        >
          {Array.from({ length: 120 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "10%",
                height: "10%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                color: "white",
              }}
            >
              +
            </div>
          ))}
        </div>

        {/* Top-left crime scene badge */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#FF3B3B",
              display: "flex",
            }}
          />
          <span
            style={{
              color: "#FF3B3B",
              fontSize: 14,
              fontFamily: "monospace",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            CASE FILE OPEN
          </span>
        </div>

        {/* Top-right case number */}
        <div
          style={{
            position: "absolute",
            top: 32,
            right: 40,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#444",
              fontSize: 13,
              fontFamily: "monospace",
              letterSpacing: "0.1em",
            }}
          >
            EXHIBIT #???
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 80px",
            gap: 0,
          }}
        >
          {/* Main title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 62,
                fontWeight: 900,
                color: "white",
                fontFamily: "sans-serif",
                letterSpacing: "-0.02em",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              RATE MY
            </span>
            <span
              style={{
                fontSize: 72,
                fontWeight: 900,
                fontFamily: "sans-serif",
                letterSpacing: "-0.02em",
                textAlign: "center",
                lineHeight: 1.1,
                background: "linear-gradient(90deg, #FF3B3B, #FFB800)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              UNHINGED DECISION
            </span>
          </div>

          {/* Subtitle */}
          <span
            style={{
              fontSize: 22,
              color: "#888",
              fontFamily: "monospace",
              marginTop: 16,
              fontStyle: "italic",
            }}
          >
            How questionable was that, really?
          </span>

          {/* Score meter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 40,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "monospace",
                color: "#7B61FF",
              }}
            >
              0
            </span>

            {/* Meter bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                width: 500,
                height: 16,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {/* Background track */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#1a1a1e",
                  display: "flex",
                }}
              />
              {/* Gradient fill */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, #7B61FF 0%, #FFB800 40%, #FF3B3B 100%)",
                  opacity: 0.8,
                  display: "flex",
                }}
              />
            </div>

            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "monospace",
                color: "#FF3B3B",
              }}
            >
              100
            </span>
          </div>

          {/* Meter labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: 580,
              marginTop: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#555",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              mildly chaotic
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#555",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              absolute menace
            </span>
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 1,
              backgroundColor: "#333",
              display: "flex",
            }}
          />
          <span
            style={{
              fontSize: 16,
              fontFamily: "monospace",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#FFB800",
            }}
          >
            confess. get judged. share the damage.
          </span>
          <div
            style={{
              width: 40,
              height: 1,
              backgroundColor: "#333",
              display: "flex",
            }}
          />
        </div>

        {/* Corner accents — crime scene tape feel */}
        {/* Top-left corner */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 60,
            height: 60,
            borderTop: "2px solid #FF3B3B",
            borderLeft: "2px solid #FF3B3B",
            opacity: 0.4,
            display: "flex",
          }}
        />
        {/* Top-right corner */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 60,
            height: 60,
            borderTop: "2px solid #FF3B3B",
            borderRight: "2px solid #FF3B3B",
            opacity: 0.4,
            display: "flex",
          }}
        />
        {/* Bottom-left corner */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 60,
            height: 60,
            borderBottom: "2px solid #FF3B3B",
            borderLeft: "2px solid #FF3B3B",
            opacity: 0.4,
            display: "flex",
          }}
        />
        {/* Bottom-right corner */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 60,
            height: 60,
            borderBottom: "2px solid #FF3B3B",
            borderRight: "2px solid #FF3B3B",
            opacity: 0.4,
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
