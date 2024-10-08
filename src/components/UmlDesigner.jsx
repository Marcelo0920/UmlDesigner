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
  createDashedLink,
  createDependency,
  createGeneralization,
  createIntermediateClassLinks,
  createLink,
} from "../utils/linkCreators";
import createIntermediateClass from "../utils/createIntermediateClass";
import exportToXml from "../utils/exportToXml";
import { exportUmlDesign } from "../utils/exportUmlDesign";
import { importDiagram } from "../utils/importDiagram";

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
import {
  handleClassAdded,
  handleClassDeleted,
  handleClassPositionChanged,
  handleClassUpdated,
  handleLinkAdded,
  handleLinkDeleted,
  handleLinkUpdated,
} from "../utils/handleClassSocket";
import {
  addNewUmlClass,
  deleteSelectedElement,
  handleEditSubmit,
  handleLinkEditSubmit,
} from "../utils/handleGraphElements";

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
  const isDraggingRef = useRef(false);

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
  const [isDependenciaMode, setisDependencyMode] = useState(false);
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

  Object.keys(idMappingRef.current).find((key) => {
    idMappingRef.current[key];
  });

  useEffect(() => {
    // Initialize Socket.IO connection
    socketRef.current = io("http://localhost:5000");

    // Join the project room
    socketRef.current.emit("join-project", id);

    // Listen for real-time updates
    socketRef.current.on("class-added", handleClassAddedCallback);
    socketRef.current.on("class-updated", handleClassUpdatedCallback);
    socketRef.current.on("class-deleted", handleClassDeletedCallback);
    socketRef.current.on(
      "class-position-changed",
      handleClassPositionChangedCallback
    );
    socketRef.current.on("link-added", handleLinkAddedCallback);
    socketRef.current.on("link-deleted", handleLinkDeletedCallback);
    socketRef.current.on("link-updated", handleLinkUpdatedCallback);

    return () => {
      // Leave the project room and disconnect socket when component unmounts
      socketRef.current.emit("leave-project", id);
      socketRef.current.disconnect();
    };
  }, [id]);

  const handleLinkAddedCallback = useCallback(
    handleLinkAdded(id, graphRef, paperRef, idMappingRef),
    [id]
  );

  const handleLinkDeletedCallback = useCallback(
    handleLinkDeleted(id, graphRef, idMappingRef),
    [id]
  );

  const handleLinkUpdatedCallback = useCallback(
    handleLinkUpdated(id, graphRef, idMappingRef),
    [id]
  );

  const handleClassPositionChangedCallback = useCallback(
    handleClassPositionChanged(
      id,
      graphRef,
      idMappingRef,
      isRemoteUpdateRef,
      setIsRemoteUpdate
    ),
    [id]
  );

  const handleClassAddedCallback = useCallback(
    handleClassAdded(id, graphRef, setIdMapping),
    [id]
  );

  const handleClassDeletedCallback = useCallback(
    handleClassDeleted(id, graphRef, idMappingRef, setIdMapping),
    [id, idMapping]
  );

  const handleClassUpdatedCallback = useCallback(
    handleClassUpdated(id, graphRef, idMappingRef, idMapping),
    [id, idMappingRef, idMapping]
  );

  const getPartialId = (fullId) => fullId.slice(0, -1);

  useEffect(() => {
    if (project && graphRef.current && paperRef.current && !loading) {
      if (Object.keys(idMapping).length === 0) {
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
              case "dependency":
                linkId = createDependency(
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

              case "intermediate":
                // Find the intermediate class
                const intermediateClassId = Object.entries(newIdMapping).find(
                  ([key, value]) =>
                    getPartialId(key).startsWith(getPartialId(linkData._id))
                )?.[1];

                console.log("New ID Mapping:", newIdMapping);
                console.log("Intermediate Class ID:", intermediateClassId);
                console.log("Link Data:", linkData);

                if (intermediateClassId) {
                  // Create the direct link between source and target
                  console.log("intermediate class");
                  const directLinkId = createLink(
                    sourceId,
                    targetId,
                    graphRef,
                    paperRef
                  );

                  // Create the dashed link from the direct link to the intermediate class
                  const dashedLinkId = createDashedLink(
                    directLinkId,
                    intermediateClassId,
                    graphRef,
                    paperRef
                  );

                  // Store both link IDs in the mapping
                  newIdMapping[linkData._id] = { directLinkId, dashedLinkId };

                  // Ensure links are added to the graph
                  const directLink = graphRef.current.getCell(directLinkId);
                  const dashedLink = graphRef.current.getCell(dashedLinkId);
                  console.log(directLink);
                  console.log(dashedLink);
                  if (!graphRef.current.getCell(directLinkId)) {
                    graphRef.current.addCell(directLink);
                  }
                  if (!graphRef.current.getCell(dashedLinkId)) {
                    graphRef.current.addCell(dashedLink);
                  }
                } else {
                  console.error(
                    "Intermediate class not found:",
                    linkData.intermediateClass._id
                  );
                }
                break;
              default:
                linkId = createLink(sourceId, targetId, graphRef, paperRef);
            }

            if (linkId) {
              const link = graphRef.current.getCell(linkId);
              if (link) {
                link.label(0, {
                  position: 0.5,
                  attrs: { text: { text: linkData.linkType } },
                });
                link.label(1, {
                  position: 0.1,
                  attrs: { text: { text: linkData.sourceMultiplicity || "1" } },
                });
                link.label(2, {
                  position: 0.9,
                  attrs: { text: { text: linkData.targetMultiplicity || "1" } },
                });
              }
              if (linkData.linkType !== "intermediate") {
                newIdMapping[linkData._id] = linkId;
              }
            }
          }
        });

        // Update the idMapping state
        setIdMapping(newIdMapping);
        idMappingRef.current = newIdMapping;

        // Add event listener for position changes
        paperRef.current.on("cell:pointerdown", (cellView, evt, x, y) => {
          if (cellView.model instanceof UmlClass) {
            isDraggingRef.current = true;
          }
        });

        paperRef.current.on("cell:pointerup", (cellView, evt, x, y) => {
          if (cellView.model instanceof UmlClass) {
            isDraggingRef.current = false;
            const cell = cellView.model;
            const mongoDbId = Object.keys(idMappingRef.current).find(
              (key) => idMappingRef.current[key] === cell.id
            );
            if (mongoDbId && !isRemoteUpdateRef.current) {
              const newPosition = cell.position();
              updateClassPosition(project._id, mongoDbId, newPosition);
            }
          }
        });
      }
    }
  }, [project, loading, updateClassPosition, id]);

  const handleImportDiagram = useCallback(
    (xmlContent) => {
      importDiagram(xmlContent, graphRef, paperRef, addClass, addLink, id);
    },
    [graphRef, paperRef, addClass, addLink, id]
  );

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

      // Find the MongoDB ID for the clicked element
      const elementMongoId = Object.keys(idMapping).find(
        (key) => idMapping[key] === element.id
      );

      if (!elementMongoId) {
        console.error("Unable to find MongoDB ID for clicked element");
        return;
      }

      if (
        isLinkMode ||
        isCompositionMode ||
        isAggregationMode ||
        isGeneralizationMode ||
        isDependenciaMode ||
        isIntermediateClassMode
      ) {
        if (!sourceElement) {
          setSourceElement({ graphId: element.id, mongoId: elementMongoId });
        } else {
          const updatedSourceGraphId = idMapping[sourceElement.mongoId];

          if (!updatedSourceGraphId) {
            console.error("Unable to find updated graph ID for source element");
            return;
          }

          let linkData;
          if (isLinkMode) {
            linkData = { linkType: "association" };
          } else if (isCompositionMode) {
            linkData = { linkType: "composition" };
          } else if (isAggregationMode) {
            linkData = { linkType: "aggregation" };
          } else if (isGeneralizationMode) {
            linkData = { linkType: "generalization" };
          } else if (isDependenciaMode) {
            linkData = { linkType: "dependency" };
          } else if (isIntermediateClassMode) {
            linkData = createIntermediateClass(
              updatedSourceGraphId,
              element.id,
              graphRef,
              paperRef,
              idMappingRef,
              id
            );
          }

          console.log("Link data before addLink:", linkData);

          if (linkData) {
            addLink(id, {
              source: sourceElement.mongoId,
              target: elementMongoId,
              ...linkData,
            });
          } else {
            console.error("Failed to create link");
          }

          setSourceElement(null);
          setIsLinkMode(false);
          setIsCompositionMode(false);
          setIsAggregationMode(false);
          setIsGeneralizationMode(false);
          setisDependencyMode(false);
          setIsIntermediateClassMode(false);
        }
      } else {
        setSelectedElement({ graphId: element.id, mongoId: elementMongoId });
      }
    },
    [
      isLinkMode,
      isCompositionMode,
      isAggregationMode,
      isGeneralizationMode,
      isDependenciaMode,
      isIntermediateClassMode,
      sourceElement,
      id,
      addLink,
      idMapping,
      graphRef,
      paperRef,
    ]
  );

  useEffect(() => {
    if (graphRef.current && paperRef.current) {
      const handlePositionChange = (cell) => {
        if (cell instanceof UmlClass && !isRemoteUpdateRef.current) {
          const mongoDbId = Object.keys(idMappingRef.current).find(
            (key) => idMappingRef.current[key] === cell.id
          );
          if (mongoDbId) {
            const newPosition = cell.position();

            // Emit real-time update to all clients
            socketRef.current.emit("class-position-changed", {
              diagramId: id,
              classId: mongoDbId,
              newPosition: newPosition,
            });

            // Only save to server if not dragging
            if (!isDraggingRef.current) {
              updateClassPosition(id, mongoDbId, newPosition);
            }
          }
        }
      };

      graphRef.current.on("change:position", handlePositionChange);

      return () => {
        graphRef.current?.off("change:position", handlePositionChange);
      };
    }
  }, [id, updateClassPosition]);

  useEffect(() => {
    const handleRemotePositionChange = ({
      diagramId,
      classId,
      newPosition,
    }) => {
      if (diagramId === id) {
        isRemoteUpdateRef.current = true;
        const jointjsId = idMappingRef.current[classId];
        if (jointjsId) {
          const cell = graphRef.current.getCell(jointjsId);
          if (cell && cell instanceof UmlClass) {
            cell.position(newPosition.x, newPosition.y);
          }
        }
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 0);
      }
    };

    socketRef.current.on("class-position-changed", handleRemotePositionChange);

    return () => {
      socketRef.current.off(
        "class-position-changed",
        handleRemotePositionChange
      );
    };
  }, [id]);

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
    setisDependencyMode(false);
    setSourceElement(null);
  }, []);

  const handleExportToXml = () => {
    exportToXml(graphRef);
  };

  const handleLinkClick = (linkView) => {
    const link = linkView.model;

    const elementMongoId = Object.keys(idMappingRef.current).find(
      (key) => idMappingRef.current[key] === link.id
    );

    setSelectedElement({ graphId: link.id, mongoId: elementMongoId });
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

  const handleEditSubmitCallback = useCallback(() => {
    handleEditSubmit(
      editingElement,
      paperRef,
      editValues,
      idMapping,
      updateClass,
      id,
      setEditingElement
    );
  }, [editingElement, paperRef, editValues, idMapping, updateClass, id]);

  const handleLinkEditSubmitCallback = useCallback(() => {
    handleLinkEditSubmit(
      editingLink,
      paperRef,
      linkValues,
      idMapping,
      updateLink,
      id,
      setEditingLink
    );
  }, [editingLink, paperRef, linkValues, idMapping, updateLink, id]);

  const addNewUmlClassCallback = useCallback(() => {
    addNewUmlClass(graphRef, addClass, id, setIdMapping);
  }, [graphRef, addClass, id]);

  const deleteSelectedElementCallback = useCallback(() => {
    deleteSelectedElement(
      selectedElement,
      graphRef,
      idMapping,
      deleteClass,
      deleteLink,
      id,
      setSelectedElement,
      setEditingElement,
      setEditingLink,
      setIdMapping
    );
  }, [selectedElement, graphRef, idMapping, deleteClass, deleteLink, id]);

  const handleExportUmlDesign = () => {
    exportUmlDesign(graphRef);
  };

  const toggleLinkMode = useCallback(() => {
    setIsLinkMode((prev) => !prev);
    setIsCompositionMode(false);
    setIsAggregationMode(false);
    setIsGeneralizationMode(false);
    setisDependencyMode(false);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  const toggleCompositionMode = useCallback(() => {
    setIsCompositionMode((prev) => !prev);
    setIsLinkMode(false);
    setIsAggregationMode(false);
    setIsGeneralizationMode(false);
    setisDependencyMode(false);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  const toggleAggregationMode = useCallback(() => {
    setIsAggregationMode((prev) => !prev);
    setIsLinkMode(false);
    setIsCompositionMode(false);
    setIsGeneralizationMode(false);
    setisDependencyMode(false);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  const toggleGeneralizationMode = useCallback(() => {
    setIsGeneralizationMode((prev) => !prev);
    setIsLinkMode(false);
    setIsCompositionMode(false);
    setIsAggregationMode(false);
    setisDependencyMode(false);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  const toggleDependencyMode = useCallback(() => {
    setisDependencyMode((prev) => !prev);
    setIsLinkMode(false);
    setIsCompositionMode(false);
    setIsAggregationMode(false);
    setIsGeneralizationMode(false);
    setIsIntermediateClassMode(false);
    setSourceElement(null);
  }, []);

  return (
    <div className="uml-designer-container">
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <UmlDesignerButtons
            addNewUmlClass={addNewUmlClassCallback}
            toggleLinkMode={toggleLinkMode}
            isLinkMode={isLinkMode}
            toggleCompositionMode={toggleCompositionMode}
            isCompositionMode={isCompositionMode}
            toggleAggregationMode={toggleAggregationMode}
            isAggregationMode={isAggregationMode}
            toggleGeneralizationMode={toggleGeneralizationMode}
            isGeneralizationMode={isGeneralizationMode}
            toggleDependencyMode={toggleDependencyMode}
            isDependenciaMode={isDependenciaMode}
            exportUmlDesign={handleExportUmlDesign}
            exportToXml={handleExportToXml}
            toggleIntermediateClassMode={toggleIntermediateClassMode}
            isIntermediateClassMode={isIntermediateClassMode}
            deleteSelectedElement={deleteSelectedElementCallback}
            selectedElement={selectedElement}
            importDiagram={handleImportDiagram}
            projectId={id}
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
                handleEditSubmit={handleEditSubmitCallback}
              />
            )}
            {editingLink && (
              <EditLinkPanel
                linkValues={linkValues}
                handleLinkEditChange={handleLinkEditChange}
                handleLinkEditSubmit={handleLinkEditSubmitCallback}
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
