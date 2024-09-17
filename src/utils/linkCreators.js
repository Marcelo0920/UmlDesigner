import { dia, shapes, linkTools } from "jointjs";

const createLinkWithType = (sourceId, targetId, graphRef, paperRef, type) => {
  if (graphRef.current) {
    let linkAttrs = {
      line: {
        stroke: "#333333",
        strokeWidth: 2,
        targetMarker: null,
        sourceMarker: null,
      },
    };

    switch (type) {
      case "composition":
        linkAttrs.line.targetMarker = {
          type: "path",
          d: "M 20 -10 L 0 0 L 20 10 L 40 0 Z",
          fill: "#333333",
        };
        break;
      case "aggregation":
        linkAttrs.line.targetMarker = {
          type: "path",
          d: "M 20 -10 L 0 0 L 20 10 L 40 0 Z",
          fill: "white",
        };
        break;
      case "generalization":
        linkAttrs.line.targetMarker = {
          type: "path",
          d: "M 20 0 L 0 -10 L 0 10 Z",
          fill: "white",
        };
        break;
      default:
        linkAttrs.line.targetMarker = null;
    }

    const link = new shapes.standard.Link({
      source: { id: sourceId },
      target: { id: targetId },
      router: { name: "manhattan" },
      connector: { name: "rounded" },
      attrs: linkAttrs,
      labels: [
        {
          position: 0.5,
          attrs: {
            text: { text: type },
          },
        },
        {
          position: 0.1,
          attrs: {
            text: { text: "1" }, // Default source multiplicity
          },
        },
        {
          position: 0.9,
          attrs: {
            text: { text: "1" }, // Default target multiplicity
          },
        },
      ],
      linkType: type,
    });

    graphRef.current.addCell(link);

    setTimeout(() => {
      if (paperRef.current) {
        const linkView = link.findView(paperRef.current);
        if (linkView) {
          linkView.addTools(
            new dia.ToolsView({
              tools: [
                new linkTools.Vertices(),
                new linkTools.Segments(),
                new linkTools.SourceArrowhead(),
                new linkTools.TargetArrowhead(),
                new linkTools.Remove(),
              ],
            })
          );
        }
      }
    }, 100);

    return link.id;
  }
};

export const createDashedLink = (sourceId, targetId, graphRef, paperRef) => {
  if (graphRef.current) {
    const dashedLink = new shapes.standard.Link({
      source: { id: sourceId },
      target: { id: targetId },
      router: { name: "manhattan" },
      connector: { name: "rounded" },
      attrs: {
        line: {
          stroke: "#333333",
          strokeWidth: 2,
          strokeDasharray: "5 5",
          targetMarker: null,
          sourceMarker: null,
        },
      },
      linkType: "dashed",
    });
    graphRef.current.addCell(dashedLink);
    return dashedLink.id;
  }
};

export const createLink = (sourceId, targetId, graphRef, paperRef) =>
  createLinkWithType(sourceId, targetId, graphRef, paperRef, "association");

export const createComposition = (sourceId, targetId, graphRef, paperRef) =>
  createLinkWithType(sourceId, targetId, graphRef, paperRef, "composition");

export const createAggregation = (sourceId, targetId, graphRef, paperRef) =>
  createLinkWithType(sourceId, targetId, graphRef, paperRef, "aggregation");

export const createGeneralization = (sourceId, targetId, graphRef, paperRef) =>
  createLinkWithType(sourceId, targetId, graphRef, paperRef, "generalization");
