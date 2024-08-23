import React, { useState, useEffect } from "react";
import {
  WHEEL_STRUCTURE,
  QUADRANT_PATHS,
} from "../types/wheel.structure.config";
import { WHEEL_STROKE } from "../types/branding.config";
import "./QuadrantGenerator.css";

import {
  getWheelDimensions,
  getWheelWidthUnits,
  getWheelPosition,
  getDiameter,
} from "../utils/dimensions.js";

const Quadrant = ({ path, fill, onClick, wheelId }) => (
  <path d={path} stroke={WHEEL_STROKE[wheelId]} fill={fill} onClick={onClick} />
);

export const QuadrantGenerator = ({
  onQuadrantClick,
  fillColours,
  wheelId,
  wheelRef,
  setWheelTop,
}) => {
  const [screenSize, setScreenSize] = useState({
    width: window.screen.width,
    height: window.screen.height,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.screen.width,
        height: window.screen.height,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array to run this effect only once on mount

  useEffect(() => {
    const positionWheel = () => {
      const wheel = wheelRef.current;
      if (!wheel) return;

      const diameter = getDiameter(screenSize);
      const { width, height } = getWheelDimensions(screenSize, diameter);
      const { left, top } = getWheelPosition(screenSize, width);
      setWheelTop(top);
      wheel.style.position = "absolute";
      wheel.style.width = getWheelWidthUnits(screenSize, width);
      wheel.style.height = `${height}px`;
      wheel.style.left = left;
      wheel.style.top = top;
    };

    positionWheel();
  }, [screenSize, setWheelTop, wheelRef]); // Only run this effect when screenSize or wheelRef changes

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
