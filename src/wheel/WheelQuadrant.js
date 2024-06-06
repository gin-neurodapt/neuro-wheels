import React from "react";
import { WheelStructure, QuadrantPaths } from "../types/wheelStructure";
import { WheelTypeColourOutline } from "../types/branding.config";
import "./WheelQuadrant.css";

const Quadrant = ({ path, fill, onClick, wheelId }) => (
  <path
    d={path}
    stroke={WheelTypeColourOutline[wheelId]}
    fill={fill}
    onClick={onClick}
  />
);

export const WheelQuadrant = ({ onQuadrantClick, fillColours, wheelId }) => {
  const renderQuadrant = (sliceId, levelId) => {
    const path = getPath(levelId, sliceId);
    const fill = getColour(sliceId, levelId);
    const onClick = () => handleQuadrantClick(sliceId, levelId);

    return (
      <Quadrant
        id="quadrant"
        path={path}
        fill={fill}
        onClick={onClick}
        wheelId={wheelId}
      />
    );
  };

  const getPath = (levelId, sliceId) => {
    return QuadrantPaths[sliceId][levelId];
  };
  const getColour = (sliceId, levelId) => {
    const sliceColours = fillColours[sliceId];
    return sliceColours[levelId];
  };

  const handleQuadrantClick = (sliceId, quadrantId) => {
    onQuadrantClick(sliceId, quadrantId);
  };

  return (
    <svg viewBox="0 0 1004 1006" xmlns="http://www.w3.org/2000/svg">
      {WheelStructure.Levels.map((levelId) =>
        WheelStructure.Slices.map((sliceId) => renderQuadrant(sliceId, levelId))
      )}
    </svg>
  );
};
