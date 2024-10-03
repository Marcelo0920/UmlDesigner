import { dia, elementTools } from "jointjs";
import UmlClass from "../components/UmlClass";
import { createDashedLink, createLink } from "./linkCreators";

const createIntermediateClass = (
  source,
  target,
  graphRef,
  paperRef,
  idMappingRef,
  projectId
) => {
  if (graphRef.current && paperRef.current) {
    const sourceCell = graphRef.current.getCell(source);
    const targetCell = graphRef.current.getCell(target);

    const sourcePosition = sourceCell.attributes.position;
    const targetPosition = targetCell.attributes.position;
    const midX = (sourcePosition.x + targetPosition.x) / 2;
    const midY = (sourcePosition.y + targetPosition.y) / 2;

    // Create new intermediate class
    const intermediateClass = new UmlClass({
      position: { x: midX, y: midY + 100 },
      size: { width: 200, height: 100 },
      name: "IntermediateClass",
      attributes: [],
      methods: [],
    });
    graphRef.current.addCell(intermediateClass);

    // Create the direct link between source and target
    const directLinkId = createLink(
      sourceCell.id,
      targetCell.id,
      graphRef,
      paperRef
    );

    // Create the dashed link to the intermediate class
    const dashedLinkId = createDashedLink(
      directLinkId,
      intermediateClass.id,
      graphRef,
      paperRef
    );

    // Add removal tool to the intermediate class
    const elementView = intermediateClass.findView(paperRef.current);
    elementView.addTools(
      new dia.ToolsView({
        tools: [new elementTools.Remove({ offset: { x: 10, y: 10 } })],
      })
    );

    // Find MongoDB IDs for source and target
    const sourceMongoId = Object.keys(idMappingRef.current).find(
      (key) => idMappingRef.current[key] === sourceCell.id
    );
    const targetMongoId = Object.keys(idMappingRef.current).find(
      (key) => idMappingRef.current[key] === targetCell.id
    );

    return {
      source: sourceMongoId,
      target: targetMongoId,
      linkType: "intermediate",
      intermediateClass: {
        name: intermediateClass.get("name"),
        attributes: intermediateClass.get("attributes"),
        methods: intermediateClass.get("methods"),
        position: intermediateClass.position(),
        size: intermediateClass.size(),
      },
      directLinkId,
      dashedLinkId,
      intermediateClassId: intermediateClass.id,
    };
  }
};
export default createIntermediateClass;
