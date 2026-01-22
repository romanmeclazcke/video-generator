import "./index.css";
import { Composition, getStaticFiles } from "remotion";
import { AIVideo, aiVideoSchema } from "./components/AIVideo";
import { DFSVideo, dfsVideoSchema } from "./components/DFSVideo";
import { FPS, INTRO_DURATION } from "./lib/constants";
import { getTimelinePath, loadTimelineFromFile } from "./lib/utils";

export const RemotionRoot: React.FC = () => {
  const staticFiles = getStaticFiles();
  const timelines = staticFiles
    .filter((file) => file.name.endsWith("timeline.json"))
    .map((file) => file.name.split("/")[1]);

  return (
    <>
      <Composition
        id="DFS-Algorithm"
        component={DFSVideo}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={600}
        schema={dfsVideoSchema}
        defaultProps={{}}
      />
      {timelines.map((storyName) => (
        <Composition
          id={storyName}
          component={AIVideo}
          fps={FPS}
          width={1080}
          height={1920}
          schema={aiVideoSchema}
          defaultProps={{
            timeline: null,
          }}
          calculateMetadata={async ({ props }) => {
            const { lengthFrames, timeline } = await loadTimelineFromFile(
              getTimelinePath(storyName),
            );

            return {
              durationInFrames: lengthFrames + INTRO_DURATION,
              props: {
                ...props,
                timeline,
              },
            };
          }}
        />
      ))}
    </>
  );
};
