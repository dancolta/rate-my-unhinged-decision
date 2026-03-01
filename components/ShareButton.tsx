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
      const domtoimage = await import("dom-to-image-more");
      const dataUrl = await domtoimage.toPng(cardRef.current, {
        width: 1080,
        height: 1920,
        cacheBust: true,
        bgcolor: "#0D0D0F",
      });
      const response = await fetch(dataUrl);
      return await response.blob();
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
        return "SHARED";
      case "error":
        return "SHARE FAILED";
      default:
        return "SHARE YOUR VERDICT";
    }
  })();

  const buttonClasses = (() => {
    const base =
      "w-full min-h-[48px] lg:min-h-[52px] rounded-xl font-heading text-base font-bold uppercase tracking-[0.1em] text-text-primary transition-all duration-150 ease-out";
    if (shareState === "success") {
      return `${base} bg-success`;
    }
    if (shareState === "generating") {
      return `${base} bg-primary opacity-80 cursor-wait`;
    }
    return `${base} bg-primary hover:bg-[#E63535] hover:-translate-y-px hover:shadow-[0_4px_24px_rgba(255,59,59,0.3)] active:translate-y-0 active:scale-[0.97] active:shadow-none active:duration-[50ms]`;
  })();

  return (
    <div className="flex flex-col gap-2 items-center">
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
        className="font-body text-sm text-text-secondary underline underline-offset-4 transition-colors duration-150 hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center"
      >
        download card
      </button>
    </div>
  );
}
