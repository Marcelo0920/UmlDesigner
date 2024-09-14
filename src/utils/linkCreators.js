import { dia } from "jointjs";

export const createDashedLink = (sourceId, targetId, graphRef) => {
  console.log("targetId   " + targetId);
  if (graphRef.current) {
    console.log("targetId   " + targetId);
    const link = new dia.Link({
      source: { id: sourceId },
      target: { id: targetId },
      attrs: {
        line: {
          stroke: "#6a6c8a",
          "stroke-width": 1,
          "stroke-dasharray": "5 5", // Dashes for the link
        },
      },
    });
    graphRef.current.addCell(link);
  }
};

export const createLink = (sourceId, targetId, graphRef) => {
  if (graphRef.current) {
    const link = new dia.Link({
      source: { id: sourceId },
      target: { id: targetId },
      attrs: {
        line: {
          stroke: "#333",
          "stroke-width": 2, // Solid line
        },
      },
    });
    graphRef.current.addCell(link);
  }
};
