import React from "react";
import { FaProjectDiagram } from "react-icons/fa";
import "../styles/projectItem.css";

const ProjectItem = ({ nombre }) => {
  return (
    <div className="card-content">
      <FaProjectDiagram className="icon" />
      <h3>{nombre}</h3>
    </div>
  );
};

export default ProjectItem;
