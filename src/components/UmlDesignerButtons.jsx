import React from "react";

const UmlDesignerButtons = ({
  addNewUmlClass,
  toggleLinkMode,
  isLinkMode,
  toggleCompositionMode,
  isCompositionMode,
  toggleAggregationMode,
  isAggregationMode,
  toggleGeneralizationMode,
  isGeneralizationMode,
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
        Agregar Clase UML
      </button>
      <button
        onClick={toggleLinkMode}
        style={{
          backgroundColor: isLinkMode ? "lightblue" : "blue",
          marginRight: "10px",
        }}
      >
        {isLinkMode ? "Cancel" : "Crear Asociación"}
      </button>
      <button
        onClick={toggleCompositionMode}
        style={{
          backgroundColor: isCompositionMode ? "lightblue" : "#FF6B6B",
          color: "white",
          marginRight: "10px",
        }}
      >
        {isCompositionMode ? "Cancel" : "Crear Composición"}
      </button>
      <button
        onClick={toggleAggregationMode}
        style={{
          backgroundColor: isAggregationMode ? "lightblue" : "#4ECDC4",
          color: "white",
          marginRight: "10px",
        }}
      >
        {isAggregationMode ? "Cancel" : "Crear Agregación"}
      </button>
      <button
        onClick={toggleGeneralizationMode}
        style={{
          backgroundColor: isGeneralizationMode ? "lightblue" : "#45B7D1",
          color: "white",
          marginRight: "10px",
        }}
      >
        {isGeneralizationMode ? "Cancel" : "Crear Generalización"}
      </button>
      <button
        onClick={exportUmlDesign}
        style={{
          backgroundColor: "#4CAF50",
          color: "white",
          marginRight: "10px",
        }}
      >
        Generate Code
      </button>
      <button
        onClick={exportToXml}
        style={{
          backgroundColor: "#008CBA",
          color: "white",
          marginRight: "10px",
        }}
      >
        Convertir a UML
      </button>
      <button
        onClick={toggleIntermediateClassMode}
        style={{
          backgroundColor: isIntermediateClassMode ? "lightgreen" : "black",
          color: "white",
          marginRight: "10px",
        }}
      >
        {isIntermediateClassMode ? "Cancel" : "Agregar Clase Intermedia"}
      </button>
      <button
        onClick={deleteSelectedElement}
        style={{ backgroundColor: "#f44336", color: "white" }}
        disabled={!selectedElement}
      >
        Eliminar Seleccionado
      </button>
    </div>
  );
};

export default UmlDesignerButtons;
