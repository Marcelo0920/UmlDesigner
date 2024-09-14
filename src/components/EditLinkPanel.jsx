import React from "react";

const EditLinkPanel = ({
  linkValues,
  handleLinkEditChange,
  handleLinkEditSubmit,
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
      <h3>Edit Association</h3>
      <div>
        <label>Association Type:</label>
        <input
          type="text"
          value={linkValues.associationType}
          onChange={handleLinkEditChange("associationType")}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>Source Multiplicity:</label>
        <input
          type="text"
          value={linkValues.sourceMultiplicity}
          onChange={handleLinkEditChange("sourceMultiplicity")}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <div>
        <label>Target Multiplicity:</label>
        <input
          type="text"
          value={linkValues.targetMultiplicity}
          onChange={handleLinkEditChange("targetMultiplicity")}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
      <button onClick={handleLinkEditSubmit}>Save Changes</button>
    </div>
  );
};

export default EditLinkPanel;
