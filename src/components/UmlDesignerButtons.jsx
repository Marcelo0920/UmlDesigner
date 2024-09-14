import React from "react";

const UmlDesignerButtons = ({
  addNewUmlClass,
  toggleLinkMode,
  isLinkMode,
  exportUmlDesign,
  exportToXml,
  toggleIntermediateClassMode,
  isIntermediateClassMode,
  deleteSelectedElement,
  selectedElement,
}) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <button onClick={addNewUmlClass} style={{ marginRight: "10px" }}>
        Add UML Class
      </button>
      <button
        onClick={toggleLinkMode}
        style={{
          backgroundColor: isLinkMode ? "lightblue" : "white",
          marginRight: "10px",
        }}
      >
        {isLinkMode ? "Cancel Link" : "Create Link"}
      </button>
      <button
        onClick={exportUmlDesign}
        style={{
          backgroundColor: "#4CAF50",
          color: "white",
          marginRight: "10px",
        }}
      >
        Export UML Design
      </button>
      <button
        onClick={exportToXml}
        style={{
          backgroundColor: "#008CBA",
          color: "white",
          marginRight: "10px",
        }}
      >
        Export to XML
      </button>
      <button
        onClick={toggleIntermediateClassMode}
        style={{
          backgroundColor: isIntermediateClassMode ? "lightgreen" : "black",
          color: "white",
          marginRight: "10px",
        }}
      >
        {isIntermediateClassMode
          ? "Cancel Intermediate"
          : "Add Intermediate Class"}
      </button>
      <button
        onClick={deleteSelectedElement}
        style={{ backgroundColor: "#f44336", color: "white" }}
        disabled={!selectedElement}
      >
        Delete Selected
      </button>
    </div>
  );
};

export default UmlDesignerButtons;
