import { X_Y_POSITIONS } from "../types/wheel.structure.config";

export const getScreenDimensions = () => {
  const { width, height } = window.screen;
  return { width, height };
};

const cleanDecimals = (number) => {
  return JSON.parse(number.toFixed(2));
};

export const isMonitorScreen = (width) => width > 1600;
export const isLaptopScreen = (width) => width > 1100;
export const isTabletScreen = (width) => width <= 1024 && width > 600;
export const isMobileScreen = (screenSize) =>
  screenSize.height > screenSize.width;

export const getWheelHeight = (screenSize) => {
  const isMobile = isMobileScreen(screenSize);
  const isTablet = isTabletScreen(screenSize.width);
  return isMobile || isTablet ? screenSize.width / 2 : screenSize.height / 2;
};

export const getWheelWidth = (screenSize, diameter) => {
  const isMobile = isMobileScreen(screenSize);
  return isMobile ? screenSize.width * 0.5 : (diameter / 4.5 / diameter) * 100;
};

export const getDiameter = (screenSize) => {
  return isMobileScreen(screenSize) ? screenSize.height : screenSize.width;
};

export const getWheelTop = (screenSize, wheelHeight) => {
  const isTablet = isTabletScreen(screenSize.width);

  return isMonitorScreen(screenSize.width)
    ? screenSize.height * 0.225
    : // : isTablet
      // ? screenSize.height / 4
      (screenSize.height - wheelHeight) / 2.75;
};

export const getWheelDimensions = (screenSize, diameter) => {
  const width = getWheelWidth(screenSize, diameter);
  const height = getWheelHeight(screenSize);

  return { width, height };
};

const getWheelLeft = (screenSize, wheelWidth) => {
  // const isMobile = isMobileScreen(screenSize);
  const isTablet = isTabletScreen(screenSize.width);
  return isTablet ? screenSize.width * 0.25 : 50 - wheelWidth / 2;
};

export const getWheelCoordinates = (screenSize, wheelWidth, wheelHeight) => {
  const left = getWheelLeft(screenSize, wheelWidth);
  const top = getWheelTop(screenSize, wheelHeight);

  return { left, top };
};

export const getScreenType = (screenSize) => {
  return isLaptopScreen(screenSize.width)
    ? "monitor"
    : isTabletScreen(screenSize.width)
    ? "tablet"
    : "mobile";
};

export const getWheelPosition = (screenSize) => {
  const diameter = getDiameter(screenSize);
  const { width, height } = getWheelDimensions(screenSize, diameter);
  const { left, top } = getWheelCoordinates(screenSize, width, height);
  return {
    wheelWidth: cleanDecimals(width),
    wheelHeight: cleanDecimals(height),
    wheelTop: cleanDecimals(top),
    wheelLeft: cleanDecimals(left),
  };
};

export const getWheelWidthUnits = (screenSize, width) => {
  return `${width}${isMobileScreen(screenSize) ? "px" : "vw"}`;
};

export const calculateTextWidth = (isMonitor) => {
  return isMonitor ? 180 : 140;
};

export const calculateTextLeft = (x, width, isMonitor) => {
  return `${x - width / (isMonitor ? 2.25 : 2)}px`;
};

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
