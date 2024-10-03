import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import {
  sendMail,
  startMailSending,
  setDefaultMailStatus,
} from "../actions/mailer";

import "../styles/modal.css";

const ShareProjectModal = ({
  isOpen,
  onClose,
  projectId,
  sendMail,
  startMailSending,
  setDefaultMailStatus,
  mailer: { mail, loading },
}) => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    url: "",
  });

  useEffect(() => {
    const fullProjectUrl = `${window.location.origin}/designer/${projectId}`;
    setFormData((prevData) => ({ ...prevData, url: fullProjectUrl }));
  }, [projectId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    startMailSending();
    sendMail(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Compartir Proyecto</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre del destinatario"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email del destinatario"
            required
          />
          <p>URL del proyecto: {projectId}</p>
          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Invitación"}
          </button>
        </form>
        {mail.mensaje && <p>{mail.mensaje}</p>}
        <button
          onClick={() => {
            onClose();
            setDefaultMailStatus();
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  mailer: state.mailer,
});

export default connect(mapStateToProps, {
  sendMail,
  startMailSending,
  setDefaultMailStatus,
})(ShareProjectModal);
