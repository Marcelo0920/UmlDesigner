import { dia } from "jointjs";
import UmlClass from "../components/UmlClass";
import {
  createAggregation,
  createComposition,
  createGeneralization,
  createLink,
} from "./linkCreators";

export const handleClassPositionChanged =
  (id, graphRef, idMappingRef, isRemoteUpdateRef, setIsRemoteUpdate) =>
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
  };

export const handleClassAdded =
  (id, graphRef, setIdMapping) =>
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
  };

export const handleClassDeleted =
  (id, graphRef, idMappingRef, setIdMapping) =>
  ({ diagramId, classId }) => {
    if (diagramId === id && graphRef.current) {
      const jointjsId = idMappingRef.current[classId];
      console.log(jointjsId);
      if (jointjsId) {
        const cell = graphRef.current.getCell(jointjsId);
        if (cell) {
          console.log("removing cell");
          cell.remove();
        }
        setIdMapping((prevMapping) => {
          const newMapping = { ...prevMapping };
          delete newMapping[classId];
          return newMapping;
        });
      }
    }
  };

export const handleClassUpdated =
  (id, graphRef, idMappingRef) =>
  ({ diagramId, classId, updatedClass }) => {
    if (diagramId === id) {
      const jointjsId = idMappingRef.current[classId];

      if (jointjsId) {
        const cell = graphRef.current.getCell(jointjsId);

        if (cell && cell instanceof dia.Element) {
          // Using dia.Element as the base class
          // Update the cell's attributes
          cell.set("name", [updatedClass.name]);
          cell.set("attributes", updatedClass.attributes);
          cell.set("methods", updatedClass.methods);

          // If UmlClass has a custom method to update its shape, call it
          if (typeof cell.updateRectangles === "function") {
            cell.updateRectangles();
          }

          // Update the cell's size to fit the new content
          const padding = 10;
          const newSize = cell.getBBox().inflate(padding);
          cell.resize(newSize.width, newSize.height);

          // Find the view for this cell and update it
          const paperRef = graphRef.current.get("paper");
          if (paperRef) {
            const cellView = paperRef.findViewByModel(cell);
            if (cellView) {
              cellView.update();
              cellView.render();
            }
          }

          // Trigger a manual update of the paper
          graphRef.current.trigger("batch:stop");
        }
      }
    }
  };

export const handleLinkAdded =
  (id, graphRef, paperRef, idMappingRef) =>
  ({ diagramId, newLink }) => {
    if (diagramId === id && graphRef.current) {
      const longitud = newLink.links.length;
      const sourceId = idMappingRef.current[newLink.links[longitud - 1].source];
      const targetId = idMappingRef.current[newLink.links[longitud - 1].target];

      if (sourceId && targetId) {
        let link;
        switch (newLink.links[longitud - 1].linkType) {
          case "composition":
            link = createComposition(sourceId, targetId, graphRef, paperRef);
            break;
          case "aggregation":
            link = createAggregation(sourceId, targetId, graphRef, paperRef);
            break;
          case "generalization":
            link = createGeneralization(sourceId, targetId, graphRef, paperRef);
            break;
          default:
            link = createLink(sourceId, targetId, graphRef, paperRef);
        }
        if (link) {
          link.label(0, { attrs: { text: { text: newLink.linkType } } });
          link.label(1, {
            attrs: { text: { text: newLink.sourceMultiplicity } },
          });
          link.label(2, {
            attrs: { text: { text: newLink.targetMultiplicity } },
          });
          return link.id;
        }
      }
    }
    return null;
  };

export const handleLinkDeleted =
  (id, graphRef, idMappingRef) =>
  ({ diagramId, linkId }) => {
    if (diagramId === id && graphRef.current) {
      const jointjsLinkId = idMappingRef.current[linkId];
      if (jointjsLinkId) {
        const link = graphRef.current.getCell(jointjsLinkId);
        if (link) {
          link.remove();
        }
        return linkId;
      }
    }
    return null;
  };

export const handleLinkUpdated =
  (id, graphRef, idMappingRef) =>
  ({ diagramId, linkId, updatedLink }) => {
    if (diagramId === id && graphRef.current) {
      const jointjsLinkId = idMappingRef.current[linkId];
      if (jointjsLinkId) {
        const link = graphRef.current.getCell(jointjsLinkId);
        if (link) {
          link.label(0, { attrs: { text: { text: updatedLink.linkType } } });
          link.label(1, {
            attrs: { text: { text: updatedLink.sourceMultiplicity } },
          });
          link.label(2, {
            attrs: { text: { text: updatedLink.targetMultiplicity } },
          });
          return true;
        }
      }
    }
    return false;
  };
