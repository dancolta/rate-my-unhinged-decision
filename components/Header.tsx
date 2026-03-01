"use client";

export default function Header() {
  return (
    <header className="text-center">
      {/* Animated Logo */}
      <div
        className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full mb-2 md:mb-4"
        style={{
          animation: "logoFloat 4s ease-in-out infinite",
        }}
      >
        <span
          className="text-[52px] leading-none"
          style={{
            animation: "logoTextWobble 4s ease-in-out infinite",
            filter: "drop-shadow(0 0 20px rgba(255, 45, 85, 0.4))",
          }}
        >
          🤯
        </span>
      </div>

      <h1 className="font-heading font-bold uppercase leading-[1.05] text-text-primary">
        <span className="lg:hidden text-[28px]" style={{ letterSpacing: "-0.02em" }}>
          Rate My<br />
          <span className="text-primary" style={{ fontSize: "1.15em", display: "inline-block", transform: "rotate(-2deg)" }}>
            Unhinged
          </span>
          <br />Decision
        </span>
        <span className="hidden lg:inline text-[42px]" style={{ letterSpacing: "-0.02em" }}>
          Rate My{" "}
          <span className="text-primary" style={{ display: "inline-block", transform: "rotate(-2deg)" }}>
            Unhinged
          </span>
          {" "}Decision
        </span>
      </h1>

      {/* Animated tagline */}
      <div className="mt-1 md:mt-2 flex justify-center gap-1.5 font-body text-xs md:text-sm text-text-secondary">
        <span
          className="inline-block"
          style={{ animation: "taglinePop 3s ease-in-out infinite" }}
        >
          confess.
        </span>
        <span
          className="inline-block text-primary font-semibold"
          style={{
            animation: "taglinePop 3s ease-in-out infinite",
            animationDelay: "0.5s",
          }}
        >
          get judged.
        </span>
        <span
          className="inline-block"
          style={{
            animation: "taglinePop 3s ease-in-out infinite",
            animationDelay: "1s",
          }}
        >
          share the damage.
        </span>
      </div>
    </header>
  );
}
