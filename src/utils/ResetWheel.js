import React from "react";
import "./ResetWheel.css";

import { shouldHide } from "../utils/dimensions";

export const ResetWheel = ({ resetAllWheels, resetWheel, screenSize }) => {
  return (
    <div className="rest-content">
      <div className="reset-btn">
        <button
          type="button"
          title="reset wheel"
          className="btn btn-light btn-txt"
          onClick={resetWheel}
        >
          Reset
        </button>
        <span className={shouldHide(screenSize)}>
          <button
            type="button"
            className={`btn btn-light btn-txt }`}
            title="reset all wheels"
            onClick={resetAllWheels}
          >
            Reset All
          </button>
        </span>
      </div>
    </div>
  );
};
