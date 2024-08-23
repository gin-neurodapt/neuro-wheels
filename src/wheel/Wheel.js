import React, { useState, useEffect, useRef } from "react";
import "./Wheel.css";
import { QUADRANT_FILL } from "../types/branding.config";
import { WHEEL_STRUCTURE, PERCENTAGES } from "../types/wheel.structure.config";
import {
  WHEEL_TYPES,
  WHEEL_CLASS_NAMES,
  SLICE_NAMES,
} from "../types/wheel.type.config";
import { QuadrantHandler } from "../utils/QuadrantHandler";
import { QuadrantGenerator } from "./QuadrantGenerator";
import HandleWheelType from "../utils/HandleWheelType";
import { Download } from "../utils/Download";
import { ResetWheel } from "../utils/ResetWheel";
import { abbreviate } from "../utils/textTransform";
import { IconGenerator } from "./IconGenerator";
import { TableGenerator } from "./TableGenerator";
import {
  getTextPosition,
  isTabletScreen,
  getScreenType,
  getWheelTop,
  getScreenDimensions,
} from "../utils/dimensions";

const Wheel = ({
  setWheel,
  handleDownload,
  handleFileNameChange,
  customFileName,
  isMenuActive,
  setIsMenuActive,
}) => {
  const [sliceNames, setSelectedNames] = useState(SLICE_NAMES[1]);
  const [wheelId, setWheelId] = useState(1);
  const wheelRef = useRef(null);
  const [screenSize, setScreenSize] = useState(getScreenDimensions());

  const [screenType, setScreenType] = useState(getScreenType(screenSize));
  const [wheelTop, setWheelTop] = useState(getWheelTop(screenSize));

  useEffect(() => {
    const handleResize = () => {
      const newScreenSize = getScreenDimensions();
      setScreenSize(newScreenSize);
      setScreenType(getScreenType(newScreenSize)); // Update screenType based on new screenSize
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const positionTitles = () => {
      const slices = document.querySelectorAll(".slices");
      const wheel = wheelRef.current;

      if (!wheel) return;

      slices.forEach((slice, index) => {
        const { left, width, top } = getTextPosition(
          screenSize,
          wheel,
          index,
          screenType,
          wheelTop
        );
        slice.style.left = left;
        slice.style.top = `${top}px`;
        slice.style.position = "absolute";
        slice.style.width = `${width}px`;
      });
    };

    positionTitles();
  }, [screenSize, screenType, wheelTop]); // Run positionTitles when screenSize or screenType changes

  const updateWheelSelection = (wheelId) => {
    setSelectedNames(SLICE_NAMES[wheelId]);
    setWheelId(wheelId);
    setWheel(WHEEL_TYPES[wheelId]);
  };

  const resetWheel = () => {
    setFillColours((prevFillColours) => ({
      ...prevFillColours,
      [wheelId]: initFillColours()[wheelId],
    }));
    setSlicePercentage((prevSlicePercentage) => ({
      ...prevSlicePercentage,
      [wheelId]: initSlicePercentage()[wheelId],
    }));
    setPreviousLevels((prevPreviousLevels) => ({
      ...prevPreviousLevels,
      [wheelId]: initPreviousLevel()[wheelId],
    }));
    setActiveSlicePercentages(slicePercentage[wheelId]);
  };

  const resetAllWheels = () => {
    setFillColours(initFillColours());
    setSlicePercentage(initSlicePercentage());
    setPreviousLevels(initPreviousLevel());
    setActiveSlicePercentages(slicePercentage[wheelId]);
  };

  const initFillColours = () => {
    const previousColoursByWheel = {};
    Object.keys(WHEEL_TYPES).forEach((wheelId) => {
      const wheel = {};
      const previousLevel = {};
      WHEEL_STRUCTURE.Slices.forEach((slice) => {
        previousLevel[slice] = QUADRANT_FILL.Unselected;
      });
      WHEEL_STRUCTURE.Slices.forEach(
        (slice) => (wheel[slice] = { ...previousLevel })
      );
      previousColoursByWheel[JSON.parse(wheelId)] = { ...wheel };
    });
    return previousColoursByWheel;
  };

  const initSlicePercentage = () => {
    const wheelPercentages = {};
    Object.keys(WHEEL_TYPES).forEach((wheelId) => {
      const slicePercentages = {};
      WHEEL_STRUCTURE.Slices.forEach(
        (slice) => (slicePercentages[SLICE_NAMES[wheelId][slice]] = 0)
      );
      wheelPercentages[JSON.parse(wheelId)] = slicePercentages;
    });
    return wheelPercentages;
  };

  const initPreviousLevel = () => {
    const previousLevelByWheel = {};
    Object.keys(WHEEL_TYPES).forEach((wheelId) => {
      const previousLevel = {};
      WHEEL_STRUCTURE.Slices.forEach((slice) => {
        previousLevel[slice] = null;
      });
      previousLevelByWheel[JSON.parse(wheelId)] = previousLevel;
    });
    return previousLevelByWheel;
  };

  const [previousLevels, setPreviousLevels] = useState(initPreviousLevel());
  const [fillColours, setFillColours] = useState(initFillColours());
  const [activeFillColours, setActiveFillColours] = useState(
    fillColours[wheelId]
  );
  const [slicePercentage, setSlicePercentage] = useState(initSlicePercentage());
  const [activeSlicePercentages, setActiveSlicePercentages] = useState(
    slicePercentage[wheelId]
  );

  useEffect(() => {
    setActiveSlicePercentages(slicePercentage[wheelId]);
    setActiveFillColours(fillColours[wheelId]);
  }, [fillColours, slicePercentage, wheelId]);

  const updateQuadrantColour = (sliceId, levelId) => {
    const newLevel = previousLevels[wheelId][sliceId] !== levelId ? levelId : 0;

    const quadrantHandler = new QuadrantHandler(
      wheelId,
      activeFillColours,
      setFillColours,
      previousLevels[wheelId],
      sliceId,
      levelId,
      slicePercentage[wheelId]
    );
    quadrantHandler.handleLevelUpdate();

    setSlicePercentage((prevSlices) => {
      const updatedSlices = { ...prevSlices };
      updatedSlices[wheelId] = {
        ...prevSlices[wheelId],
        [sliceNames[sliceId]]: PERCENTAGES[newLevel],
      };
      return updatedSlices;
    });

    setActiveSlicePercentages((prevSlicePercentage) => ({
      ...prevSlicePercentage,
      [sliceNames[sliceId]]: PERCENTAGES[newLevel],
    }));

    setPreviousLevels((prevFillColours) => {
      const updatedSlices = { ...prevFillColours };
      updatedSlices[wheelId] = {
        ...prevFillColours[wheelId],
        [sliceId]: newLevel,
      };
      return updatedSlices;
    });
  };

  return (
    <div className="body">
      <HandleWheelType
        isMenuActive={isMenuActive}
        setIsMenuActive={setIsMenuActive}
        updateWheelSelection={updateWheelSelection}
      />
      <Download
        handleDownload={handleDownload}
        handleFileNameChange={handleFileNameChange}
        customFileName={customFileName}
      />
      <ResetWheel resetWheel={resetWheel} resetAllWheels={resetAllWheels} />
      <div>
        {Object.entries(sliceNames).map(([sliceId, slice]) => (
          <div key={sliceId} className={`slices slice-title-${sliceId}`}>
            <div className="icon-title">
              <div
                className={isTabletScreen(screenSize.width) ? "show" : "hide"}
              >
                <IconGenerator
                  wheelId={wheelId}
                  sliceId={sliceId}
                ></IconGenerator>
              </div>
              <div className="slice-title">{abbreviate(slice, screenSize)}</div>
            </div>
            <div className={`slice-value ${WHEEL_CLASS_NAMES[wheelId]}`}>
              {activeSlicePercentages[slice]}%
            </div>
          </div>
        ))}
        <div className="wheel-container">
          <QuadrantGenerator
            wheelRef={wheelRef}
            fillColours={activeFillColours}
            onQuadrantClick={updateQuadrantColour}
            wheelId={wheelId}
            setWheelTop={setWheelTop}
          />
        </div>
        <div className={isTabletScreen(screenSize.width) ? "show" : "hide"}>
          <TableGenerator
            sliceNames={sliceNames}
            wheelId={wheelId}
            activeSlicePercentages={activeSlicePercentages}
          ></TableGenerator>
        </div>
      </div>
    </div>
  );
};

export default Wheel;
