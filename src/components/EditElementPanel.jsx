import React from "react";

const EditElementPanel = ({
  editValues,
  handleEditChange,
  handleEditSubmit,
}) => {
  return (
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
      <h3>Edit UML Class</h3>
      <div>
        <label>Class Name:</label>
        <input
          type="text"
          value={editValues.name}
          onChange={handleEditChange("name")}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>Attributes (one per line):</label>
        <textarea
          value={editValues.attributes.join("\n")}
          onChange={handleEditChange("attributes")}
          rows={5}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>Methods (one per line):</label>
        <textarea
          value={editValues.methods.join("\n")}
          onChange={handleEditChange("methods")}
          rows={5}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <button onClick={handleEditSubmit}>Save Changes</button>
    </div>
  );
};

export default EditElementPanel;
