import React, { useEffect, useRef, useState } from "react";
import { dia } from "jointjs";
import UmlClass from "./UmlClass"; // Importa la clase
import "jointjs/dist/joint.css";
import "../styles/umlPaper.css";

const UmlDesigner = () => {
  const graphRef = useRef(null);
  const paperRef = useRef(null);
  const [editingElement, setEditingElement] = useState(null);
  const [editValues, setEditValues] = useState({
    name: "",
    attributes: "",
    methods: "",
  });

  useEffect(() => {
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

    paperRef.current = paper;

    const umlClass = new UmlClass({
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      name: ["ClassName"],
      attributes: ["- attribute1: Type", "- attribute2: Type"],
      methods: ["+ method1(param: Type): ReturnType", "+ method2(): void"],
    });

    const umlClass2 = new UmlClass({
      position: { x: 400, y: 100 },
      size: { width: 200, height: 100 },
      name: ["AnotherClass"],
      attributes: ["- attr1: Type", "- attr2: Type"],
      methods: ["+ method1()", "+ method2(param: Type)"],
    });

    graph.addCells([umlClass, umlClass2]);

    const link = new dia.Link({
      source: { id: umlClass.id },
      target: { id: umlClass2.id },
      router: { name: "manhattan" },
      connector: { name: "rounded" },
      labels: [{ position: 0.5, attrs: { text: { text: "association" } } }],
      attrs: {
        ".connection": { stroke: "#333333", "stroke-width": 2 },
        ".marker-target": { fill: "#333333", d: "M 10 0 L 0 5 L 10 10 z" },
      },
    });

    graph.addCell(link);

    paper.on("element:pointerdblclick", function (elementView) {
      const element = elementView.model;

      if (element instanceof UmlClass) {
        setEditingElement(element);
        setEditValues({
          name: element.get("name").join("\n"),
          attributes: element.get("attributes").join("\n"),
          methods: element.get("methods").join("\n"),
        });
      }
    });
  }, []);

  const handleEditChange = (field) => (e) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleEditSubmit = () => {
    if (editingElement && paperRef.current) {
      editingElement.set({
        name: editValues.name.split("\n"),
        attributes: editValues.attributes.split("\n"),
        methods: editValues.methods.split("\n"),
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

  return (
    <div style={{ display: "flex" }}>
      <div ref={graphRef} className="uml-paper" style={{ flex: 1 }}></div>
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
          <h3>Editar la Clase UML</h3>
          <div>
            <label>Nombre de la Clase:</label>
            <textarea
              value={editValues.name}
              onChange={handleEditChange("name")}
              rows={2}
              style={{ width: "100%", marginBottom: "10px" }}
            />
          </div>
          <div>
            <label>Atributos:</label>
            <textarea
              value={editValues.attributes}
              onChange={handleEditChange("attributes")}
              rows={5}
              style={{ width: "100%", marginBottom: "10px" }}
            />
          </div>
          <div>
            <label>Metodos:</label>
            <textarea
              value={editValues.methods}
              onChange={handleEditChange("methods")}
              rows={5}
              style={{ width: "100%", marginBottom: "10px" }}
            />
          </div>
          <button onClick={handleEditSubmit}>Guardar Cambios</button>
        </div>
      )}
    </div>
  );
};

export default UmlDesigner;
