import React, { useCallback, useEffect, useRef, useState } from "react";
import { dia, shapes, linkTools, elementTools } from "jointjs";
import UmlDesignerButtons from "./UmlDesignerButtons";
import EditElementPanel from "./EditElementPanel";
import EditLinkPanel from "./EditLinkPanel";
import UmlClass from "./UmlClass";
import axios from "axios";
import "jointjs/dist/joint.css";
import "../styles/umlPaper.css";
import { generateXml } from "../utils/generateXml";
import { createDashedLink, createLink } from "../utils/linkCreators";

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
  const [sourceElement, setSourceElement] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [isIntermediateClassMode, setIsIntermediateClassMode] = useState(false);
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
        width: 800,
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

      if (isLinkMode || isIntermediateClassMode) {
        if (!sourceElement) {
          setSourceElement(element);
        } else {
          if (isLinkMode) {
            createLink(sourceElement.id, element.id, graphRef);
          } else if (isIntermediateClassMode) {
            createIntermediateClass(sourceElement, element);
          }
          setSourceElement(null);
          setIsLinkMode(false);
          setIsIntermediateClassMode(false);
        }
      } else {
        setSelectedElement(element);
      }
    },
    [isLinkMode, isIntermediateClassMode, sourceElement]
  );

  useEffect(() => {
    if (paperRef.current) {
      paperRef.current
        .off("element:pointerclick")
        .on("element:pointerclick", handleElementClick);
    }
  }, [handleElementClick]);

  const createIntermediateClass = (source, target) => {
    if (graphRef.current && paperRef.current) {
      const sourcePosition = source.position();
      const targetPosition = target.position();
      const midX = (sourcePosition.x + targetPosition.x) / 2;
      const midY = (sourcePosition.y + targetPosition.y) / 2;

      // Create the intermediate class
      const intermediateClass = new UmlClass({
        position: { x: midX, y: midY + 100 }, // Position it slightly below the midpoint
        size: { width: 200, height: 100 },
        name: "IntermediateClass",
        attributes: [],
        methods: [],
      });

      graphRef.current.addCell(intermediateClass);

      // Create the direct link between source and target
      const directLink = createLink(source.id, target.id, graphRef);

      // Create the dashed link to the intermediate class
      createDashedLink(directLink, intermediateClass.id, graphRef);

      // Add remove tool to the intermediate class
      const elementView = intermediateClass.findView(paperRef.current);
      elementView.addTools(
        new dia.ToolsView({
          tools: [new elementTools.Remove({ offset: { x: 10, y: 10 } })],
        })
      );
    }
  };

  const toggleIntermediateClassMode = useCallback(() => {
    setIsIntermediateClassMode((prev) => !prev);
    setIsLinkMode(false);
    setSourceElement(null);
  }, []);

  const exportToXml = () => {
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

  const exportUmlDesign = async () => {
    if (graphRef.current) {
      const jsonGraph = graphRef.current.toJSON();

      const filteredData = jsonGraph.cells.reduce(
        (acc, cell) => {
          if (cell.type === "uml.Class") {
            acc.classes.push({
              name: cell.name,
              attributes: cell.attributes,
              methods: cell.methods,
            });
          } else if (cell.type === "standard.Link") {
            acc.links.push({
              source: cell.source.id,
              target: cell.target.id,
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
    }
  };

  const toggleLinkMode = useCallback(() => {
    setIsLinkMode((prev) => !prev);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  return (
    <div>
      <UmlDesignerButtons
        addNewUmlClass={addNewUmlClass}
        toggleLinkMode={toggleLinkMode}
        isLinkMode={isLinkMode}
        exportUmlDesign={exportUmlDesign}
        exportToXml={exportToXml}
        toggleIntermediateClassMode={toggleIntermediateClassMode}
        isIntermediateClassMode={isIntermediateClassMode}
        deleteSelectedElement={deleteSelectedElement}
        selectedElement={selectedElement}
      />
      <div style={{ display: "flex" }}>
        <div
          ref={graphRef}
          className="uml-paper"
          style={{ flex: 1, height: "600px" }}
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
