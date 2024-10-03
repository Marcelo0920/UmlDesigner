import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { io } from "socket.io-client";

import { dia } from "jointjs";
import UmlDesignerButtons from "./UmlDesignerButtons";
import EditElementPanel from "./EditElementPanel";
import EditLinkPanel from "./EditLinkPanel";
import UmlClass from "./UmlClass";
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

import {
  getProject,
  addClass,
  addLink,
  updateClassPosition,
  deleteClass,
  deleteLink,
  updateClass,
  updateLink,
} from "../actions/project";

const UmlDesigner = ({
  getProject,
  addClass,
  updateClass,
  updateLink,
  addLink,
  updateClassPosition,
  deleteClass,
  deleteLink,
  project: { project, loading },
}) => {
  const { id } = useParams();
  const socketRef = useRef();
  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);
  const isRemoteUpdateRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const lastMovedElementRef = useRef(null);

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

  const [idMapping, setIdMapping] = useState({});
  const idMappingRef = useRef({});

  useEffect(() => {
    getProject(id);
  }, [getProject, id]);

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
    // Initialize Socket.IO connection
    socketRef.current = io("https://uml-diagramer-back.onrender.com");

    // Join the project room
    socketRef.current.emit("join-project", id);

    // Listen for real-time updates
    socketRef.current.on("class-added", handleClassAdded);
    socketRef.current.on("class-updated", handleClassUpdated);
    socketRef.current.on("class-deleted", handleClassDeleted);
    socketRef.current.on("class-position-changed", handleClassPositionChanged);

    return () => {
      // Leave the project room and disconnect socket when component unmounts
      socketRef.current.emit("leave-project", id);
      socketRef.current.disconnect();
    };
  }, [id]);

  const handleClassPositionChanged = useCallback(
    ({ diagramId, classId, newPosition }) => {
      if (diagramId === id) {
        isRemoteUpdateRef.current = true;
        setIsRemoteUpdate(true);
        const jointjsId = idMappingRef.current[classId];
        if (jointjsId) {
          const cell = graphRef.current.getCell(jointjsId);
          if (cell && cell instanceof UmlClass) {
            cell.position(newPosition.x, newPosition.y);
          }
        }
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
          setIsRemoteUpdate(false);
        }, 0);
      }
    },
    [id]
  );

  const handleClassAdded = useCallback(
    ({ diagramId, newClass }) => {
      if (diagramId === id && graphRef.current) {
        const umlClass = new UmlClass({
          position: newClass.position,
          size: newClass.size,
          name: newClass.name,
          attributes: newClass.attributes,
          methods: newClass.methods,
        });
        graphRef.current.addCell(umlClass);
        setIdMapping((prevMapping) => {
          const updatedMapping = {
            ...prevMapping,
            [newClass._id]: umlClass.id,
          };
          return updatedMapping;
        });
      }
    },
    [id]
  );

  const handleClassDeleted = useCallback(
    ({ diagramId, classId }) => {
      if (diagramId === id && graphRef.current) {
        const jointjsId = idMappingRef.current[classId];
        if (jointjsId) {
          const cell = graphRef.current.getCell(jointjsId);
          if (cell) {
            cell.remove();
          }
          setIdMapping((prevMapping) => {
            const newMapping = { ...prevMapping };
            delete newMapping[classId];
            return newMapping;
          });
        }
      }
    },
    [id, idMapping]
  );

  const handleClassUpdated = ({ diagramId, classId, updatedClass }) => {
    if (diagramId === id) {
      const jointjsId = idMapping[classId];
      if (jointjsId) {
        const cell = graphRef.current.getCell(jointjsId);
        if (cell) {
          cell.set({
            position: updatedClass.position,
            size: updatedClass.size,
            name: [updatedClass.name],
            attributes: updatedClass.attributes,
            methods: updatedClass.methods,
          });
          cell.updateRectangles();
        }
      }
    }
  };

  useEffect(() => {
    if (project && graphRef.current && paperRef.current && !loading) {
      graphRef.current.clear();
      const newIdMapping = {};

      // Add classes
      project.classes.forEach((classData) => {
        const umlClass = new UmlClass({
          position: classData.position,
          size: classData.size,
          name: [classData.name],
          attributes: classData.attributes,
          methods: classData.methods,
        });
        graphRef.current.addCell(umlClass);
        newIdMapping[classData._id] = umlClass.id;
      });

      // Add links
      project.links.forEach((linkData) => {
        const sourceId = newIdMapping[linkData.source];
        const targetId = newIdMapping[linkData.target];

        if (sourceId && targetId) {
          let linkId;
          switch (linkData.linkType) {
            case "composition":
              linkId = createComposition(
                sourceId,
                targetId,
                graphRef,
                paperRef
              );
              break;
            case "aggregation":
              linkId = createAggregation(
                sourceId,
                targetId,
                graphRef,
                paperRef
              );
              break;
            case "generalization":
              linkId = createGeneralization(
                sourceId,
                targetId,
                graphRef,
                paperRef
              );
              break;
            case "dashed":
              linkId = createDashedLink(sourceId, targetId, graphRef, paperRef);
              break;
            default:
              linkId = createLink(sourceId, targetId, graphRef, paperRef);
          }

          if (linkId) {
            const link = graphRef.current.getCell(linkId);
            if (link) {
              link.label(1, {
                attrs: {
                  text: { text: linkData.sourceMultiplicity || "1..1" },
                },
              });
              link.label(2, {
                attrs: {
                  text: { text: linkData.targetMultiplicity || "1..1" },
                },
              });
            }
            newIdMapping[linkData._id] = linkId;
          }
        }
      });

      // Update the idMapping state
      setIdMapping(newIdMapping);
      idMappingRef.current = newIdMapping;

      // Add event listener for position changes
      const handlePositionChange = (cell) => {
        if (cell instanceof UmlClass && !isRemoteUpdateRef.current) {
          lastMovedElementRef.current = cell;
          // Update the visual position immediately
          const cellView = cell.findView(paperRef.current);
          if (cellView) {
            cellView.update();
          }
        }
      };

      const updateElementPosition = (cell) => {
        const mongoDbId = Object.keys(idMappingRef.current).find(
          (key) => idMappingRef.current[key] === cell.id
        );
        if (mongoDbId) {
          const newPosition = cell.position();
          updateClassPosition(project._id, mongoDbId, newPosition);
          socketRef.current.emit("class-position-changed", {
            diagramId: project._id,
            classId: mongoDbId,
            newPosition: newPosition,
          });
        }
      };

      graphRef.current.on("change:position", handlePositionChange);

      const handleMouseDown = () => {
        isMouseDownRef.current = true;
      };

      const handleMouseUp = () => {
        isMouseDownRef.current = false;
        if (lastMovedElementRef.current) {
          updateElementPosition(lastMovedElementRef.current);
          lastMovedElementRef.current = null;
        }
      };

      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        graphRef.current.off("change:position", handlePositionChange);
        document.removeEventListener("mousedown", handleMouseDown);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [project, loading, updateClassPosition]);

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
          let link;
          const sourceMongoId = Object.keys(idMapping).find(
            (key) => idMapping[key] === sourceElement.id
          );
          const targetMongoId = Object.keys(idMapping).find(
            (key) => idMapping[key] === element.id
          );

          if (isLinkMode) {
            link = createLink(sourceElement.id, element.id, graphRef);
          } else if (isCompositionMode) {
            link = createComposition(sourceElement.id, element.id, graphRef);
          } else if (isAggregationMode) {
            link = createAggregation(sourceElement.id, element.id, graphRef);
          } else if (isGeneralizationMode) {
            link = createGeneralization(sourceElement.id, element.id, graphRef);
          } else if (isIntermediateClassMode) {
            link = createIntermediateClass(
              sourceElement,
              element,
              graphRef,
              paperRef
            );
          }

          addLink(id, {
            source: sourceMongoId,
            target: targetMongoId,
            linkType: isLinkMode
              ? "association"
              : isCompositionMode
              ? "composition"
              : isAggregationMode
              ? "aggregation"
              : "generalization",
          });

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
      id,
      addLink,
      idMapping,
    ]
  );

  useEffect(() => {
    if (graphRef.current && paperRef.current) {
      const handlePositionChange = (cell) => {
        if (cell instanceof UmlClass && !isRemoteUpdateRef.current) {
          cell.set("isMoving", true);
          // The position change is already applied to the cell,
          // so we don't need to do anything here for smooth movement
        }
      };

      const updateElementPosition = (cell) => {
        const mongoDbId = Object.keys(idMappingRef.current).find(
          (key) => idMappingRef.current[key] === cell.id
        );
        if (mongoDbId) {
          const newPosition = cell.position();
          console.log("Saving position update");
          updateClassPosition(id, mongoDbId, newPosition);
          socketRef.current.emit("class-position-changed", {
            diagramId: id,
            classId: mongoDbId,
            newPosition: newPosition,
          });
        }
      };

      graphRef.current.on("change:position", handlePositionChange);

      const handleMouseDown = (evt) => {
        if (evt.target.closest(".uml-paper")) {
          isMouseDownRef.current = true;
        }
      };

      const handleMouseUp = (evt) => {
        if (isMouseDownRef.current) {
          isMouseDownRef.current = false;
          const lastMovedElement = graphRef.current
            .getElements()
            .find((el) => el.get("isMoving"));
          if (lastMovedElement) {
            updateElementPosition(lastMovedElement);
            lastMovedElement.set("isMoving", false);
          }
        }
      };

      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        graphRef.current.off("change:position", handlePositionChange);
        document.removeEventListener("mousedown", handleMouseDown);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [id, updateClassPosition]);

  useEffect(() => {
    socketRef.current.on("class-position-changed", handleClassPositionChanged);

    return () => {
      socketRef.current.off(
        "class-position-changed",
        handleClassPositionChanged
      );
    };
  }, [handleClassPositionChanged]);

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

      // Save changes to the database
      const mongoDbId = Object.keys(idMapping).find(
        (key) => idMapping[key] === editingElement.id
      );
      if (mongoDbId) {
        updateClass(project._id, mongoDbId, {
          name: editValues.name,
          attributes: editValues.attributes,
          methods: editValues.methods,
        });

        socketRef.current.emit("class-updated", {
          diagramId: project._id,
          classId: mongoDbId,
          updatedClass: {
            name: editValues.name,
            attributes: editValues.attributes,
            methods: editValues.methods,
          },
        });
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

      // Save changes to the database
      const mongoDbId = Object.keys(idMapping).find(
        (key) => idMapping[key] === editingLink.id
      );
      if (mongoDbId) {
        updateLink(project._id, mongoDbId, {
          linkType: linkValues.associationType,
          sourceMultiplicity: linkValues.sourceMultiplicity,
          targetMultiplicity: linkValues.targetMultiplicity,
        });
      }

      setEditingLink(null);
    }
  };

  const addNewUmlClass = async () => {
    if (graphRef.current) {
      const newClass = {
        name: "NewClass",
        attributes: ["- attribute: Type"],
        methods: ["+ method(): ReturnType"],
        position: { x: 50, y: 50 },
        size: { width: 150, height: 150 },
      };

      try {
        const response = await addClass(id, newClass);
        const addedClass = response.classes[response.data.classes.length - 1];

        const umlClass = new UmlClass({
          position: addedClass.position,
          size: addedClass.size,
          name: [addedClass.name],
          attributes: addedClass.attributes,
          methods: addedClass.methods,
        });
        graphRef.current.addCell(umlClass);

        setIdMapping((prevMapping) => ({
          ...prevMapping,
          [addedClass._id]: umlClass.id,
        }));
      } catch (error) {
        console.error("Error adding new class:", error);
      }
    }
  };

  const deleteSelectedElement = useCallback(() => {
    if (selectedElement && graphRef.current) {
      const mongoDbId = Object.keys(idMapping).find(
        (key) => idMapping[key] === selectedElement.id
      );
      if (mongoDbId) {
        if (selectedElement instanceof UmlClass) {
          deleteClass(id, mongoDbId);
          socketRef.current.emit("class-deleted", {
            diagramId: id,
            classId: mongoDbId,
          });
        } else if (selectedElement instanceof dia.Link) {
          deleteLink(id, mongoDbId);
        }
        selectedElement.remove();
        setSelectedElement(null);
        setEditingElement(null);
        setEditingLink(null);

        // Update idMapping after deletion
        setIdMapping((prevMapping) => {
          const newMapping = { ...prevMapping };
          delete newMapping[mongoDbId];
          return newMapping;
        });
      }
    }
  }, [selectedElement, graphRef, idMapping, deleteClass, deleteLink, id]);

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
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

UmlDesigner.propTypes = {
  getProject: PropTypes.func.isRequired,
  addClass: PropTypes.func.isRequired,
  addLink: PropTypes.func.isRequired,
  updateClassPosition: PropTypes.func.isRequired,
  deleteClass: PropTypes.func.isRequired,
  deleteLink: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
  updateClass: PropTypes.func.isRequired,
  updateLink: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  project: state.project,
});

export default connect(mapStateToProps, {
  getProject,
  addClass,
  addLink,
  updateClassPosition,
  deleteClass,
  deleteLink,
  updateClass,
  updateLink,
})(UmlDesigner);
