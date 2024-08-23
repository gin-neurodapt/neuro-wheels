import { X_Y_POSITIONS } from "../types/wheel.structure.config";

export const getScreenDimensions = () => {
  const width = window.screen.width;
  const height = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;
  return { width, height };
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
  return isMobile ? screenSize.width * 0.5 : (diameter / 3 / diameter) * 100;
};

export const getDiameter = (screenSize) => {
  return isMobileScreen(screenSize) ? screenSize.height : screenSize.width;
};

export const getWheelTop = (screenSize) => {
  // const isTablet = isTabletScreen(screenSize.width);

  const adjustment = screenSize.width < 840 ? 1.0 : 1;

  return isMonitorScreen(screenSize.width)
    ? screenSize.height * 0.225
    : // : isTablet
      // ? screenSize.height / 4
      (screenSize.height / 4) * adjustment;
};

export const getWheelDimensions = (screenSize, diameter) => {
  const width = getWheelWidth(screenSize, diameter);
  const height = getWheelHeight(screenSize);

  return { width, height };
};

const getWheelLeft = (screenSize, wheelWidth) => {
  // const isMobile = isMobileScreen(screenSize);
  const isTablet = isTabletScreen(screenSize.width);
  return isTablet ? screenSize.width * 0.25 : wheelWidth;
};

export const getWheelPosition = (screenSize, wheelWidth) => {
  const isTablet = isTabletScreen(screenSize.width);

  const left = getWheelLeft(screenSize, wheelWidth);
  const top = getWheelTop(screenSize);

  return { left: `${left}${isTablet ? "px" : "vw"}`, top: `${top}px` };
};

export const getScreenType = (screenSize) => {
  return isLaptopScreen(screenSize.width)
    ? "monitor"
    : isTabletScreen(screenSize.width)
    ? "tablet"
    : "mobile";
};

const handleCoordinateAdjustments = (
  wheel,
  screenSize,
  index,
  screen,
  wheelTop
) => {
  const coordinates = X_Y_POSITIONS[screen];

  const { centerX, centerY } = calculateCenterCoordinates(
    screenSize,
    wheel,
    wheelTop
  );

  const x = centerX + wheel.clientHeight * (coordinates?.x[index] || 0);
  const y = centerY + wheel.clientHeight * (1 - (coordinates?.y[index] || 0));

  return { x, y };
};

export const getWheelWidthUnits = (screenSize, width) => {
  return `${width}${isMobileScreen(screenSize) ? "px" : "vw"}`;
};

export const calculateTextWidth = (isMonitor) => {
  return isMonitor ? 180 : 130;
};

export const calculateTextLeft = (x, width, isMonitor) => {
  return `${x - width / (isMonitor ? 2.25 : 2)}px`;
};

export const calculateCenterCoordinates = (screenSize, wheel, wheelTop) => {
  const wheelRadius = wheel.clientWidth / 2;
  return {
    centerX: (screenSize.width - wheel.clientHeight) / 2 + wheelRadius,
    // centerY: screenSize.height - wheelTop + wheelRadius,
    centerY: (screenSize.height - wheel.clientHeight) / 2 + wheelRadius,
  };
};

export const getTextPosition = (
  screenSize,
  wheel,
  index,
  screenType,
  wheelTop
) => {
  const isMonitor = isMonitorScreen(screenSize.width);
  const { x, y } = handleCoordinateAdjustments(
    wheel,
    screenSize,
    index,
    screenType,
    wheelTop
  );

  const width = calculateTextWidth(isMonitor);
  const left = calculateTextLeft(x, width, isMonitor);

  return { left, width, top: y };
};
