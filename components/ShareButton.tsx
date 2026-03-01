"use client";

import { useState, useCallback, type RefObject } from "react";
import type { AnalyzeResponse } from "@/lib/types";

type ShareState = "idle" | "generating" | "success" | "error";

interface ShareButtonProps {
  resultData: AnalyzeResponse;
  cardRef: RefObject<HTMLDivElement | null>;
}

export default function ShareButton({ resultData, cardRef }: ShareButtonProps) {
  const [shareState, setShareState] = useState<ShareState>("idle");

  const generatePng = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    try {
      // Wait for fonts to fully load before capturing
      await document.fonts.ready;
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(cardRef.current, {
        width: 1080,
        height: 1920,
        backgroundColor: "#0f0f1a",
        pixelRatio: 1,
        skipAutoScale: true,
        style: {
          position: "static",
          left: "auto",
          top: "auto",
        },
      });
      return blob;
    } catch {
      return null;
    }
  }, [cardRef]);

  const handleShare = useCallback(async () => {
    setShareState("generating");

    try {
      const blob = await generatePng();

      if (!blob) {
        // Fallback: share text only
        const shareText = `I scored ${resultData.score}/100 on the unhinged scale. How unhinged are you? ratemyunhinged.app`;
        if (navigator.share) {
          await navigator.share({
            title: "Rate My Unhinged Decision",
            text: shareText,
          });
        } else {
          await navigator.clipboard.writeText(shareText);
        }
        setShareState("success");
        setTimeout(() => setShareState("idle"), 2000);
        return;
      }

      const file = new File(
        [blob],
        `unhinged-score-${resultData.score}.png`,
        { type: "image/png" }
      );

      // Mobile: use Web Share API with file
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Rate My Unhinged Decision",
          text: `I scored ${resultData.score}/100 on the unhinged scale. How unhinged are you?`,
        });
        setShareState("success");
        setTimeout(() => setShareState("idle"), 2000);
        return;
      }

      // Desktop: download PNG + copy URL to clipboard
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `unhinged-score-${resultData.score}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      try {
        await navigator.clipboard.writeText("https://ratemyunhinged.app");
      } catch {
        // clipboard write failed, that's okay
      }

      setShareState("success");
      setTimeout(() => setShareState("idle"), 3000);
    } catch {
      // User cancelled share or error occurred
      setShareState("idle");
    }
  }, [generatePng, resultData.score]);

  const handleDownload = useCallback(async () => {
    setShareState("generating");

    try {
      const blob = await generatePng();
      if (!blob) {
        setShareState("error");
        setTimeout(() => setShareState("idle"), 2000);
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `unhinged-score-${resultData.score}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShareState("success");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      setShareState("error");
      setTimeout(() => setShareState("idle"), 2000);
    }
  }, [generatePng, resultData.score]);

  const buttonLabel = (() => {
    switch (shareState) {
      case "generating":
        return "GENERATING...";
      case "success":
        return "✅ SHARED!";
      case "error":
        return "SHARE FAILED";
      default:
        return "📸 SHARE YOUR VERDICT";
    }
  })();

  const buttonClasses = (() => {
    const base =
      "w-full min-h-[52px] rounded-2xl font-heading text-base font-bold uppercase tracking-wide text-white transition-all duration-150 ease-out";
    if (shareState === "success") {
      return `${base} bg-success`;
    }
    if (shareState === "generating") {
      return `${base} bg-primary opacity-80 cursor-wait`;
    }
    return `${base} bg-primary hover:shadow-[0_4px_30px_rgba(255,45,85,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] active:shadow-none active:duration-[50ms]`;
  })();

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={handleShare}
        disabled={shareState === "generating"}
        className={buttonClasses}
        style={{ padding: "14px 28px" }}
      >
        {buttonLabel}
      </button>

      <button
        type="button"
        onClick={handleDownload}
        disabled={shareState === "generating"}
        className="font-body text-xs text-text-muted underline underline-offset-4 transition-colors duration-150 hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed py-1 text-center"
      >
        or download card
      </button>
    </div>
  );
}
