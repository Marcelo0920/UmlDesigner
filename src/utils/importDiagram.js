import UmlClass from "../components/UmlClass";
import {
  createLink,
  createComposition,
  createAggregation,
  createGeneralization,
  createDependency,
  createDashedLink,
} from "./linkCreators";

import createIntermediateClass from "./createIntermediateClass";

export const importDiagram = (
  xmlContent,
  graphRef,
  paperRef,
  addClass,
  addLink,
  id
) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

  // Clear existing diagram
  graphRef.current.clear();

  // Import classes
  const classes = xmlDoc.getElementsByTagName("UML:Class");
  const classMap = new Map();

  const classPromises = Array.from(classes).map(async (classElement) => {
    const className = classElement.getAttribute("name");
    const classId = classElement.getAttribute("xmi.id");

    // Skip EARootClass
    if (className === "EARootClass") {
      return null;
    }

    const attributes = Array.from(
      classElement.getElementsByTagName("UML:Attribute")
    ).map(
      (attr) => `${attr.getAttribute("name")}: ${attr.getAttribute("type")}`
    );

    const methods = Array.from(
      classElement.getElementsByTagName("UML:Operation")
    ).map((method) => {
      const returnType = method.getAttribute("returnType") || "void";
      return `${method.getAttribute("name")}: ${returnType}`;
    });

    const position = { x: Math.random() * 500, y: Math.random() * 500 };
    const size = { width: 200, height: 100 };

    const classData = {
      name: className,
      attributes,
      methods,
      position,
      size,
    };

    try {
      const response = await addClass(id, classData);
      const newClassId = response.classes[response.classes.length - 1]._id;

      const umlClass = new UmlClass({
        position,
        size,
        name: className,
        attributes,
        methods,
      });

      graphRef.current.addCell(umlClass);
      classMap.set(classId, { graphId: umlClass.id, dbId: newClassId });

      return { xmlId: classId, graphId: umlClass.id, dbId: newClassId };
    } catch (error) {
      console.error("Error adding class:", error);
    }
  });

  Promise.all(classPromises).then(() => {
    // Import associations and other relationship types
    const relationships = [
      ...xmlDoc.getElementsByTagName("UML:Association"),
      ...xmlDoc.getElementsByTagName("UML:Generalization"),
      ...xmlDoc.getElementsByTagName("UML:Dependency"),
      ...xmlDoc.getElementsByTagName("UML:Composition"),
      ...xmlDoc.getElementsByTagName("UML:Aggregation"),
      ...xmlDoc.getElementsByTagName("UML:AssociationClass"),
    ];

    relationships.forEach((relationshipElement) => {
      let sourceId, targetId, linkType, intermediateClassId;

      console.log(relationshipElement);

      switch (relationshipElement.tagName) {
        case "UML:Association":
          const sourceEnd =
            relationshipElement.getElementsByTagName("UML:AssociationEnd")[0];
          const targetEnd =
            relationshipElement.getElementsByTagName("UML:AssociationEnd")[1];

          if (sourceEnd && targetEnd) {
            sourceId = sourceEnd.getAttribute("type");
            targetId = targetEnd.getAttribute("type");

            if (
              relationshipElement.getAttribute("name") == "IntermediateClass"
            ) {
              linkType = "intermediate";
            }
            linkType = "association";

            const sourceAggregation = sourceEnd.getAttribute("aggregation");
            const targetAggregation = targetEnd.getAttribute("aggregation");

            if (
              sourceAggregation === "composite" ||
              targetAggregation === "composite"
            ) {
              linkType = "composition";
              // Swap source and target for composition
              [sourceId, targetId] = [targetId, sourceId];
            } else if (
              sourceAggregation === "shared" ||
              targetAggregation === "shared"
            ) {
              linkType = "aggregation";
              // Swap source and target for aggregation
              [sourceId, targetId] = [targetId, sourceId];
            }
          }
          break;

        case "UML:Generalization":
          sourceId = relationshipElement.getAttribute("subtype");
          targetId = relationshipElement.getAttribute("supertype");
          linkType = "generalization";
          break;

        case "UML:Dependency":
          sourceId = relationshipElement.getAttribute("client");
          targetId = relationshipElement.getAttribute("supplier");
          linkType = "dependency";
          break;

        case "UML:Composition":
          // Swap source and target for composition
          targetId = relationshipElement.getAttribute("whole");
          sourceId = relationshipElement.getAttribute("part");
          linkType = "composition";
          break;

        case "UML:Aggregation":
          // Swap source and target for aggregation
          targetId = relationshipElement.getAttribute("whole");
          sourceId = relationshipElement.getAttribute("part");
          linkType = "aggregation";
          break;

        case "UML:AssociationClass":
          const associationEnds =
            relationshipElement.getElementsByTagName("UML:AssociationEnd");
          sourceId = associationEnds[0]?.getAttribute("type");
          targetId = associationEnds[1]?.getAttribute("type");
          intermediateClassId = relationshipElement.getAttribute("xmi.id");
          linkType = "associationClass";
          break;
      }

      if (sourceId && targetId) {
        const sourceIds = classMap.get(sourceId);
        const targetIds = classMap.get(targetId);

        if (sourceIds && targetIds) {
          let linkId;

          console.log(linkType);
          if (linkType === "intermediate") {
            linkId = createDashedLink(
              sourceIds.graphId,
              targetIds.graphId,
              graphRef,
              paperRef
            );
          }
          if (linkType === "associationClass") {
            const intermediateClassInfo = createIntermediateClass(
              sourceIds.graphId,
              targetIds.graphId,
              graphRef,
              paperRef,
              idMappingRef,
              id
            );

            if (intermediateClassInfo) {
              addLink(id, intermediateClassInfo);
            }
          } else {
            switch (linkType) {
              case "composition":
                linkId = createComposition(
                  sourceIds.graphId,
                  targetIds.graphId,
                  graphRef,
                  paperRef
                );
                break;
              case "aggregation":
                linkId = createAggregation(
                  sourceIds.graphId,
                  targetIds.graphId,
                  graphRef,
                  paperRef
                );
                break;
              case "generalization":
                linkId = createGeneralization(
                  sourceIds.graphId,
                  targetIds.graphId,
                  graphRef,
                  paperRef
                );
                break;
              case "dependency":
                linkId = createDependency(
                  sourceIds.graphId,
                  targetIds.graphId,
                  graphRef,
                  paperRef
                );
                break;
              default:
                linkId = createLink(
                  sourceIds.graphId,
                  targetIds.graphId,
                  graphRef,
                  paperRef
                );
            }

            if (linkId) {
              addLink(id, {
                source: sourceIds.dbId,
                target: targetIds.dbId,
                linkType: linkType,
              });
            }
          }
        }
      }
    });
  });
};
