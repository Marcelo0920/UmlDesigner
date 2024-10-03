import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { FaPlus, FaTimes } from "react-icons/fa";

import "../styles/home.css";
import ProjectItem from "../components/project/ProjectItem";
import Header from "../components/Header";

import {
  getProjects,
  setDefaultProject,
  createProject,
} from "../actions/project";

const Home = ({
  getProjects,
  setDefaultProject,
  createProject,
  project: { projects, loading },
}) => {
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  useEffect(() => {
    getProjects();
    setDefaultProject();
  }, [getProjects, setDefaultProject]);

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      createProject({ name: newProjectName });
      setNewProjectName("");
      setShowNewProjectForm(false);
    }
  };

  return (
    <div className="home-container">
      <Header />
      <main className="main-content">
        <h1 className="title">Tus Proyectos UML</h1>
        <div className="projects-grid">
          <div
            className="project-card new-project-card"
            onClick={() => setShowNewProjectForm(true)}
          >
            <div className="card-content">
              <FaPlus className="icon" />
              <p>Crear un nuevo proyecto</p>
            </div>
          </div>
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/designer/${project._id}`}
              className="project-card project-link"
            >
              <ProjectItem nombre={project.name} />
            </Link>
          ))}
        </div>
        {showNewProjectForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="close-button"
                onClick={() => setShowNewProjectForm(false)}
              >
                <FaTimes />
              </button>
              <h2>Create New Project</h2>
              <form onSubmit={handleCreateProject}>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  required
                />
                <button type="submit">Create Project</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

Home.propTypes = {
  getProjects: PropTypes.func.isRequired,
  setDefaultProject: PropTypes.func.isRequired,
  createProject: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  project: state.project,
});

export default connect(mapStateToProps, {
  getProjects,
  setDefaultProject,
  createProject,
})(Home);
