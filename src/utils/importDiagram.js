import UmlClass from "../components/UmlClass";
import {
  createLink,
  createComposition,
  createAggregation,
  createGeneralization,
  createIntermediateClassLinks,
} from "./linkCreators";

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
  const classes = xmlDoc.getElementsByTagName("packagedElement");
  const classMap = new Map();

  const classPromises = Array.from(classes).map(async (classElement) => {
    if (classElement.getAttribute("xmi:type") === "uml:Class") {
      const className = classElement.getAttribute("name");
      const classId = classElement.getAttribute("xmi:id");

      const attributes = Array.from(
        classElement.getElementsByTagName("ownedAttribute")
      ).map(
        (attr) => `${attr.getAttribute("name")}: ${attr.getAttribute("type")}`
      );

      const methods = Array.from(
        classElement.getElementsByTagName("ownedOperation")
      ).map((method) => {
        const returnType =
          method
            .getElementsByTagName("ownedParameter")[0]
            ?.getElementsByTagName("type")[0]
            ?.getAttribute("href")
            ?.split("#")[1] || "void";
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
    }
  });

  Promise.all(classPromises).then(() => {
    // Import associations and other relationship types
    const relationships = xmlDoc.getElementsByTagName("packagedElement");
    Array.from(relationships).forEach((relationshipElement) => {
      const relationType = relationshipElement.getAttribute("xmi:type");

      if (
        relationType === "uml:Association" ||
        relationType === "uml:Generalization"
      ) {
        let sourceId, targetId, linkType;

        if (relationType === "uml:Association") {
          const memberEnds =
            relationshipElement.getElementsByTagName("memberEnd");
          sourceId = memberEnds[0]?.getAttribute("xmi:idref")?.split("_")[0];
          targetId = memberEnds[1]?.getAttribute("xmi:idref")?.split("_")[0];

          const ownedEnds =
            relationshipElement.getElementsByTagName("ownedEnd");
          const aggregation =
            ownedEnds[0]?.getAttribute("aggregation") ||
            ownedEnds[1]?.getAttribute("aggregation");

          if (aggregation === "composite") {
            linkType = "composition";
          } else if (aggregation === "shared") {
            linkType = "aggregation";
          } else {
            linkType = "association";
          }
        } else if (relationType === "uml:Generalization") {
          sourceId = relationshipElement.getAttribute("specific");
          targetId = relationshipElement.getAttribute("general");
          linkType = "generalization";
        }

        if (sourceId && targetId) {
          const sourceIds = classMap.get(sourceId);
          const targetIds = classMap.get(targetId);

          if (sourceIds && targetIds) {
            let linkId;

            switch (linkType) {
              case "generalization":
                linkId = createGeneralization(
                  sourceIds.graphId,
                  targetIds.graphId,
                  graphRef,
                  paperRef
                );
                break;
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
      } else if (relationType === "uml:AssociationClass") {
        const memberEnds =
          relationshipElement.getElementsByTagName("memberEnd");
        const sourceId = memberEnds[0]
          ?.getAttribute("xmi:idref")
          ?.split("_")[0];
        const targetId = memberEnds[1]
          ?.getAttribute("xmi:idref")
          ?.split("_")[0];
        const intermediateClassId = relationshipElement.getAttribute("xmi:id");

        if (sourceId && targetId && intermediateClassId) {
          const sourceIds = classMap.get(sourceId);
          const targetIds = classMap.get(targetId);
          const intermediateIds = classMap.get(intermediateClassId);

          if (sourceIds && targetIds && intermediateIds) {
            const { directLinkId, dashedLinkId } = createIntermediateClassLinks(
              sourceIds.graphId,
              targetIds.graphId,
              intermediateIds.graphId,
              graphRef,
              paperRef
            );

            if (directLinkId && dashedLinkId) {
              addLink(id, {
                source: sourceIds.dbId,
                target: targetIds.dbId,
                linkType: "intermediate",
                intermediateClass: intermediateIds.dbId,
              });
            }
          }
        }
      }
    });
  });
};
