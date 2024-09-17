import React, { useCallback, useEffect, useRef, useState } from "react";
import { dia } from "jointjs";
import UmlDesignerButtons from "./UmlDesignerButtons";
import EditElementPanel from "./EditElementPanel";
import EditLinkPanel from "./EditLinkPanel";
import UmlClass from "./UmlClass";
import axios from "axios";
import "jointjs/dist/joint.css";
import "../styles/umlPaper.css";
import {
  createAggregation,
  createComposition,
  createGeneralization,
  createLink,
} from "../utils/linkCreators";
import createIntermediateClass from "../utils/createIntermediateClass";
import exportToXml from "../utils/exportToXml";
import { exportUmlDesign } from "../utils/exportUmlDesign";

const UmlDesigner = () => {
  const graphRef = useRef(null);
  const paperRef = useRef(null);
  const [editingElement, setEditingElement] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [editValues, setEditValues] = useState({
    name: "",
    attributes: [],
    methods: [],
  });
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [isCompositionMode, setIsCompositionMode] = useState(false);
  const [isAggregationMode, setIsAggregationMode] = useState(false);
  const [isGeneralizationMode, setIsGeneralizationMode] = useState(false);
  const [isIntermediateClassMode, setIsIntermediateClassMode] = useState(false);
  const [sourceElement, setSourceElement] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [linkValues, setLinkValues] = useState({
    associationType: "association",
    sourceMultiplicity: "1",
    targetMultiplicity: "1",
  });

  useEffect(() => {
    if (!graphRef.current || !paperRef.current) {
      const graph = new dia.Graph();
      const paper = new dia.Paper({
        el: graphRef.current,
        model: graph,
        width: 1000,
        height: 600,
        gridSize: 10,
        drawGrid: true,
        background: {
          color: "white",
        },
        interactive: { elementMove: true },
      });

      graphRef.current = graph;
      paperRef.current = paper;

      paper.on("element:pointerclick", handleElementClick);
      paper.on("element:pointerdblclick", handleElementDoubleClick);
      paper.on("link:pointerclick", handleLinkClick);
      paper.on("link:pointerdblclick", handleLinkDoubleClick);
      paper.on("blank:pointerclick", handleBlankClick);
    }
  }, []);

  useEffect(() => {
    if (paperRef.current) {
      paperRef.current
        .off("element:pointerclick")
        .on("element:pointerclick", handleElementClick);
    }
  }, [isLinkMode, sourceElement]);

  const handleElementClick = useCallback(
    (elementView) => {
      const element = elementView.model;

      if (
        isLinkMode ||
        isCompositionMode ||
        isAggregationMode ||
        isGeneralizationMode ||
        isIntermediateClassMode
      ) {
        if (!sourceElement) {
          setSourceElement(element);
        } else {
          if (isLinkMode) {
            createLink(sourceElement.id, element.id, graphRef);
          } else if (isCompositionMode) {
            createComposition(sourceElement.id, element.id, graphRef);
          } else if (isAggregationMode) {
            createAggregation(sourceElement.id, element.id, graphRef);
          } else if (isGeneralizationMode) {
            createGeneralization(sourceElement.id, element.id, graphRef);
          } else if (isIntermediateClassMode) {
            createIntermediateClass(sourceElement, element, graphRef, paperRef);
          }
          setSourceElement(null);
          setIsLinkMode(false);
          setIsCompositionMode(false);
          setIsAggregationMode(false);
          setIsGeneralizationMode(false);
          setIsIntermediateClassMode(false);
        }
      } else {
        setSelectedElement(element);
      }
    },
    [
      isLinkMode,
      isCompositionMode,
      isAggregationMode,
      isGeneralizationMode,
      isIntermediateClassMode,
      sourceElement,
    ]
  );

  useEffect(() => {
    if (paperRef.current) {
      paperRef.current
        .off("element:pointerclick")
        .on("element:pointerclick", handleElementClick);
    }
  }, [handleElementClick]);

  const toggleIntermediateClassMode = useCallback(() => {
    setIsIntermediateClassMode((prev) => !prev);
    setIsLinkMode(false);
    setIsCompositionMode(false);
    setIsAggregationMode(false);
    setIsGeneralizationMode(false);
    setSourceElement(null);
  }, []);

  const handleExportToXml = () => {
    exportToXml(graphRef);
  };

  const handleLinkClick = (linkView) => {
    const link = linkView.model;
    setSelectedElement(link);
  };

  const handleBlankClick = () => {
    if (selectedElement) {
      selectedElement.unhighlight();
    }
    setSelectedElement(null);
    setEditingElement(null);
    setEditingLink(null);
  };

  const handleElementDoubleClick = (elementView) => {
    const element = elementView.model;

    if (element instanceof UmlClass && !isLinkMode) {
      setEditingElement(element);
      setEditingLink(null);
      setEditValues({
        name: element.get("name"),
        attributes: element.get("attributes"),
        methods: element.get("methods"),
      });
    }
  };

  const handleLinkDoubleClick = (linkView) => {
    const link = linkView.model;
    setEditingLink(link);
    setEditingElement(null);
    setLinkValues({
      associationType: link.labels()[0]?.attrs?.text?.text || "association",
      sourceMultiplicity: link.label(1)?.attrs?.text?.text || "1",
      targetMultiplicity: link.label(2)?.attrs?.text?.text || "1",
    });
  };

  const handleEditChange = (field) => (e) => {
    if (field === "name") {
      setEditValues((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    } else {
      setEditValues((prev) => ({
        ...prev,
        [field]: e.target.value.split("\n"),
      }));
    }
  };

  const handleLinkEditChange = (field) => (e) => {
    setLinkValues((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleEditSubmit = () => {
    if (editingElement && paperRef.current) {
      editingElement.set({
        name: editValues.name,
        attributes: editValues.attributes,
        methods: editValues.methods,
      });
      editingElement.updateRectangles();

      const elementView = paperRef.current.findViewByModel(editingElement);
      if (elementView) {
        elementView.update();
        elementView.resize();
      }

      setEditingElement(null);
    }
  };

  const handleLinkEditSubmit = () => {
    if (editingLink && paperRef.current) {
      editingLink.label(0, {
        attrs: { text: { text: linkValues.associationType } },
      });
      editingLink.label(1, {
        attrs: { text: { text: linkValues.sourceMultiplicity } },
      });
      editingLink.label(2, {
        attrs: { text: { text: linkValues.targetMultiplicity } },
      });

      const linkView = editingLink.findView(paperRef.current);
      if (linkView) {
        linkView.update();
      }

      setEditingLink(null);
    }
  };

  const addNewUmlClass = () => {
    if (graphRef.current) {
      const umlClass = new UmlClass({
        position: { x: 50, y: 50 },
        size: { width: 200, height: 100 },
        name: ["NewClass"],
        attributes: ["- attribute: Type"],
        methods: ["+ method(): ReturnType"],
      });
      graphRef.current.addCell(umlClass);
    }
  };

  const deleteSelectedElement = () => {
    if (selectedElement && graphRef.current) {
      selectedElement.remove();
      setSelectedElement(null);
      setEditingElement(null);
      setEditingLink(null);
    }
  };

  const handleExportUmlDesign = () => {
    exportUmlDesign(graphRef);
  };

  const toggleLinkMode = useCallback(() => {
    setIsLinkMode((prev) => !prev);
    setIsCompositionMode(false);
    setIsAggregationMode(false);
    setIsGeneralizationMode(false);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  const toggleCompositionMode = useCallback(() => {
    setIsCompositionMode((prev) => !prev);
    setIsLinkMode(false);
    setIsAggregationMode(false);
    setIsGeneralizationMode(false);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  const toggleAggregationMode = useCallback(() => {
    setIsAggregationMode((prev) => !prev);
    setIsLinkMode(false);
    setIsCompositionMode(false);
    setIsGeneralizationMode(false);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  const toggleGeneralizationMode = useCallback(() => {
    setIsGeneralizationMode((prev) => !prev);
    setIsLinkMode(false);
    setIsCompositionMode(false);
    setIsAggregationMode(false);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  return (
    <div>
      <UmlDesignerButtons
        addNewUmlClass={addNewUmlClass}
        toggleLinkMode={toggleLinkMode}
        isLinkMode={isLinkMode}
        toggleCompositionMode={toggleCompositionMode}
        isCompositionMode={isCompositionMode}
        toggleAggregationMode={toggleAggregationMode}
        isAggregationMode={isAggregationMode}
        toggleGeneralizationMode={toggleGeneralizationMode}
        isGeneralizationMode={isGeneralizationMode}
        exportUmlDesign={handleExportUmlDesign}
        exportToXml={handleExportToXml}
        toggleIntermediateClassMode={toggleIntermediateClassMode}
        isIntermediateClassMode={isIntermediateClassMode}
        deleteSelectedElement={deleteSelectedElement}
        selectedElement={selectedElement}
      />
      <div style={{ display: "flex" }}>
        <div
          ref={graphRef}
          className="uml-paper"
          style={{ flex: 1, height: "130vh", width: "20vw" }}
        ></div>
        {editingElement && (
          <EditElementPanel
            editValues={editValues}
            handleEditChange={handleEditChange}
            handleEditSubmit={handleEditSubmit}
          />
        )}
        {editingLink && (
          <EditLinkPanel
            linkValues={linkValues}
            handleLinkEditChange={handleLinkEditChange}
            handleLinkEditSubmit={handleLinkEditSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default UmlDesigner;
