import React from "react";

const ProjectItem = ({ nombre }) => {
  return (
    <div className="project-item">
      <h4>{nombre}</h4>
    </div>
  );
};

export default ProjectItem;
