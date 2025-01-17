import React from "react";
import { SLICE_ICONS_PATHS, ICON_VIEW_BOX } from "../types/icon.config";
import "./IconGenerator.css";
import { WHEEL_STROKE } from "../types/branding.config";

// Icon component to render a path with stroke and fill
const Icon = ({ path, fill, stroke, strokeWidth }) => (
  <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
);

// Circle component to render a circle with specific attributes
const Circle = ({ cy, cx, r, fill }) => (
  <circle cy={cy} cx={cx} r={r} fill={fill} />
);

export const IconGenerator = ({ wheelId, sliceId }) => {
  const renderIcon = (sliceId, wheelId) => {
    const paths = getPath(wheelId, sliceId);
    const colour = getColour(wheelId);

    if (!paths || !paths.length) return null;

    return paths.map((icon, index) => {
      const key = icon.d ? `icon-${index}` : `circle-${index}`; // Generate a unique key
      return icon.d ? (
        <Icon
          key={key}
          path={icon.d}
          fill={colour}
          stroke={colour}
          strokeWidth={1}
        />
      ) : (
        <Circle key={key} cy={icon.cy} cx={icon.cx} r={icon.r} fill={colour} />
      );
    });
  };

  const getPath = (wheelId, sliceId) => {
    return SLICE_ICONS_PATHS[wheelId]?.[sliceId] || [];
  };

  const getColour = (wheelId) => {
    return WHEEL_STROKE[wheelId] || "#000"; // Default to black if no colour is found
  };

  const getViewBox = (wheelId, sliceId) => {
    const pathLengths = getPath(wheelId, sliceId).length;
    if (pathLengths === 1) return ICON_VIEW_BOX[1];
    else return ICON_VIEW_BOX[2];
  };

  return (
    <svg
      className="icon-svg"
      viewBox={getViewBox(wheelId, sliceId)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderIcon(sliceId, wheelId)}
    </svg>
  );
};
