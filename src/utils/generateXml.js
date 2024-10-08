export const generateXml = (graphRef) => {
  if (graphRef.current) {
    const jsonGraph = graphRef.current.toJSON();
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent +=
      '<xmi:XMI xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML">\n';
    xmlContent += '  <uml:Model xmi:id="root_model" name="RootModel">\n';

    // Function to check if a cell is an intermediate class
    const isIntermediateClass = (cell) => {
      return jsonGraph.cells.some(
        (link) =>
          link.type === "standard.Link" &&
          link.target.id === cell.id &&
          link.attrs?.line?.strokeDasharray &&
          link.linkType != "dependency"
      );
    };

    // Generate class elements

    jsonGraph.cells.forEach((cell) => {
      if (cell.type === "uml.Class" && !isIntermediateClass(cell)) {
        xmlContent += `    <packagedElement xmi:type="uml:Class" xmi:id="${cell.id}" name="${cell.name}">\n`;

        cell.attributes.forEach((attr) => {
          const [name, type] = attr.split(":").map((s) => s.trim());
          xmlContent += `      <ownedAttribute xmi:type="uml:Property" xmi:id="${cell.id}_${name}" name="${name}" type="${type}"/>\n`;
        });

        cell.methods.forEach((method) => {
          const [name, returnType] = method.split(":").map((s) => s.trim());
          xmlContent += `      <ownedOperation xmi:type="uml:Operation" xmi:id="${cell.id}_${name}" name="${name}">\n`;
          xmlContent += `        <ownedParameter xmi:type="uml:Parameter" direction="return">\n`;
          xmlContent += `          <type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#${returnType}"/>\n`;
          xmlContent += `        </ownedParameter>\n`;
          xmlContent += `      </ownedOperation>\n`;
        });

        xmlContent += "    </packagedElement>\n";
      }
    });

    // Track associations and intermediate classes
    const intermediateClasses = new Map();
    const associations = new Map();

    jsonGraph.cells.forEach((cell) => {
      if (cell.type === "standard.Link") {
        const sourceId = cell.source.id;
        const targetId = cell.target.id;
        const associationType = cell.linkType || "Association";
        const sourceMultiplicity = cell.labels?.[1]?.attrs?.text?.text || "";
        const targetMultiplicity = cell.labels?.[2]?.attrs?.text?.text || "";

        // Check if this is a dashed link (connection to intermediate class)
        const isDashed = cell.attrs?.line?.strokeDasharray;

        if (isDashed && associationType != "dependency") {
          // This is a link to an intermediate class
          intermediateClasses.set(cell.id, {
            intermediateClassId: targetId,
            associationId: sourceId,
          });
        } else {
          // This is a regular association or AssociationClass
          associations.set(cell.id, {
            sourceId,
            targetId,
            associationType,
            sourceMultiplicity,
            targetMultiplicity,
          });
        }
      }
    });

    // Generate Association and AssociationClass elements
    associations.forEach((association, associationId) => {
      const intermediateClass = Array.from(intermediateClasses.values()).find(
        (ic) => ic.associationId === associationId
      );

      if (
        association.associationType.toLowerCase() === "associationclass" ||
        intermediateClass
      ) {
        // This is an AssociationClass
        const intermediateClassId = intermediateClass
          ? intermediateClass.intermediateClassId
          : `${associationId}_class`;
        const intermediateClassCell = jsonGraph.cells.find(
          (cell) => cell.id === intermediateClassId
        );

        xmlContent += `    <packagedElement xmi:type="uml:AssociationClass" xmi:id="${associationId}" name="${
          intermediateClassCell
            ? intermediateClassCell.name
            : "AssociationClass"
        }">\n`;
        xmlContent += `      <memberEnd xmi:idref="${associationId}_source"/>\n`;
        xmlContent += `      <memberEnd xmi:idref="${associationId}_target"/>\n`;
        xmlContent += `      <ownedEnd xmi:id="${associationId}_source" type="${association.sourceId}" association="${associationId}">\n`;
        if (association.sourceMultiplicity) {
          const [lower, upper] = association.sourceMultiplicity
            .split("..")
            .map((v) => (v === "*" ? "-1" : v));
          xmlContent += `        <lowerValue xmi:type="uml:LiteralInteger" value="${lower}"/>\n`;
          xmlContent += `        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${upper}"/>\n`;
        }
        xmlContent += `      </ownedEnd>\n`;
        xmlContent += `      <ownedEnd xmi:id="${associationId}_target" type="${association.targetId}" association="${associationId}">\n`;
        if (association.targetMultiplicity) {
          const [lower, upper] = association.targetMultiplicity
            .split("..")
            .map((v) => (v === "*" ? "-1" : v));
          xmlContent += `        <lowerValue xmi:type="uml:LiteralInteger" value="${lower}"/>\n`;
          xmlContent += `        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${upper}"/>\n`;
        }
        xmlContent += `      </ownedEnd>\n`;

        // Add attributes and methods of the intermediate class
        if (intermediateClassCell) {
          intermediateClassCell.attributes.forEach((attr) => {
            const [name, type] = attr.split(":").map((s) => s.trim());
            xmlContent += `      <ownedAttribute xmi:type="uml:Property" xmi:id="${intermediateClassId}_${name}" name="${name}" type="${type}"/>\n`;
          });

          intermediateClassCell.methods.forEach((method) => {
            const [name, returnType] = method.split(":").map((s) => s.trim());
            xmlContent += `      <ownedOperation xmi:type="uml:Operation" xmi:id="${intermediateClassId}_${name}" name="${name}">\n`;
            xmlContent += `        <ownedParameter xmi:type="uml:Parameter" direction="return">\n`;
            xmlContent += `          <type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#${returnType}"/>\n`;
            xmlContent += `        </ownedParameter>\n`;
            xmlContent += `      </ownedOperation>\n`;
          });
        }

        xmlContent += `    </packagedElement>\n`;
      } else {
        // This is a regular Association, Aggregation, Composition, or Generalization
        switch (association.associationType.toLowerCase()) {
          case "aggregation":
            xmlContent += `    <packagedElement xmi:type="uml:Association" xmi:id="${associationId}" name="${association.associationType}">\n`;
            xmlContent += `      <memberEnd xmi:idref="${associationId}_source"/>\n`;
            xmlContent += `      <memberEnd xmi:idref="${associationId}_target"/>\n`;
            xmlContent += `      <ownedEnd xmi:id="${associationId}_source" type="${association.sourceId}" association="${associationId}" aggregation="shared">\n`;
            if (association.sourceMultiplicity) {
              const [lower, upper] = association.sourceMultiplicity
                .split("..")
                .map((v) => (v === "*" ? "-1" : v));
              xmlContent += `        <lowerValue xmi:type="uml:LiteralInteger" value="${lower}"/>\n`;
              xmlContent += `        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${upper}"/>\n`;
            }
            xmlContent += `      </ownedEnd>\n`;
            xmlContent += `      <ownedEnd xmi:id="${associationId}_target" type="${association.targetId}" association="${associationId}">\n`;
            if (association.targetMultiplicity) {
              const [lower, upper] = association.targetMultiplicity
                .split("..")
                .map((v) => (v === "*" ? "-1" : v));
              xmlContent += `        <lowerValue xmi:type="uml:LiteralInteger" value="${lower}"/>\n`;
              xmlContent += `        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${upper}"/>\n`;
            }
            xmlContent += `      </ownedEnd>\n`;
            xmlContent += `    </packagedElement>\n`;
            break;

          case "composition":
            xmlContent += `    <packagedElement xmi:type="uml:Association" xmi:id="${associationId}" name="${association.associationType}">\n`;
            xmlContent += `      <memberEnd xmi:idref="${associationId}_source"/>\n`;
            xmlContent += `      <memberEnd xmi:idref="${associationId}_target"/>\n`;
            xmlContent += `      <ownedEnd xmi:id="${associationId}_source" type="${association.sourceId}" association="${associationId}" aggregation="composite">\n`;
            if (association.sourceMultiplicity) {
              const [lower, upper] = association.sourceMultiplicity
                .split("..")
                .map((v) => (v === "*" ? "-1" : v));
              xmlContent += `        <lowerValue xmi:type="uml:LiteralInteger" value="${lower}"/>\n`;
              xmlContent += `        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${upper}"/>\n`;
            }
            xmlContent += `      </ownedEnd>\n`;
            xmlContent += `      <ownedEnd xmi:id="${associationId}_target" type="${association.targetId}" association="${associationId}">\n`;
            if (association.targetMultiplicity) {
              const [lower, upper] = association.targetMultiplicity
                .split("..")
                .map((v) => (v === "*" ? "-1" : v));
              xmlContent += `        <lowerValue xmi:type="uml:LiteralInteger" value="${lower}"/>\n`;
              xmlContent += `        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${upper}"/>\n`;
            }
            xmlContent += `      </ownedEnd>\n`;
            xmlContent += `    </packagedElement>\n`;
            break;
          case "generalization":
            // Find the specific (child) class
            const specificClass = jsonGraph.cells.find(
              (cell) => cell.id === association.sourceId
            );
            if (specificClass) {
              // Add the generalization to the specific class
              const classElement = xmlContent.lastIndexOf(
                `<packagedElement xmi:type="uml:Class" xmi:id="${association.sourceId}"`
              );
              if (classElement !== -1) {
                const insertPosition =
                  xmlContent.indexOf(">", classElement) + 1;
                xmlContent =
                  xmlContent.slice(0, insertPosition) +
                  `\n      <generalization xmi:type="uml:Generalization" xmi:id="${associationId}" general="${association.targetId}"/>` +
                  xmlContent.slice(insertPosition);
              }
            }
            break;

          case "dependency":
            // Handle Dependency relationship
            xmlContent += `    <packagedElement xmi:type="uml:Dependency" xmi:id="${associationId}">\n`;
            xmlContent += `      <client xmi:idref="${association.sourceId}"/>\n`;
            xmlContent += `      <supplier xmi:idref="${association.targetId}"/>\n`;
            xmlContent += `    </packagedElement>\n`;
            break;

          default: // Regular association
            xmlContent += `    <packagedElement xmi:type="uml:Association" xmi:id="${associationId}" name="${association.associationType}">\n`;
            xmlContent += `      <memberEnd xmi:idref="${associationId}_source"/>\n`;
            xmlContent += `      <memberEnd xmi:idref="${associationId}_target"/>\n`;
            xmlContent += `      <ownedEnd xmi:id="${associationId}_source" type="${association.sourceId}" association="${associationId}">\n`;
            if (association.sourceMultiplicity) {
              const [lower, upper] = association.sourceMultiplicity
                .split("..")
                .map((v) => (v === "*" ? "-1" : v));
              xmlContent += `        <lowerValue xmi:type="uml:LiteralInteger" value="${lower}"/>\n`;
              xmlContent += `        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${upper}"/>\n`;
            }
            xmlContent += `      </ownedEnd>\n`;
            xmlContent += `      <ownedEnd xmi:id="${associationId}_target" type="${association.targetId}" association="${associationId}">\n`;
            if (association.targetMultiplicity) {
              const [lower, upper] = association.targetMultiplicity
                .split("..")
                .map((v) => (v === "*" ? "-1" : v));
              xmlContent += `        <lowerValue xmi:type="uml:LiteralInteger" value="${lower}"/>\n`;
              xmlContent += `        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${upper}"/>\n`;
            }
            xmlContent += `      </ownedEnd>\n`;
            xmlContent += `    </packagedElement>\n`;
        }
      }
    });

    xmlContent += "  </uml:Model>\n";
    xmlContent += "</xmi:XMI>";

    return xmlContent;
  }
  return "";
};
