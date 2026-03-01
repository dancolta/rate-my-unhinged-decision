"use client";

import { useState, useCallback, type RefObject } from "react";
import type { AnalyzeResponse } from "@/lib/types";

type ShareState = "idle" | "generating" | "success" | "error" | "saved";

interface ShareButtonProps {
  resultData: AnalyzeResponse;
  cardRef: RefObject<HTMLDivElement | null>;
}

export default function ShareButton({ resultData, cardRef }: ShareButtonProps) {
  const [shareState, setShareState] = useState<ShareState>("idle");

  const generatePng = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    try {
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

  const downloadBlob = useCallback(
    (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `unhinged-score-${resultData.score}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [resultData.score]
  );

  const handleInstagramStory = useCallback(async () => {
    setShareState("generating");

    try {
      const blob = await generatePng();

      if (!blob) {
        setShareState("error");
        setTimeout(() => setShareState("idle"), 2000);
        return;
      }

      const file = new File(
        [blob],
        `unhinged-score-${resultData.score}.png`,
        { type: "image/png" }
      );

      // Mobile with Web Share API file support — native share sheet includes Instagram
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

      // Desktop / unsupported: download image + show instruction
      downloadBlob(blob);
      setShareState("saved");
      setTimeout(() => setShareState("idle"), 4000);
    } catch {
      // User cancelled native share sheet
      setShareState("idle");
    }
  }, [generatePng, resultData.score, downloadBlob]);

  const handleDownload = useCallback(async () => {
    setShareState("generating");

    try {
      const blob = await generatePng();
      if (!blob) {
        setShareState("error");
        setTimeout(() => setShareState("idle"), 2000);
        return;
      }

      downloadBlob(blob);
      setShareState("success");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      setShareState("error");
      setTimeout(() => setShareState("idle"), 2000);
    }
  }, [generatePng, downloadBlob]);

  const buttonLabel = (() => {
    switch (shareState) {
      case "generating":
        return "GENERATING...";
      case "success":
        return "SHARED!";
      case "saved":
        return "SAVED! OPEN IG \u2192 STORY";
      case "error":
        return "SHARE FAILED";
      default:
        return "POST TO IG STORY";
    }
  })();

  const buttonClasses = (() => {
    const base =
      "w-full min-h-[52px] rounded-2xl font-heading text-base font-bold uppercase tracking-wide text-white transition-all duration-150 ease-out";
    if (shareState === "success") {
      return `${base} bg-success`;
    }
    if (shareState === "saved") {
      return `${base} bg-[#E1306C]`;
    }
    if (shareState === "generating") {
      return `${base} bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] opacity-80 cursor-wait`;
    }
    return `${base} bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:shadow-[0_4px_30px_rgba(225,48,108,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] active:shadow-none active:duration-[50ms]`;
  })();

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={handleInstagramStory}
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
