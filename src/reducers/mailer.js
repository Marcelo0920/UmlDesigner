import { EMAIL_START, SEND_MAIL, SET_DEFAULT_EMAIL } from "../actions/type";

const initialState = {
  mail: {},
  loading: false,
  error: {},
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case SEND_MAIL:
      return {
        ...state,
        mail: payload,
        loading: false,
      };

    case SET_DEFAULT_EMAIL:
      return {
        ...state,
        mail: {},
        loading: false,
        error: null,
      };

    case EMAIL_START:
      return {
        ...state,
        loading: true,
      };

    default:
      return state;
  }
}
