import {
  GET_PROJECT,
  PROJECT_ERROR,
  GET_PROJECTS,
  UPDATE_PROJECT,
  UPDATE_CLASS_POSITION,
  ADD_CLASS,
  ADD_LINK,
  DELETE_CLASS,
  DELETE_LINK,
  SET_DEFAULT,
  POST_PROJECT,
} from "../actions/type.js";

const initialState = {
  projects: [],
  project: null,
  loading: false,
  error: {},
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_PROJECTS:
      return {
        ...state,
        projects: payload,
        error: null,
        loading: false,
      };

    case POST_PROJECT:
      return {
        ...state,
        projects: [payload, ...state.projects],
        loading: false,
      };

    case SET_DEFAULT:
      return {
        ...state,
        project: null,
        loading: false,
        error: {},
      };

    case GET_PROJECT:
      return {
        ...state,
        project: payload,
        error: null,
        loading: false,
      };

    case POST_PROJECT:
      return {
        ...state,
        project: [payload, ...state.projects],
        error: null,
        loading: false,
      };

    case UPDATE_PROJECT:
      return {
        ...state,
        error: null,
        loading: false,
      };

    case UPDATE_CLASS_POSITION:
      return {
        ...state,
        project: state.project
          ? {
              ...state.project,
              classes: state.project.classes.map((cls) =>
                cls._id === payload.classId
                  ? { ...cls, position: payload.position }
                  : cls
              ),
            }
          : null,
        error: null,
        loading: false,
      };

    case ADD_CLASS:
    case ADD_LINK:
    case DELETE_CLASS:
    case DELETE_LINK:
      return {
        ...state,
        error: null,
        loading: false,
      };

    case PROJECT_ERROR:
      return {
        ...state,
        error: payload,
        loading: false,
      };

    default: {
      return state;
    }
  }
}
