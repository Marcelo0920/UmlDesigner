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
        "http://localhost:5000/generator",
        filteredData,
        {
          responseType: "blob", // Important: Set the response type to blob
        }
      );

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: "application/zip" });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger the download
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "generated_classes.zip";
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("Java code generated and downloaded successfully");
      alert("Java code generated and downloaded successfully!");
    } catch (error) {
      console.error("Error generating Java code:", error);
      alert("Error generating Java code. Please try again.");
    }
  } else {
    console.error("graphRef.current is null or undefined");
  }
};
