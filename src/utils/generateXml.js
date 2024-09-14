export const generateXml = (graphRef) => {
  if (graphRef.current) {
    const jsonGraph = graphRef.current.toJSON();
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent +=
      '<xmi:XMI xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML">\n';
    xmlContent += '  <uml:Model xmi:id="root_model" name="RootModel">\n';

    jsonGraph.cells.forEach((cell) => {
      if (cell.type === "uml.Class") {
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

    // Generate association elements
    const intermediateClasses = new Map();

    jsonGraph.cells.forEach((cell) => {
      if (cell.type === "standard.Link") {
        const sourceId = cell.source.id;
        const targetId = cell.target.id;
        const associationType =
          cell.labels?.[0]?.attrs?.text?.text || "Association";
        const sourceMultiplicity = cell.labels?.[1]?.attrs?.text?.text || "";
        const targetMultiplicity = cell.labels?.[2]?.attrs?.text?.text || "";

        // Check if this is a dashed link (connection to intermediate class)
        const isDashed = cell.attrs?.line?.strokeDasharray;

        if (isDashed) {
          // This is a link to an intermediate class
          const intermediateClassId = targetId;
          const mainAssociationId = sourceId;

          if (!intermediateClasses.has(intermediateClassId)) {
            intermediateClasses.set(intermediateClassId, new Set());
          }
          intermediateClasses.get(intermediateClassId).add(mainAssociationId);
        } else {
          // This is a regular association
          xmlContent += `    <packagedElement xmi:type="uml:Association" xmi:id="${cell.id}" name="${associationType}" visibility="public">\n`;
          xmlContent += `      <memberEnd xmi:idref="${cell.id}_source"/>\n`;
          xmlContent += `      <memberEnd xmi:idref="${cell.id}_target"/>\n`;
          xmlContent += `      <ownedEnd xmi:id="${cell.id}_source" name="" visibility="public" type="${sourceId}" association="${cell.id}">\n`;
          if (sourceMultiplicity) {
            const [lower, upper] = sourceMultiplicity
              .split("..")
              .map((v) => (v === "*" ? "-1" : v));
            xmlContent += `        <lowerValue xmi:type="uml:LiteralInteger" value="${lower}"/>\n`;
            xmlContent += `        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${upper}"/>\n`;
          }
          xmlContent += `      </ownedEnd>\n`;
          xmlContent += `      <ownedEnd xmi:id="${cell.id}_target" name="" visibility="public" type="${targetId}" association="${cell.id}">\n`;
          if (targetMultiplicity) {
            const [lower, upper] = targetMultiplicity
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

    // Generate intermediate class associations
    intermediateClasses.forEach((associationIds, intermediateClassId) => {
      const associationArray = Array.from(associationIds);
      if (associationArray.length === 2) {
        const [assoc1, assoc2] = associationArray;
        xmlContent += `    <packagedElement xmi:type="uml:Association" xmi:id="${intermediateClassId}_assoc" name="IntermediateAssociation" visibility="public">\n`;
        xmlContent += `      <memberEnd xmi:idref="${intermediateClassId}_assoc_end1"/>\n`;
        xmlContent += `      <memberEnd xmi:idref="${intermediateClassId}_assoc_end2"/>\n`;
        xmlContent += `      <ownedEnd xmi:id="${intermediateClassId}_assoc_end1" name="" visibility="public" type="${assoc1}" association="${intermediateClassId}_assoc"/>\n`;
        xmlContent += `      <ownedEnd xmi:id="${intermediateClassId}_assoc_end2" name="" visibility="public" type="${assoc2}" association="${intermediateClassId}_assoc"/>\n`;
        xmlContent += `    </packagedElement>\n`;
      }
    });

    xmlContent += "  </uml:Model>\n";
    xmlContent += "</xmi:XMI>";

    return xmlContent;
  }
  return "";
};
