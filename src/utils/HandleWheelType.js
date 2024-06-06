import React from "react";
import { WheelTypes } from "../types/wheel.config";
import "./HandleWheelType.css";

const HandleWheelType = ({
  updateWheelSelection,
  isMenuActive,
  setIsMenuActive,
  firstLoad,
}) => {
  const renderWheelSelection = (id, wheel) => {
    const onClick = () => {
      handleWheelSelection(id);
      setIsMenuActive(false);
    };
    return (
      <div>
        <button type="button" className={`btn btn-secondary`} onClick={onClick}>
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
        {Object.entries(WheelTypes).map(([id, wheel]) =>
          renderWheelSelection(JSON.parse(id), wheel)
        )}
      </div>
    </div>
  );
};

export default HandleWheelType;
