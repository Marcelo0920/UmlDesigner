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
          d: "M 20 -10 L 0 0 L 20 10 L 20 0 Z",
          fill: "white",
        };
        break;

      case "dependency":
        linkAttrs.line.targetMarker = {
          type: "path",
          d: "M 20 -10 L 0 0 L 20 10 L 0 0 Z",
          fill: "white",
        };
        break;
      default:
        linkAttrs.line.targetMarker = null;
    }

    let link;

    if (type == "dependency") {
      link = new shapes.standard.Link({
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
            targetMarker: {
              type: "path",
              d: "M 20 -10 L 0 0 L 20 10 L 0 0 Z",
              fill: "white",
            },
          },
        },
        labels: [
          {
            position: 0.5,
            attrs: {
              text: { text: type },
            },
          },
        ],
        linkType: type,
      });
    } else {
      link = new shapes.standard.Link({
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
              text: { text: "1..1" }, // Default source multiplicity
            },
          },
          {
            position: 0.9,
            attrs: {
              text: { text: "1..1" }, // Default target multiplicity
            },
          },
        ],
        linkType: type,
      });
    }

    graphRef.current.addCell(link);

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
  return null;
};

export const createIntermediateClassLinks = (
  sourceId,
  targetId,
  intermediateId,
  graphRef,
  paperRef
) => {
  if (graphRef.current) {
    // Create the direct link between source and target
    const directLinkId = createLink(sourceId, targetId, graphRef, paperRef);

    // Create the dashed link from the direct link to the intermediate class
    const dashedLinkId = createDashedLink(
      directLinkId,
      intermediateId,
      graphRef,
      paperRef
    );

    return { directLinkId, dashedLinkId };
  }
  return { directLinkId: null, dashedLinkId: null };
};

export const createLink = (sourceId, targetId, graphRef, paperRef) => {
  const linkId = createLinkWithType(
    sourceId,
    targetId,
    graphRef,
    paperRef,
    "association"
  );
  const link = graphRef.current.getCell(linkId);
  if (link && !graphRef.current.getCell(linkId)) {
    graphRef.current.addCell(link);
  }
  return linkId;
};

export const createComposition = (sourceId, targetId, graphRef, paperRef) => {
  return createLinkWithType(
    sourceId,
    targetId,
    graphRef,
    paperRef,
    "composition"
  );
};

export const createAggregation = (sourceId, targetId, graphRef, paperRef) => {
  return createLinkWithType(
    sourceId,
    targetId,
    graphRef,
    paperRef,
    "aggregation"
  );
};

export const createGeneralization = (
  sourceId,
  targetId,
  graphRef,
  paperRef
) => {
  console.log("calling here");
  return createLinkWithType(
    sourceId,
    targetId,
    graphRef,
    paperRef,
    "generalization"
  );
};

export const createDependency = (sourceId, targetId, graphRef, paperRef) => {
  return createLinkWithType(
    sourceId,
    targetId,
    graphRef,
    paperRef,
    "dependency"
  );
};
