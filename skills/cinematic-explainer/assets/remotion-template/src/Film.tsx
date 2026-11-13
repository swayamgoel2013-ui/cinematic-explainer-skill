import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import projectData from "../project.json";
import shotData from "../shots.json";
import captionData from "../captions.json";
import {
  HeroShip,
  HeroNail,
  NailVolume,
  Ocean,
  WATERLINE as W,
} from "./art/waterline";
import {
  Camera,
  Captions,
  FontLoader,
  Type,
  mix,
  normalizeCaptions,
  normalizeProject,
  normalizeShots,
  progress,
  shotAtFrame,
} from "./components";

export const project = normalizeProject(projectData);
const shots = normalizeShots(shotData, project.durationInFrames);
const captions = normalizeCaptions(captionData);

/**
 * Demo only: replace this shot renderer with the subject's own causal animation.
 * The artwork is composed for a 1080×1920 portrait stage. A 16:9 or 1:1 project
 * setting fits this stage with empty margins; it does not redesign the framing.
 * For another aspect ratio, author a matching viewBox, camera anchors, type,
 * and caption positions instead of merely changing the output dimensions.
 */
export function Film() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const seconds = frame / fps;
  const shot = shotAtFrame(shots, frame, durationInFrames);
  const localFrame = Math.max(0, frame - shot.startFrame);
  const length = Math.max(1, shot.endFrameExclusive - shot.startFrame);
  const p = Math.min(1, localFrame / Math.max(1, length - 1));
  const local = localFrame / fps;
  const reveal = progress(local, 0, 0.4);
  const isDive = shot.kind === "dive";
  const isCutaway = shot.kind === "cutaway";
  const isDisplacement = shot.kind === "displacement";
  const title =
    shot.title ||
    (isDive
      ? "SAME VOLUME.\nDIFFERENT MASS."
      : isCutaway
        ? "HOLLOW HULL.\nDRY INTERIOR."
        : isDisplacement
          ? "MORE LOAD.\nMORE DISPLACEMENT."
          : "SAME STEEL.\nDIFFERENT RESULT.");
  const worldWaterY = isDisplacement ? 1220 : 1200;
  const shipY = isDisplacement
    ? mix(1080, 1140, progress(p, 0.32, 0.84))
    : 1100;
  const shipScale = 0.94;
  return (
    <AbsoluteFill style={{ backgroundColor: W.night }}>
      <FontLoader />
      <svg
        viewBox="0 0 1080 1920"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        <rect width={1080} height={1920} fill={W.night} />
        {isDive ? (
          <>
            <Ocean
              y={490}
              height={1430}
              t={seconds}
              deep
              surfaceAmplitude={5}
            />
            <Camera
              cx={540}
              cy={1100}
              zoom={mix(1, 1.09, progress(p, 0, 1))}
              tx={540}
              ty={1050}
            >
              <HeroNail
                x={330}
                y={mix(880, 1240, progress(p, 0.05, 0.8))}
                scale={1.22}
                t={seconds}
                outline
              />
              <NailVolume
                x={750}
                y={1240}
                scale={1.22}
                t={seconds}
                outline
                opacity={progress(p, 0.32, 0.58)}
              />
              <Type
                text="STEEL"
                x={330}
                y={1610}
                size={36}
                align="middle"
                mono
                reveal={progress(p, 0.1, 0.3)}
              />
              <Type
                text="EQUAL VOLUME\nOF WATER"
                x={750}
                y={1590}
                size={31}
                align="middle"
                mono
                fill={W.cyan}
                reveal={progress(p, 0.5, 0.72)}
              />
            </Camera>
          </>
        ) : isCutaway || isDisplacement ? (
          <>
            <Camera
              cx={540}
              cy={1100}
              zoom={mix(1, 1.065, progress(p, 0, 1))}
              tx={540}
              ty={1100}
            >
              <Ocean
                y={worldWaterY}
                height={1920 - worldWaterY}
                t={seconds}
                surfaceAmplitude={0}
              />
              <HeroShip
                x={540}
                y={shipY}
                scale={shipScale}
                t={seconds}
                load={isDisplacement ? progress(p, 0.02, 0.53) : 0}
                bob={0}
                wake={false}
                cutaway={isCutaway ? progress(p, 0.15, 0.64) : 1}
                displaced={isDisplacement ? progress(p, 0.13, 0.45) : 0}
                waterlineY={(worldWaterY - shipY) / shipScale}
                dryLabel
              />
            </Camera>
            {isDisplacement && (
              <Type
                text="WATER DISPLACED"
                x={540}
                y={1530}
                size={39}
                align="middle"
                mono
                fill={W.cyan}
                reveal={progress(p, 0.35, 0.62)}
              />
            )}
          </>
        ) : (
          <>
            <Ocean y={1200} height={720} t={seconds} />
            <HeroShip
              x={mix(615, 520, progress(p, 0, 1))}
              y={1070}
              scale={0.94}
              t={seconds}
              load={0}
              bob={4}
            />
            <HeroNail
              x={800}
              y={mix(1330, 1530, progress(p, 0.08, 1))}
              scale={0.65}
              rotation={mix(-16, -4, progress(p, 0, 1))}
              t={seconds}
            />
          </>
        )}
        <Type
          text={title}
          x={80}
          y={260}
          size={isDisplacement ? 114 : 126}
          reveal={reveal}
        />
        <rect
          x={82}
          y={90}
          width={44 + 76 * progress(p, 0, 0.7)}
          height={7}
          rx={3}
          fill={W.coral}
        />
      </svg>
      <Captions captions={captions} seconds={seconds} />
      {project.audio && <Audio src={staticFile(project.audio)} />}
    </AbsoluteFill>
  );
}
