import React from "react";
import "./ResetWheel.css";

export const ResetWheel = ({ resetAllWheels, resetWheel }) => {
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
        <button
          type="button"
          className="btn btn-light btn-txt"
          title="reset all wheels"
          onClick={resetAllWheels}
        >
          Reset All
        </button>
      </div>
    </div>
  );
};
