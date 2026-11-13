import React from "react";
import { Composition } from "remotion";
import { Film, project } from "./Film";

export const Root = () => (
  <Composition
    id="Explainer"
    component={Film}
    width={project.width}
    height={project.height}
    fps={project.fps}
    durationInFrames={project.durationInFrames}
  />
);
