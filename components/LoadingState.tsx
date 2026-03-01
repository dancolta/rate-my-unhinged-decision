"use client";

export default function LoadingState() {
  return (
    <div
      className="flex items-center justify-center overflow-hidden min-h-dvh w-full relative"
    >
      {/* Match main page gradient blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background:
            "radial-gradient(circle at 20% 30%, rgba(175, 82, 222, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 45, 85, 0.06) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(255, 149, 0, 0.04) 0%, transparent 40%)",
          animation: "blobDrift 20s ease-in-out infinite alternate",
        }}
      />
      {/* Expanding pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 0.8, 1.6, 2.4, 3.2].map((delay, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${100 + i * 100}px`,
              height: `${100 + i * 100}px`,
              border: "1px solid rgba(255, 45, 85, 0.1)",
              animation: `ringExpand 4s ease-out infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { left: "15%", top: "80%", delay: 0, color: "#FF2D55" },
          { left: "75%", top: "85%", delay: 0.8, color: "#FF2D55" },
          { left: "40%", top: "90%", delay: 1.4, color: "#AF52DE" },
          { left: "60%", top: "75%", delay: 2.1, color: "#FF2D55" },
          { left: "25%", top: "70%", delay: 2.8, color: "#AF52DE" },
          { left: "85%", top: "80%", delay: 3.5, color: "#FF9500" },
          { left: "50%", top: "85%", delay: 4.2, color: "#FF9500" },
          { left: "10%", top: "90%", delay: 4.9, color: "#AF52DE" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute w-[3px] h-[3px] rounded-full opacity-0"
            style={{
              left: p.left,
              top: p.top,
              background: p.color,
              animation: `particleFloat 6s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Center content */}
      <div
        className="relative z-10 flex flex-col items-center px-8 text-center"
        style={{ animation: "glitchFlicker 8s step-end infinite" }}
      >
        {/* Big animated logo emoji */}
        <span
          className="text-8xl block mb-8"
          style={{
            animation: "loadingLogoSpin 6s ease-in-out infinite",
            filter: "drop-shadow(0 0 30px rgba(255, 45, 85, 0.4))",
          }}
        >
          🤯
        </span>

        <h2 className="font-heading text-xl font-bold text-text-primary mb-6">
          Analyzing Your Life Choices...
        </h2>

        {/* Shimmer bar */}
        <div className="w-[240px] mb-5">
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full animate-[shimmer_1.5s_linear_infinite]"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent 0%, #FF2D55 30%, #FF9500 50%, #AF52DE 70%, transparent 100%)",
                backgroundSize: "200% 100%",
              }}
            />
          </div>
        </div>

        {/* Rotating status messages */}
        <div className="h-6 overflow-hidden">
          <div style={{ animation: "statusRotate 10s ease-in-out infinite" }}>
            {[
              "consulting the archives of bad decisions...",
              "comparing you to historical figures...",
              "oh no. OH NO.",
              "preparing your verdict...",
            ].map((msg) => (
              <div
                key={msg}
                className="h-6 flex items-center justify-center font-body text-sm text-text-muted"
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
