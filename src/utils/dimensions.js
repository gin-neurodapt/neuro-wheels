import { X_Y_POSITIONS } from "../types/wheel.structure.config";

// Utility Functions
const cleanDecimals = (number) => Number(number.toFixed(2));

// Screen Type Utilities
export const getScreenDimensions = () => ({
  width: window.screen.width,
  height: window.screen.height,
});

export const isMonitorScreen = (width) => width > 1600;
export const isLaptopScreen = (width) => width > 1100;
export const isTabletScreen = (width) => width <= 1024 && width >= 600;
export const isMobileScreen = (screenSize) =>
  screenSize.height > screenSize.width && screenSize.width < 600;

export const getScreenType = (screenSize) => {
  if (isLaptopScreen(screenSize.width)) return "monitor";
  if (isTabletScreen(screenSize.width)) return "tablet";
  return "mobile";
};

// Wheel Dimensions
const calculateWheelHeight = (screenSize) => {
  if (isMobileScreen(screenSize)) return screenSize.width * 0.85;
  if (isTabletScreen(screenSize.width)) return screenSize.width / 2;
  return screenSize.height / 2;
};

const calculateWheelWidth = (screenSize, diameter) => {
  if (isMobileScreen(screenSize)) {
    return screenSize.width * 0.75;
  }
  if (isTabletScreen(screenSize.width)) {
    return screenSize.height > screenSize.width
      ? screenSize.width * 0.5
      : screenSize.width * 0.35;
  }
  return (diameter / 4.5 / diameter) * 100;
};

const calculateWheelTop = (screenSize, wheelHeight) => {
  if (isMonitorScreen(screenSize.width)) {
    return screenSize.height * 0.225;
  }
  if (isTabletScreen(screenSize.width)) {
    return screenSize.height / 4;
  }
  return (screenSize.height - wheelHeight) / 2.25; // mobile
};

const calculateWheelLeft = (screenSize, wheelWidth) => {
  if (isTabletScreen(screenSize.width)) {
    const tabletWidth = calculateWheelWidth(screenSize, wheelWidth);
    return (screenSize.width - tabletWidth) * 0.5;
  }
  if (isMobileScreen(screenSize)) {
    const mobileWidth = calculateWheelWidth(screenSize, wheelWidth);
    return (screenSize.width - mobileWidth) * 0.5;
  }
  return 50 - wheelWidth / 2; // Monitor
};

// Public Wheel Position and Dimension Functions
export const getDiameter = (screenSize) =>
  isMobileScreen(screenSize) || isTabletScreen(screenSize)
    ? screenSize.height
    : screenSize.width;

export const getWheelDimensions = (screenSize, diameter) => ({
  width: calculateWheelWidth(screenSize, diameter),
  height: calculateWheelHeight(screenSize),
});

export const getWheelPosition = (screenSize) => {
  const diameter = getDiameter(screenSize);
  const { width, height } = getWheelDimensions(screenSize, diameter);
  const left = calculateWheelLeft(screenSize, width);
  const top = calculateWheelTop(screenSize, height);

  return {
    wheelWidth: cleanDecimals(width),
    wheelHeight: cleanDecimals(height),
    wheelTop: cleanDecimals(top),
    wheelLeft: cleanDecimals(left),
  };
};

export const getWheelWidthUnits = (screenSize, width) => {
  return `${width}${
    isMobileScreen(screenSize) || isTabletScreen(screenSize.width) ? "px" : "vw"
  }`;
};

// Text Position Utilities
export const calculateTextWidth = (isMonitor) => (isMonitor ? 180 : 140);

export const calculateTextLeft = (x, width, isMonitor) =>
  `${x - width / (isMonitor ? 2.25 : 2)}px`;

export const calculateCenterCoordinates = (screenSize, wheel) => {
  const wheelRadius = wheel.clientWidth / 2;
  return {
    centerX: (screenSize.width - wheel.clientHeight) / 2 + wheelRadius,
    centerY: (screenSize.height - wheel.clientHeight) / 2 + wheelRadius,
  };
};

const getCoordinate = (position, wheelSize, index) => {
  const { wheelWidth, wheelLeft, wheelHeight, wheelTop } = wheelSize;
  const x = wheelLeft + wheelWidth * position.x[index];
  const y =
    index === 0 || index === 7
      ? wheelTop * position.y[index]
      : wheelTop + wheelHeight * position.y[index];
  return { x, y };
};

export const getTextPosition = (screenSize, index, wheelSize, screenType) => {
  const isMonitor = isMonitorScreen(screenSize.width);
  const width = calculateTextWidth(isMonitor);
  const position = X_Y_POSITIONS[screenType]; // Use screenType dynamically if needed

  const { x: left, y: top } = getCoordinate(position, wheelSize, index);

  return { left, width, top };
};
