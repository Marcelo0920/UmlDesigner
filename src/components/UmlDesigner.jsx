import React, { useEffect, useRef, useState } from "react";
import { dia, shapes, linkTools, elementTools } from "jointjs";
import UmlClass from "./UmlClass";
import axios from "axios";
import "jointjs/dist/joint.css";
import "../styles/umlPaper.css";

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

  const handleElementClick = (elementView) => {
    const element = elementView.model;
    setSelectedElement(element);

    if (isLinkMode) {
      if (!sourceElement) {
        setSourceElement(element);
      } else {
        createLink(sourceElement, element);
        setSourceElement(null);
        setIsLinkMode(false);
      }
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
    console.log("Link double-clicked");
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

      console.log(jsonGraph);

      try {
        const response = await axios.post(
          "http://your-backend-url/api/export-uml",
          jsonGraph
        );
        console.log("UML design exported successfully:", response.data);
        alert("UML design exported successfully!");
      } catch (error) {
        console.error("Error exporting UML design:", error);
        alert("Error exporting UML design. Please try again.");
      }
    }
  };

  const toggleLinkMode = () => {
    setIsLinkMode(!isLinkMode);
    setSourceElement(null);
  };

  const createLink = (source, target) => {
    if (graphRef.current && paperRef.current) {
      const link = new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
        router: { name: "manhattan" },
        connector: { name: "rounded" },
        attrs: {
          line: {
            stroke: "#333333",
            strokeWidth: 2,
          },
          ".marker-target": {
            fill: "#333333",
            d: "M 10 0 L 0 5 L 10 10 z",
          },
        },
        labels: [
          {
            position: 0.1,
            attrs: { text: { text: "1", fill: "#333333" } },
          },
          {
            position: 0.9,
            attrs: { text: { text: "1", fill: "#333333" } },
          },
        ],
      });

      graphRef.current.addCell(link);

      const linkView = link.findView(paperRef.current);
      linkView.addTools(
        new dia.ToolsView({
          tools: [
            new linkTools.Vertices(),
            new linkTools.Segments() /* 
            new linkTools.SourceArrowhead(), */,
            new linkTools.TargetArrowhead(),
            new linkTools.Button({
              distance: "25%",
              action: function () {
                link.remove();
              },
            }),
          ],
        })
      );
    }
  };

  return (
    <div>
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
          style={{ backgroundColor: "#4CAF50", color: "white" }}
        >
          Export UML Design
        </button>
        <button
          onClick={deleteSelectedElement}
          style={{ backgroundColor: "#f44336", color: "white" }}
          disabled={!selectedElement}
        >
          Delete Selected
        </button>
      </div>
      <div style={{ display: "flex" }}>
        <div
          ref={graphRef}
          className="uml-paper"
          style={{ flex: 1, height: "600px" }}
        ></div>
        {editingElement && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#b0b0b0",
              border: "1px solid #ccc",
              borderRadius: "5px",
              marginLeft: "20px",
              width: "300px",
            }}
          >
            <h3>Edit UML Class</h3>
            <div>
              <label>Class Name:</label>
              <input
                type="text"
                value={editValues.name}
                onChange={handleEditChange("name")}
                style={{ width: "100%", marginBottom: "10px" }}
              />
            </div>
            <div>
              <label>Attributes (one per line):</label>
              <textarea
                value={editValues.attributes.join("\n")}
                onChange={handleEditChange("attributes")}
                rows={5}
                style={{ width: "100%", marginBottom: "10px" }}
              />
            </div>
            <div>
              <label>Methods (one per line):</label>
              <textarea
                value={editValues.methods.join("\n")}
                onChange={handleEditChange("methods")}
                rows={5}
                style={{ width: "100%", marginBottom: "10px" }}
              />
            </div>
            <button onClick={handleEditSubmit}>Save Changes</button>
          </div>
        )}
        {editingLink && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#b0b0b0",
              border: "1px solid #ccc",
              borderRadius: "5px",
              marginLeft: "20px",
              width: "300px",
            }}
          >
            <h3>Edit Association</h3>
            <div>
              <label>Association Type:</label>
              <input
                type="text"
                value={linkValues.associationType}
                onChange={handleLinkEditChange("associationType")}
                style={{ width: "100%", marginBottom: "10px" }}
              />
            </div>
            <div>
              <label>Source Multiplicity:</label>
              <input
                type="text"
                value={linkValues.sourceMultiplicity}
                onChange={handleLinkEditChange("sourceMultiplicity")}
                style={{ width: "100%", marginBottom: "10px" }}
              />
            </div>
            <div>
              <label>Target Multiplicity:</label>
              <input
                type="text"
                value={linkValues.targetMultiplicity}
                onChange={handleLinkEditChange("targetMultiplicity")}
                style={{ width: "100%", marginBottom: "10px" }}
              />
            </div>
            <button onClick={handleLinkEditSubmit}>Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UmlDesigner;
