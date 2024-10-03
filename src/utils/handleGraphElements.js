import { dia } from "jointjs";
import UmlClass from "../components/UmlClass";

export const handleEditSubmit = (
  editingElement,
  paperRef,
  editValues,
  idMapping,
  updateClass,
  projectId,
  setEditingElement
) => {
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
      updateClass(projectId, mongoDbId, {
        name: editValues.name,
        attributes: editValues.attributes,
        methods: editValues.methods,
      });
    }

    setEditingElement(null);
  }
};

export const handleLinkEditSubmit = (
  editingLink,
  paperRef,
  linkValues,
  idMapping,
  updateLink,
  projectId,
  setEditingLink
) => {
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
      updateLink(projectId, mongoDbId, {
        linkType: linkValues.associationType,
        sourceMultiplicity: linkValues.sourceMultiplicity,
        targetMultiplicity: linkValues.targetMultiplicity,
      });
    }

    setEditingLink(null);
  }
};

export const addNewUmlClass = async (
  graphRef,
  addClass,
  projectId,
  setIdMapping
) => {
  if (graphRef.current) {
    const newClass = {
      name: "NewClass",
      attributes: ["- attribute: Type"],
      methods: ["+ method(): ReturnType"],
      position: { x: 50, y: 50 },
      size: { width: 150, height: 150 },
    };

    try {
      const response = await addClass(projectId, newClass);
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

export const deleteSelectedElement = (
  selectedElement,
  graphRef,
  idMapping,
  deleteClass,
  deleteLink,
  projectId,
  setSelectedElement,
  setEditingElement,
  setEditingLink,
  setIdMapping
) => {
  if (selectedElement && graphRef.current) {
    const updatedSourceGraphId = idMapping[selectedElement.mongoId];

    let cellToRemove = graphRef.current.getCell(updatedSourceGraphId);

    if (!cellToRemove) {
      cellToRemove = graphRef.current.getCell(selectedElement.graphId);
    }

    if (cellToRemove instanceof UmlClass) {
      deleteClass(projectId, selectedElement.mongoId);
    } else if (cellToRemove instanceof dia.Link) {
      deleteLink(projectId, selectedElement.mongoId);
    }
    cellToRemove.remove();
    setSelectedElement(null);
    setEditingElement(null);
    setEditingLink(null);

    // Update idMapping after deletion
    setIdMapping((prevMapping) => {
      const newMapping = { ...prevMapping };
      delete newMapping[selectedElement.mongoId];
      return newMapping;
    });
  }
};
