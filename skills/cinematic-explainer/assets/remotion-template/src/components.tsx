import React, { useEffect, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useVideoConfig,
} from "remotion";

/** Shared primitives. Every motion parameter is derived from the requested frame. */
export const clamp01 = (n: number) =>
  Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const ease = (p: number) => {
  const v = clamp01(p);
  return v * v * (3 - 2 * v);
};
export const progress = (value: number, start: number, end: number) =>
  end <= start ? Number(value >= end) : ease((value - start) / (end - start));
export const frameProgress = (
  frame: number,
  startFrame: number,
  endFrameExclusive: number,
) =>
  progress(frame, startFrame, Math.max(startFrame + 1, endFrameExclusive - 1));
const finite = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export type Project = {
  title: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  audio: string | null;
  mode: string;
  authored: boolean;
};
export function normalizeProject(input: unknown): Project {
  const p = record(input);
  const positive = (value: unknown, fallback: number) =>
    Math.max(1, Math.round(finite(value, fallback)));
  // Audio belongs under public/. Never fetch media from a remote URL during rendering.
  const rawAudio =
    typeof p.audio === "string"
      ? p.audio
          .trim()
          .replace(/^public\//, "")
          .replace(/^\/+/, "")
      : "";
  const localAudio =
    rawAudio &&
    !rawAudio.includes("..") &&
    !/^[a-z][a-z\d+.-]*:/i.test(rawAudio) &&
    !rawAudio.includes("\\")
      ? rawAudio
      : null;
  return {
    title: typeof p.title === "string" ? p.title : "Cinematic explainer",
    width: positive(p.width, 1080),
    height: positive(p.height, 1920),
    fps: Math.max(1, finite(p.fps, 30)),
    durationInFrames: positive(p.durationInFrames, 540),
    audio: localAudio,
    mode: typeof p.mode === "string" ? p.mode : "demo",
    authored: p.authored === true,
  };
}

export type ShotKind = "contrast" | "dive" | "cutaway" | "displacement";
export type Shot = {
  id: string;
  startFrame: number;
  endFrameExclusive: number;
  kind: string;
  title: string;
  action: string;
};
/** End boundaries are exclusive. Gaps hold the previous shot; overlaps choose the latest start. */
export function normalizeShots(
  input: unknown,
  durationInFrames: number,
): Shot[] {
  const rows = Array.isArray(input) ? input : record(input).shots;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, i) => {
      const s = record(row);
      const startFrame = Math.max(
        0,
        Math.min(durationInFrames - 1, Math.round(finite(s.startFrame, 0))),
      );
      const endFrameExclusive = Math.max(
        startFrame + 1,
        Math.min(
          durationInFrames,
          Math.round(finite(s.endFrameExclusive, durationInFrames)),
        ),
      );
      return {
        id: typeof s.id === "string" ? s.id : `shot-${i + 1}`,
        startFrame,
        endFrameExclusive,
        kind: typeof s.kind === "string" ? s.kind : "contrast",
        title: typeof s.title === "string" ? s.title : "",
        action: typeof s.action === "string" ? s.action : "",
      };
    })
    .sort((a, b) => a.startFrame - b.startFrame);
}
export function shotAtFrame(
  shots: Shot[],
  frame: number,
  durationInFrames: number,
): Shot {
  if (!shots.length)
    return {
      id: "draft",
      startFrame: 0,
      endFrameExclusive: durationInFrames,
      kind: "contrast",
      title: "BUILD YOUR\nEXPLANATION",
      action: "Replace this demonstration with topic-specific motion.",
    };
  const started = shots.filter((s) => frame >= s.startFrame);
  return started.length ? started[started.length - 1] : shots[0];
}

export type CaptionWord = { text: string; start: number; end: number };
export type Caption = {
  start: number;
  end: number;
  text: string;
  words: CaptionWord[];
  timingMode: "word" | "phrase";
};
/** Caption time is in seconds. Word timing must be supplied, never estimated from phrase length. */
export function normalizeCaptions(input: unknown): Caption[] {
  const rows = Array.isArray(input) ? input : record(input).captions;
  if (!Array.isArray(rows)) return [];
  return rows
    .flatMap((row) => {
      const c = record(row),
        start = Math.max(0, finite(c.start, 0)),
        end = finite(c.end, start);
      if (end <= start) return [];
      const words = Array.isArray(c.words)
        ? c.words.flatMap((value) => {
            const w = record(value),
              a = Math.max(start, finite(w.start, start)),
              b = Math.min(end, finite(w.end, end));
            return typeof w.text === "string" && b > a
              ? [{ text: w.text, start: a, end: b }]
              : [];
          })
        : [];
      const text =
        typeof c.text === "string"
          ? c.text
          : words.map((w) => w.text).join(" ");
      if (!text.trim()) return [];
      return [
        {
          start,
          end,
          text,
          words,
          timingMode:
            c.timingMode !== "phrase" && words.length
              ? ("word" as const)
              : ("phrase" as const),
        },
      ];
    })
    .sort((a, b) => a.start - b.start);
}

let bundledFonts: Promise<unknown> | undefined;
export function FontLoader() {
  const [handle] = useState(() => delayRender("Loading bundled open fonts"));
  useEffect(() => {
    if (!bundledFonts) {
      bundledFonts = Promise.all(
        [
          ["ExplainerSans", "Inter-Variable.ttf", "100 900"],
          ["ExplainerDisplay", "BarlowCondensed-Bold.ttf", "700"],
          ["ExplainerMono", "IBMPlexMono-Medium.ttf", "500"],
        ].map(async ([family, file, weight]) => {
          const face = new FontFace(
            family,
            `url("${staticFile(`fonts/${file}`)}")`,
            { weight },
          );
          try {
            await face.load();
          } catch (error) {
            throw new Error(
              `Could not load required bundled font fonts/${file}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
          document.fonts.add(face);
        }),
      );
    }
    // Typography is part of the authored layout; a fallback font invalidates review.
    bundledFonts.then(
      () => continueRender(handle),
      (error) => cancelRender(error),
    );
  }, [handle]);
  return null;
}

export function Camera({
  cx = 540,
  cy = 960,
  zoom = 1,
  tx = 540,
  ty = 960,
  children,
}: {
  cx?: number;
  cy?: number;
  zoom?: number;
  tx?: number;
  ty?: number;
  children: React.ReactNode;
}) {
  return (
    <g
      transform={`translate(${tx} ${ty}) scale(${zoom}) translate(${-cx} ${-cy})`}
    >
      {children}
    </g>
  );
}
export function Type({
  text,
  x = 80,
  y = 270,
  size = 126,
  fill = "#EEF3EF",
  align = "start",
  reveal = 1,
  mono = false,
}: {
  text: string;
  x?: number;
  y?: number;
  size?: number;
  fill?: string;
  align?: "start" | "middle" | "end";
  reveal?: number;
  mono?: boolean;
}) {
  const p = clamp01(reveal);
  return (
    <g opacity={p} transform={`translate(0 ${24 * (1 - p)})`}>
      <text
        x={x}
        y={y}
        fill={fill}
        fontFamily={
          mono ? "ExplainerMono, monospace" : "ExplainerDisplay, sans-serif"
        }
        fontSize={size}
        fontWeight={mono ? 500 : 700}
        textAnchor={align}
        letterSpacing={mono ? 2 : 0}
      >
        {text.split(/\\n|\n/).map((line, i) => (
          <tspan key={i} x={x} dy={i ? size * 0.98 : 0}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}
export function Trace({
  d,
  reveal,
  color = "#7EDFE8",
  width = 4,
}: {
  d: string;
  reveal: number;
  color?: string;
  width?: number;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - clamp01(reveal)}
    />
  );
}
export function Captions({
  captions,
  seconds,
  color = "#EEF3EF",
  accent = "#F7BC7B",
}: {
  captions: Caption[];
  seconds: number;
  color?: string;
  accent?: string;
}) {
  const { width, height } = useVideoConfig();
  const caption = captions.find((c) => seconds >= c.start && seconds < c.end);
  if (!caption) return null;
  const scale = Math.min(width / 1080, height / 1920);
  return (
    <div
      style={{
        position: "absolute",
        left: "7%",
        right: "7%",
        bottom: 110 * scale,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 900 * scale,
          textAlign: "center",
          fontFamily: "ExplainerSans, sans-serif",
          fontSize: 44 * scale,
          lineHeight: 1.28,
          fontWeight: 650,
          color,
          textShadow: "0 2px 15px rgba(0,0,0,.7)",
          padding: `${16 * scale}px ${24 * scale}px`,
          background: "rgba(4,19,31,.78)",
          borderRadius: 15 * scale,
        }}
      >
        {caption.timingMode === "word"
          ? caption.words.map((word, i) => (
              <React.Fragment key={`${i}-${word.start}`}>
                <span
                  style={{
                    color:
                      seconds >= word.start && seconds < word.end
                        ? accent
                        : color,
                  }}
                >
                  {word.text}
                </span>
                {i < caption.words.length - 1 ? " " : ""}
              </React.Fragment>
            ))
          : caption.text}
      </div>
    </div>
  );
}
