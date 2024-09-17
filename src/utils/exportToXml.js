import { generateXml } from "./generateXml";

const exportToXml = (graphRef) => {
  const xmlContent = generateXml(graphRef);
  if (xmlContent) {
    const blob = new Blob([xmlContent], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "uml_diagram.xml";
    link.click();
    URL.revokeObjectURL(url);
  }
};

export default exportToXml;
