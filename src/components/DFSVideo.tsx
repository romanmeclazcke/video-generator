import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { useAudioEffect } from "../hooks/useAudioEffect";

export const dfsVideoSchema = z.object({});

// Define the graph structure
type Node = {
  id: string;
  x: number;
  y: number;
  label: string;
};

type Edge = {
  from: string;
  to: string;
};

// Centered and more spaced nodes
const nodes: Node[] = [
  { id: "A", x: 540, y: 550, label: "A" },
  { id: "B", x: 320, y: 750, label: "B" },
  { id: "C", x: 760, y: 750, label: "C" },
  { id: "D", x: 200, y: 950, label: "D" },
  { id: "E", x: 440, y: 950, label: "E" },
  { id: "F", x: 760, y: 950, label: "F" },
];

const edges: Edge[] = [
  { from: "A", to: "B" },
  { from: "A", to: "C" },
  { from: "B", to: "D" },
  { from: "B", to: "E" },
  { from: "C", to: "F" },
];

// DFS traversal order
const dfsOrder = ["A", "B", "D", "E", "C", "F"];

// Explanations for each step in Spanish
const dfsExplanations: { [key: string]: string } = {
  "A": "Iniciamos DFS desde el nodo raíz A",
  "B": "Visitamos B, primer hijo de A (más a la izquierda)",
  "D": "Visitamos D, primer hijo de B",
  "E": "Retrocedemos a B y visitamos E, siguiente hijo",
  "C": "Retrocedemos a A y visitamos C, siguiente hijo",
  "F": "Visitamos F, hijo de C",
};

// Audio component for each node visit
const NodeAudioEffect: React.FC<{ nodeId: string; frame: number; startFrame: number }> = ({
  nodeId,
  frame,
  startFrame,
}) => {
  const index = dfsOrder.indexOf(nodeId);
  const shouldPlay = frame === startFrame;

  // Different frequencies for different nodes (creates a musical pattern)
  const frequencies = [523, 587, 659, 698, 784, 880]; // C5, D5, E5, F5, G5, A5
  const frequency = frequencies[index % frequencies.length];

  useAudioEffect(shouldPlay, {
    frequency,
    duration: 0.3,
    type: "sine",
    volume: 0.2,
  });

  return null;
};

export const DFSVideo: React.FC<z.infer<typeof dfsVideoSchema>> = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in/out
  const fadeInFrames = 15;
  const fadeOutFrames = 15;
  const opacity = interpolate(
    frame,
    [0, fadeInFrames, durationInFrames - fadeOutFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  // Title animation
  const titleScale = spring({
    frame: frame,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const titleOpacity = interpolate(frame, [0, 30, 90, 120], [0, 1, 1, 0]);
  const titleY = interpolate(frame, [0, 30], [-100, 100], {
    extrapolateRight: "clamp",
  });

  // Each node appears and gets visited
  const framesPerNode = 80;
  const startAnimationFrame = 120;

  const getNodeState = (nodeId: string, currentFrame: number) => {
    const index = dfsOrder.indexOf(nodeId);
    const nodeStartFrame = startAnimationFrame + index * framesPerNode;
    const nodeEndFrame = nodeStartFrame + framesPerNode;

    if (currentFrame < nodeStartFrame) {
      return "unvisited";
    } else if (currentFrame >= nodeStartFrame && currentFrame < nodeEndFrame) {
      return "visiting";
    } else {
      return "visited";
    }
  };

  const getNodeStyle = (nodeId: string, state: string) => {
    const baseStyle = {
      width: 100,
      height: 100,
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: 40,
      fontWeight: "bold",
      border: "5px solid",
      transition: "all 0.3s ease",
    };

    if (state === "unvisited") {
      return {
        ...baseStyle,
        backgroundColor: "#f3f4f6",
        borderColor: "#9ca3af",
        color: "#6b7280",
      };
    } else if (state === "visiting") {
      return {
        ...baseStyle,
        backgroundColor: "#fbbf24",
        borderColor: "#f59e0b",
        color: "#fff",
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: "#10b981",
        borderColor: "#059669",
        color: "#fff",
      };
    }
  };

  const getNodeAnimation = (nodeId: string, currentFrame: number) => {
    const index = dfsOrder.indexOf(nodeId);
    const nodeStartFrame = startAnimationFrame + index * framesPerNode;
    const state = getNodeState(nodeId, currentFrame);

    // Scale animation when visiting
    if (state === "visiting") {
      const progress = (currentFrame - nodeStartFrame) / framesPerNode;
      const scale = spring({
        frame: currentFrame - nodeStartFrame,
        fps,
        config: {
          damping: 10,
          stiffness: 200,
          mass: 0.5,
        },
      });
      return {
        transform: `scale(${1 + scale * 0.3})`,
        zIndex: 100,
      };
    } else if (state === "visited") {
      return {
        transform: "scale(1)",
        zIndex: 1,
      };
    }

    // Initial pop-in animation
    const appearFrame = Math.max(0, nodeStartFrame - 20);
    if (currentFrame < appearFrame) {
      return {
        transform: "scale(0)",
        opacity: 0,
      };
    }

    const appearProgress = spring({
      frame: currentFrame - appearFrame,
      fps,
      config: {
        damping: 20,
        stiffness: 200,
      },
    });

    return {
      transform: `scale(${appearProgress})`,
      opacity: appearProgress,
    };
  };

  const getEdgeOpacity = (edge: Edge, currentFrame: number) => {
    const fromState = getNodeState(edge.from, currentFrame);
    const toState = getNodeState(edge.to, currentFrame);

    if (fromState === "unvisited") return 0.2;
    if (toState === "visiting") return 1;
    if (toState === "visited") return 0.6;
    return 0.3;
  };

  const getEdgeColor = (edge: Edge, currentFrame: number) => {
    const toState = getNodeState(edge.to, currentFrame);
    if (toState === "visiting") return "#f59e0b";
    if (toState === "visited") return "#10b981";
    return "#d1d5db";
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1e293b",
        opacity,
      }}
    >
      {/* Social handle */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 230,
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          borderRadius: 12,
          border: "1px solid rgba(148, 163, 184, 0.35)",
          zIndex: 250,
        }}
      >
        <Img
          src={staticFile("instagram-gray.svg")}
          style={{
            width: 36,
            height: 36,
          }}
        />
        <span
          style={{
            color: "#9ca3af",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 0.4,
          }}
        >
          mentesprogramadoras
        </span>
      </div>
      {/* Audio effects for each node */}
      {dfsOrder.map((nodeId, index) => {
        const nodeStartFrame = startAnimationFrame + index * framesPerNode;
        return (
          <NodeAudioEffect
            key={`audio-${nodeId}`}
            nodeId={nodeId}
            frame={frame}
            startFrame={nodeStartFrame}
          />
        );
      })}

      {/* Title */}
      {titleOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: titleY,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: titleOpacity,
            zIndex: 200,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: "bold",
              color: "#fff",
              backgroundColor: "#3b82f6",
              padding: "20px 60px",
              borderRadius: 20,
              transform: `scale(${titleScale})`,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            DFS Algorithm
          </div>
        </div>
      )}

      {/* Graph visualization */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Draw edges */}
        <svg
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {edges.map((edge, index) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            return (
              <line
                key={index}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={getEdgeColor(edge, frame)}
                strokeWidth={8}
                opacity={getEdgeOpacity(edge, frame)}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Draw nodes */}
        {nodes.map((node) => {
          const state = getNodeState(node.id, frame);
          const animation = getNodeAnimation(node.id, frame);

          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: node.x - 50,
                top: node.y - 50,
                ...getNodeStyle(node.id, state),
                ...animation,
              }}
            >
              {node.label}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {frame > startAnimationFrame && (
        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 35,
                height: 35,
                borderRadius: "50%",
                backgroundColor: "#f3f4f6",
                border: "3px solid #9ca3af",
              }}
            />
            <span style={{ color: "#fff", fontSize: 22 }}>No visitado</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 35,
                height: 35,
                borderRadius: "50%",
                backgroundColor: "#fbbf24",
                border: "3px solid #f59e0b",
              }}
            />
            <span style={{ color: "#fff", fontSize: 22 }}>Visitando</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 35,
                height: 35,
                borderRadius: "50%",
                backgroundColor: "#10b981",
                border: "3px solid #059669",
              }}
            />
            <span style={{ color: "#fff", fontSize: 22 }}>Visitado</span>
          </div>
        </div>
      )}

      {/* DFS Order Display */}
      {frame > startAnimationFrame && (
        <div
          style={{
            position: "absolute",
            top: 200,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 15,
          }}
        >
          <span style={{ color: "#fff", fontSize: 30, fontWeight: "bold" }}>
            Orden DFS:
          </span>
          {dfsOrder.map((nodeId, index) => {
            const nodeStartFrame = startAnimationFrame + index * framesPerNode;
            const isVisible = frame >= nodeStartFrame;
            const isActive = frame >= nodeStartFrame && frame < nodeStartFrame + framesPerNode;

            if (!isVisible) return null;

            return (
              <span
                key={nodeId}
                style={{
                  color: isActive ? "#fbbf24" : "#10b981",
                  fontSize: isActive ? 38 : 30,
                  fontWeight: "bold",
                  transition: "all 0.3s",
                }}
              >
                {nodeId}
                {index < dfsOrder.length - 1 ? " →" : ""}
              </span>
            );
          })}
        </div>
      )}

      {/* Current Step Explanation */}
      {frame > startAnimationFrame && (
        <div
          style={{
            position: "absolute",
            bottom: 150,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: 60,
            paddingRight: 60,
          }}
        >
          {dfsOrder.map((nodeId, index) => {
            const nodeStartFrame = startAnimationFrame + index * framesPerNode;
            const isActive = frame >= nodeStartFrame && frame < nodeStartFrame + framesPerNode;

            if (!isActive) return null;

            return (
              <div
                key={`explanation-${nodeId}`}
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.9)",
                  padding: "20px 40px",
                  borderRadius: 15,
                  textAlign: "center",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                }}
              >
                <span style={{ color: "#fff", fontSize: 28, fontWeight: "600", lineHeight: "36px" }}>
                  {dfsExplanations[nodeId]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};
