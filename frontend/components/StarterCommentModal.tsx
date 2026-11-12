"use client";

import { useState } from "react";
import { copyToClipboard } from "../utils/clipboard";

interface StarterCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTech?: string;
}

export default function StarterCommentModal({
  isOpen,
  onClose,
  defaultTech = "TypeScript",
}: StarterCommentModalProps) {
  const [tech, setTech] = useState(defaultTech);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickClaimComment = `Hi! I would love to work on this issue. I have experience with ${tech} and would appreciate the opportunity to contribute. Could you please assign this to me?`;

  const detailedOfferComment = `Hi! I'm interested in contributing a fix for this issue. I have background in ${tech} and would be glad to help. Are there any specific guidelines, branch conventions, or tests I should keep in mind before opening a PR?`;

  const handleCopy = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl border border-white/10 bg-[#0b0e17] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💬</span>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              Starter Contribution Comments
            </h3>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 overflow-y-auto p-6">
          <p className="text-xs leading-relaxed text-gray-400">
            Unsure what to write when asking for an issue assignment? Pick a template below, customize your technology or skill, and copy it directly to your clipboard.
          </p>

          <div>
            <label className="text-xs font-medium text-gray-300">
              Your Primary Skill / Technology:
            </label>
            <input
              type="text"
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              placeholder="e.g. Python, React, Go, Documentation"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500/50"
            />
          </div>

          {/* Template 1 */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Direct Claim Template
              </span>
              <button
                onClick={() => handleCopy(quickClaimComment, "claim")}
                className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20"
              >
                {copiedType === "claim" ? "✓ Copied!" : "Copy Comment"}
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-300 font-mono bg-black/20 p-3 rounded-xl border border-white/5">
              {quickClaimComment}
            </p>
          </div>

          {/* Template 2 */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Detailed / Guidelines Inquiring Template
              </span>
              <button
                onClick={() => handleCopy(detailedOfferComment, "detailed")}
                className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20"
              >
                {copiedType === "detailed" ? "✓ Copied!" : "Copy Comment"}
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-300 font-mono bg-black/20 p-3 rounded-xl border border-white/5">
              {detailedOfferComment}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
