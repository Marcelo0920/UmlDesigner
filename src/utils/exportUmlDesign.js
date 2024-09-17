import axios from "axios";

export const exportUmlDesign = async (graphRef) => {
  if (graphRef.current) {
    const jsonGraph = graphRef.current.toJSON();

    const filteredData = jsonGraph.cells.reduce(
      (acc, cell) => {
        if (cell.type === "uml.Class") {
          acc.classes.push({
            id: cell.id,
            name: cell.name,
            attributes: cell.attributes,
            methods: cell.methods,
          });
        }
        if (cell.type === "link" || cell.type === "standard.Link") {
          acc.links.push({
            id: cell.id,
            source: cell.source.id,
            target: cell.target.id,
            labels: cell.labels,
          });
        }
        return acc;
      },
      { classes: [], links: [] }
    );

    console.log("Filtered UML data:", filteredData);

    try {
      const response = await axios.post(
        "http://your-backend-url/api/generate-java-code",
        filteredData
      );
      console.log("Java code generated successfully:", response.data);
      alert("Java code generated successfully!");
    } catch (error) {
      console.error("Error generating Java code:", error);
      alert("Error generating Java code. Please try again.");
    }
  } else {
    console.error("graphRef.current is null or undefined");
  }
};
