import React, { useState, useRef } from "react";
import ShareProjectModal from "./ShareProjectModal";

const UmlDesignerButtons = ({
  addNewUmlClass,
  toggleLinkMode,
  isLinkMode,
  toggleCompositionMode,
  isCompositionMode,
  toggleAggregationMode,
  isAggregationMode,
  toggleGeneralizationMode,
  toggleDependencyMode,
  isGeneralizationMode,
  isDependenciaMode,
  exportUmlDesign,
  exportToXml,
  toggleIntermediateClassMode,
  isIntermediateClassMode,
  deleteSelectedElement,
  selectedElement,
  projectId,
  importDiagram, // New prop for importing diagram
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const xmlContent = e.target.result;
        importDiagram(xmlContent);
      };
      reader.readAsText(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
      <button onClick={addNewUmlClass}>Agregar Clase UML</button>
      <button onClick={toggleLinkMode}>
        {isLinkMode ? "Cancel" : "Crear Asociación"}
      </button>
      <button onClick={toggleCompositionMode}>
        {isCompositionMode ? "Cancel" : "Crear Composición"}
      </button>
      <button onClick={toggleAggregationMode}>
        {isAggregationMode ? "Cancel" : "Crear Agregación"}
      </button>
      <button onClick={toggleGeneralizationMode}>
        {isGeneralizationMode ? "Cancel" : "Crear Herencia"}
      </button>
      <button onClick={toggleDependencyMode}>
        {isDependenciaMode ? "Cancel" : "Crear Dependencia"}
      </button>
      <button onClick={exportUmlDesign}>Generate Code</button>
      <button onClick={exportToXml}>Convertir a UML</button>
      <button onClick={toggleIntermediateClassMode}>
        {isIntermediateClassMode ? "Cancel" : "Agregar Clase Intermedia"}
      </button>
      <button onClick={deleteSelectedElement} disabled={!selectedElement}>
        Eliminar Seleccionado
      </button>
      <button onClick={() => setIsModalOpen(true)}>Compartir Proyecto</button>
      <button onClick={handleImportClick}>Importar Diagrama</button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        accept=".xml"
      />
      <ShareProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};

export default UmlDesignerButtons;
