import React, { useEffect } from "react";
import {
  WHEEL_STRUCTURE,
  QUADRANT_PATHS,
} from "../types/wheel.structure.config";
import { WHEEL_STROKE } from "../types/branding.config";
import "./QuadrantGenerator.css";

import { getWheelWidthUnits, isTabletScreen } from "../utils/dimensions.js";

const Quadrant = ({ path, fill, onClick, wheelId }) => (
  <path d={path} stroke={WHEEL_STROKE[wheelId]} fill={fill} onClick={onClick} />
);

export const QuadrantGenerator = ({
  onQuadrantClick,
  fillColours,
  wheelId,
  wheelRef,
  screenSize,
  wheelSize,
}) => {
  useEffect(() => {
    const positionWheel = () => {
      const wheel = wheelRef.current;
      if (!wheel) return;
      const isTablet = isTabletScreen(screenSize.width);

      wheel.style.position = "absolute";
      wheel.style.width = getWheelWidthUnits(screenSize, wheelSize.wheelWidth);
      wheel.style.height = `${wheelSize.wheelHeight}px`;
      wheel.style.left = `${wheelSize.wheelLeft}${isTablet ? "px" : "vw"}`;
      wheel.style.top = `${wheelSize.wheelTop}px`;
    };

    positionWheel();
  }, [
    screenSize,
    wheelRef,
    wheelSize.wheelHeight,
    wheelSize.wheelLeft,
    wheelSize.wheelTop,
    wheelSize.wheelWidth,
  ]); // Only run this effect when screenSize or wheelRef changes

  const renderQuadrant = (sliceId, levelId) => {
    const path = QUADRANT_PATHS[sliceId][levelId];
    const fill = fillColours[sliceId][levelId];
    return (
      <Quadrant
        key={`${wheelId}_${sliceId}_${levelId}`}
        path={path}
        fill={fill}
        onClick={() => onQuadrantClick(sliceId, levelId)}
        wheelId={wheelId}
      />
    );
  };

  return (
    <svg
      ref={wheelRef}
      id="wheel"
      viewBox="0 0 1004 1006"
      xmlns="http://www.w3.org/2000/svg"
    >
      {WHEEL_STRUCTURE.Levels.map((levelId) =>
        WHEEL_STRUCTURE.Slices.map((sliceId) =>
          renderQuadrant(sliceId, levelId)
        )
      )}
    </svg>
  );
};
