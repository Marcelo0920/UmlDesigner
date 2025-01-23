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

  console.log(xmlDoc);

  // Clear existing diagram
  graphRef.current.clear();

  // Handle namespaces properly
  const nsUML = "http://www.eclipse.org/uml2/5.0.0/UML";

  // Find all packagedElements that are of type uml:Class
  const classes = xmlDoc.getElementsByTagNameNS(nsUML, "Class");
  if (!classes.length) {
    // Fallback to looking for packagedElement with xmi:type="uml:Class"
    const packagedElements = xmlDoc.getElementsByTagName("packagedElement");
    const classElements = Array.from(packagedElements).filter(
      (element) => element.getAttribute("xmi:type") === "uml:Class"
    );
    console.log("Found classes using fallback method:", classElements.length);
    processClasses(classElements);
  } else {
    console.log("Found classes using namespace:", classes.length);
    processClasses(classes);
  }

  function processClasses(classElements) {
    const classMap = new Map();
    const classPromises = Array.from(classElements).map(
      async (classElement) => {
        const className = classElement.getAttribute("name");
        const classId =
          classElement.getAttribute("xmi:id") ||
          classElement.getAttribute("xmi.id");

        // Skip EARootClass
        if (className === "EARootClass") {
          return null;
        }

        // Get attributes
        const attributes = Array.from(
          classElement.getElementsByTagName("ownedAttribute")
        ).map((attr) => {
          const name = attr.getAttribute("name");
          const type = attr.getAttribute("type");
          return `${name}: ${type}`;
        });

        // Get methods
        const operations = Array.from(
          classElement.getElementsByTagName("ownedOperation")
        ).map((operation) => {
          const name = operation.getAttribute("name");
          const returnParam = operation.querySelector(
            "ownedParameter[direction='return']"
          );
          const returnType = returnParam
            ? returnParam
                .querySelector("type")
                ?.getAttribute("href")
                ?.split("#")
                .pop() || "void"
            : "void";
          return `${name}: ${returnType}`;
        });

        const position = { x: Math.random() * 500, y: Math.random() * 500 };
        const size = { width: 200, height: 100 };

        const classData = {
          name: className,
          attributes,
          methods: operations,
          position,
          size,
        };

        try {
          const response = await addClass(id, classData);
          const newClassId = response.classes[response.classes.length - 1]._id;

          console.log(response);

          const umlClass = new UmlClass({
            position,
            size,
            name: className,
            attributes,
            methods: operations,
          });

          return { xmlId: classId, graphId: umlClass.id, dbId: newClassId };
        } catch (error) {
          console.error("Error adding class:", error);
        }
      }
    );

    // Process relationships after classes are added
    Promise.all(classPromises).then(() => processRelationships(classMap));
  }

  function processRelationships(classMap) {
    // Process all types of relationships
    const relationships = [
      ...Array.from(xmlDoc.getElementsByTagName("packagedElement")).filter(
        (element) => {
          const type = element.getAttribute("xmi:type");
          return [
            "uml:Association",
            "uml:Dependency",
            "uml:Generalization",
            "uml:AssociationClass",
          ].includes(type);
        }
      ),
    ];

    console.log(relationships);

    relationships.forEach((relationshipElement) => {
      const type = relationshipElement.getAttribute("xmi:type");
      let sourceId, targetId, linkType, sourceMultiplicity, targetMultiplicity;

      switch (type) {
        case "uml:Association":
          const memberEnds =
            relationshipElement.getElementsByTagName("memberEnd");
          if (memberEnds.length >= 2) {
            // Get the actual ownedEnd elements instead of just memberEnd references
            const ownedEnds =
              relationshipElement.getElementsByTagName("ownedEnd");
            const source = ownedEnds[0];
            const target = ownedEnds[1];

            sourceId = source.getAttribute("type");
            targetId = target.getAttribute("type");

            // Get multiplicities
            sourceMultiplicity = getMultiplicity(source);
            targetMultiplicity = getMultiplicity(target);

            const aggregation = source.getAttribute("aggregation");
            if (aggregation === "composite") {
              linkType = "composition";
            } else if (aggregation === "shared") {
              linkType = "aggregation";
            } else {
              linkType = "association";
            }
          }
          break;

        case "uml:AssociationClass":
          const assocMemberEnds =
            relationshipElement.getElementsByTagName("memberEnd");
          if (assocMemberEnds.length >= 2) {
            const ownedEnds =
              relationshipElement.getElementsByTagName("ownedEnd");
            sourceId = ownedEnds[0].getAttribute("type");
            targetId = ownedEnds[1].getAttribute("type");
            sourceMultiplicity = getMultiplicity(ownedEnds[0]);
            targetMultiplicity = getMultiplicity(ownedEnds[1]);
            linkType = "associationclass";
          }
          break;

        case "uml:Dependency":
          const client = relationshipElement.querySelector("client");
          const supplier = relationshipElement.querySelector("supplier");
          if (client && supplier) {
            sourceId = client.getAttribute("xmi:idref");
            targetId = supplier.getAttribute("xmi:idref");
            linkType = "dependency";
          }
          break;

        case "uml:Generalization":
          sourceId = relationshipElement.parentNode.getAttribute("xmi:id");
          targetId = relationshipElement.getAttribute("general");
          linkType = "generalization";
          break;
      }

      if (
        sourceId &&
        targetId &&
        classMap.has(sourceId) &&
        classMap.has(targetId)
      ) {
        const sourceIds = classMap.get(sourceId);
        const targetIds = classMap.get(targetId);
        let linkId;

        // Create the appropriate link based on type
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
          case "associationclass":
            // Handle association class specifically
            linkId = createLink(
              sourceIds.graphId,
              targetIds.graphId,
              graphRef,
              paperRef
            );
            // Create intermediate class and dashed link here
            break;
          default:
            linkId = createLink(
              sourceIds.graphId,
              targetIds.graphId,
              graphRef,
              paperRef
            );
        }

        // Update link multiplicities if they exist
        if (linkId && sourceMultiplicity && targetMultiplicity) {
          const link = graphRef.current.getCell(linkId);
          if (link) {
            link.label(1, { attrs: { text: { text: sourceMultiplicity } } });
            link.label(2, { attrs: { text: { text: targetMultiplicity } } });
          }
        }

        // Add to database
        if (linkId) {
          addLink(id, {
            source: sourceIds.dbId,
            target: targetIds.dbId,
            linkType: linkType,
            sourceMultiplicity,
            targetMultiplicity,
          });
        }
      }
    });
  }

  function getMultiplicity(ownedEnd) {
    const lower = ownedEnd.querySelector("lowerValue");
    const upper = ownedEnd.querySelector("upperValue");

    let lowerValue = lower ? lower.getAttribute("value") : "1";
    let upperValue = upper ? upper.getAttribute("value") : "1";

    // Convert -1 back to *
    upperValue = upperValue === "-1" ? "*" : upperValue;

    return `${lowerValue}..${upperValue}`;
  }
};
