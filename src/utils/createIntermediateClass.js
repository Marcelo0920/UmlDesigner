import { dia, elementTools } from "jointjs";
import UmlClass from "../components/UmlClass";
import { createDashedLink, createLink } from "./linkCreators";

const createIntermediateClass = (source, target, graphRef, paperRef) => {
  if (graphRef.current && paperRef.current) {
    const sourcePosition = source.position();
    const targetPosition = target.position();
    const midX = (sourcePosition.x + targetPosition.x) / 2;
    const midY = (sourcePosition.y + targetPosition.y) / 2;

    // Crear la clase intermedia
    const intermediateClass = new UmlClass({
      position: { x: midX, y: midY + 100 }, // Posiciona ligeramente por debajo del punto medio
      size: { width: 200, height: 100 },
      name: "IntermediateClass",
      attributes: [],
      methods: [],
    });

    graphRef.current.addCell(intermediateClass);

    // Crear el enlace directo entre origen y destino
    const directLink = createLink(source.id, target.id, graphRef);

    // Crear el enlace punteado hacia la clase intermedia
    createDashedLink(directLink, intermediateClass.id, graphRef);

    // Añadir herramienta de eliminación a la clase intermedia
    const elementView = intermediateClass.findView(paperRef.current);
    elementView.addTools(
      new dia.ToolsView({
        tools: [new elementTools.Remove({ offset: { x: 10, y: 10 } })],
      })
    );
  }
};

export default createIntermediateClass;
