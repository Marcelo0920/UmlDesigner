import axios from "axios";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

import {
  GET_PROJECT,
  PROJECT_ERROR,
  GET_PROJECTS,
  POST_PROJECT,
  UPDATE_PROJECT,
  ADD_CLASS,
  ADD_LINK,
  DELETE_CLASS,
  UPDATE_CLASS_POSITION,
  DELETE_LINK,
  UPDATE_CLASS,
  UPDATE_LINK,
  SET_DEFAULT,
} from "./type";

const socket = io("http://localhost:5000");

export const createProject = (projectData) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    console.log(projectData);

    const res = await axios.post(
      "http://localhost:5000/diagrams/",
      projectData
    );

    console.log(res);

    dispatch({
      type: POST_PROJECT,
      payload: res.data,
    });
  } catch (error) {
    dispatch({
      type: PROJECT_ERROR,
      payload: {
        msg: error.response ? error.response.data : "Network Error",
        status: error.response ? error.response.status : null,
      },
    });
  }
};

export const getProjects = () => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.get("http://localhost:5000/diagrams/", config);

    dispatch({
      type: GET_PROJECTS,
      payload: res.data,
    });
  } catch (error) {
    dispatch({
      type: PROJECT_ERROR,
      payload: {
        msg: error.response ? error.response.data : "Network Error",
        status: error.response ? error.response.status : null,
      },
    });
  }
};

export const getProject = (id) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.get(`http://localhost:5000/diagrams/${id}`, config);

    dispatch({
      type: GET_PROJECT,
      payload: res.data,
    });
  } catch (error) {
    dispatch({
      type: PROJECT_ERROR,
      payload: {
        msg: error.response ? error.response.data : "Network Error",
        status: error.response ? error.response.status : null,
      },
    });
  }
};

export const addClass = (diagramId, classData) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.post(
      `http://localhost:5000/diagrams/${diagramId}/classes`,
      classData,
      config
    );

    dispatch({
      type: ADD_CLASS,
      payload: res.data,
    });

    return res.data;
  } catch (error) {
    dispatch({
      type: PROJECT_ERROR,
      payload: {
        msg: error.response ? error.response.data : "Network Error",
        status: error.response ? error.response.status : null,
      },
    });
    throw error;
  }
};

export const deleteClass = (diagramId, classId) => async (dispatch) => {
  try {
    console.log("Sending delete request for class:", classId);
    await axios.delete(
      `http://localhost:5000/diagrams/${diagramId}/classes/${classId}`
    );

    dispatch({
      type: DELETE_CLASS,
      payload: { diagramId, classId },
    });
  } catch (error) {
    dispatch({
      type: PROJECT_ERROR,
      payload: {
        msg: error.response ? error.response.data : "Network Error",
        status: error.response ? error.response.status : null,
      },
    });
  }
};

export const addLink = (diagramId, linkData) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.post(
      `http://localhost:5000/diagrams/${diagramId}/links`,
      linkData,
      config
    );

    dispatch({
      type: ADD_LINK,
      payload: res.data,
    });

    // Emit socket event for real-time update
    socket.emit("link-added", { diagramId, newLink: res.data });

    return res.data;
  } catch (error) {
    dispatch({
      type: PROJECT_ERROR,
      payload: {
        msg: error.response ? error.response.data : "Network Error",
        status: error.response ? error.response.status : null,
      },
    });
    throw error;
  }
};

export const deleteLink = (diagramId, linkId) => async (dispatch) => {
  try {
    await axios.delete(
      `http://localhost:5000/diagrams/${diagramId}/links/${linkId}`
    );

    dispatch({
      type: DELETE_LINK,
      payload: { diagramId, linkId },
    });

    // Emit socket event for real-time update
    socket.emit("link-deleted", { diagramId, linkId });
  } catch (error) {
    dispatch({
      type: PROJECT_ERROR,
      payload: {
        msg: error.response ? error.response.data : "Network Error",
        status: error.response ? error.response.status : null,
      },
    });
  }
};

export const updateClassPosition =
  (diagramId, classId, position) => async (dispatch) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const res = await axios.put(
        `http://localhost:5000/diagrams/${diagramId}/classes/${classId}/position`,
        { position },
        config
      );

      const updateId = uuidv4();

      dispatch({
        type: UPDATE_CLASS_POSITION,
        payload: { diagramId, classId, position, updateId },
      });

      // Emit socket event with updateId
      socket.emit("class-position-changed", {
        diagramId,
        classId,
        newPosition: position,
        updateId,
      });

      return res.data;
    } catch (error) {
      console.error("Error updating class position:", error);
      dispatch({
        type: PROJECT_ERROR,
        payload: {
          msg: error.response ? error.response.data : "Network Error",
          status: error.response ? error.response.status : null,
        },
      });
      throw error;
    }
  };

export const updateClass =
  (diagramId, classId, classData) => async (dispatch) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const res = await axios.put(
        `http://localhost:5000/diagrams/${diagramId}/classes/${classId}`,
        classData,
        config
      );

      dispatch({
        type: UPDATE_CLASS,
        payload: res.data,
      });
    } catch (error) {
      dispatch({
        type: PROJECT_ERROR,
        payload: {
          msg: error.response ? error.response.data : "Network Error",
          status: error.response ? error.response.status : null,
        },
      });
    }
  };

export const updateLink = (diagramId, linkId, linkData) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.put(
      `http://localhost:5000/diagrams/${diagramId}/links/${linkId}`,
      linkData,
      config
    );

    dispatch({
      type: UPDATE_LINK,
      payload: res.data,
    });
    socket.emit("link-updated", { diagramId, linkId, updatedLink: res.data });
  } catch (error) {
    dispatch({
      type: PROJECT_ERROR,
      payload: {
        msg: error.response ? error.response.data : "Network Error",
        status: error.response ? error.response.status : null,
      },
    });
  }
};

export const setDefaultProject = () => async (dispatch) => {
  try {
    dispatch({
      type: SET_DEFAULT,
    });
  } catch (error) {
    dispatch({
      type: PROJECT_ERROR,
      payload: {
        msg: error.response ? error.response.data : "Network Error",
        status: error.response ? error.response.status : null,
      },
    });
  }
};
