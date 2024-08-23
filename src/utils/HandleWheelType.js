import React from "react";
import { WHEEL_TYPES } from "../types/wheel.type.config";
import "./HandleWheelType.css";

const HandleWheelType = ({
  updateWheelSelection,
  isMenuActive,
  setIsMenuActive,
}) => {
  const renderWheelSelection = (id, wheel) => {
    const onClick = () => {
      handleWheelSelection(id);
      setIsMenuActive(false);
    };
    return (
      <div key={id}>
        <button type="button" className="btn btn-secondary" onClick={onClick}>
          {wheel}
        </button>
      </div>
    );
  };

  const handleWheelSelection = (id) => {
    updateWheelSelection(id);
  };

  return (
    <div className={isMenuActive ? "reveal" : "hidden"}>
      <div className="wheel-selection">
        {Object.entries(WHEEL_TYPES).map(([id, wheel]) =>
          renderWheelSelection(JSON.parse(id), wheel)
        )}
      </div>
    </div>
  );
};

export default HandleWheelType;
