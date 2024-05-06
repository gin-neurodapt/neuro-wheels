import React, { useState, useEffect } from "react";
import "./Wheel.css";
import { QuadrantColors, Percentages } from "../types/wheelValues";
import { WheelStructure } from "../types/wheelStructure";
import { WheelTypes, SliceNames, WheelClassNames } from "../types/wheelTypes";

import { WheelQuadrant } from "./WheelQuadrant";
import HandleWheelType from "../utils/HandleWheelType";
import { QuadrantHandler } from "../utils/QuadrantHandler";
import { Download } from "../utils/Download";
import { ResetWheel } from "../utils/ResetWheel";

const Wheel = ({
  setWheel,
  handleDownload,
  handleFileNameChange,
  customFileName,
  wheel,
}) => {
  const [sliceNames, setSelectedNames] = useState(SliceNames[1]);
  const [wheelId, setWheelId] = useState(1);
  const [isMenuActive, setIsMenuActive] = useState(false);

  const updateWheelSelection = (wheelId) => {
    setSelectedNames(SliceNames[wheelId]);
    setWheelId(wheelId);
    setWheel(WheelTypes[wheelId]);
  };
  const percentages = Percentages;

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
    Object.keys(WheelTypes).forEach((wheelId) => {
      const wheel = {};
      const previousLevel = {};
      WheelStructure.Slices.forEach((slice) => {
        previousLevel[slice] = QuadrantColors.Unselected;
      });
      WheelStructure.Slices.forEach(
        (slice) => (wheel[slice] = { ...previousLevel })
      );
      previousColoursByWheel[JSON.parse(wheelId)] = { ...wheel };
    });
    return previousColoursByWheel;
  };

  const initSlicePercentage = () => {
    const wheelPercentages = {};
    Object.keys(WheelTypes).forEach((wheelId) => {
      const slicePercentages = {};
      WheelStructure.Slices.forEach(
        (slice) => (slicePercentages[SliceNames[wheelId][slice]] = 0)
      );
      wheelPercentages[JSON.parse(wheelId)] = slicePercentages;
    });
    return wheelPercentages;
  };

  const initPreviousLevel = () => {
    const previousLevelByWheel = {};
    Object.keys(WheelTypes).forEach((wheelId) => {
      const previousLevel = {};
      WheelStructure.Slices.forEach((slice) => {
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
  }, [fillColours, slicePercentage, wheelId, activeFillColours]);

  const updateQuadrantColour = (sliceId, levelId) => {
    // this handles the double click to reset a slice
    const lastLevel = previousLevels[wheelId][sliceId];
    const newLevel = lastLevel !== levelId ? levelId : 0;

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
        [sliceNames[sliceId]]: percentages[newLevel],
      };
      return updatedSlices;
    });

    setActiveSlicePercentages((prevSlicePercentage) => ({
      ...prevSlicePercentage,
      [sliceNames[sliceId]]: percentages[newLevel],
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

  const handleMenuDropdown = () => {
    setIsMenuActive(!isMenuActive);
  };

  return (
    <body className="body">
      <div className="responsive-title">
        <h1>
          {wheel}
          <button className="btn btn-menu" onClick={handleMenuDropdown}>
            <span className="material-symbols-outlined">expand_more</span>
          </button>
        </h1>
      </div>
      <HandleWheelType
        isMenuActive={isMenuActive}
        setIsMenuActive={setIsMenuActive}
        updateWheelSelection={updateWheelSelection}
      ></HandleWheelType>
      <Download
        handleDownload={handleDownload}
        handleFileNameChange={handleFileNameChange}
        customFileName={customFileName}
      ></Download>
      <ResetWheel
        resetWheel={resetWheel}
        resetAllWheels={resetAllWheels}
      ></ResetWheel>
      {Object.entries(sliceNames).map(([key, slice]) => {
        return (
          <div className={`slices slice-title-${key}`}>
            <div className={`slice-title`}>{slice}</div>
            <div className={`slice-value ${WheelClassNames[wheelId]}`}>
              {activeSlicePercentages[slice]}%
            </div>
          </div>
        );
      })}
      <div className="wheel-container">
        <WheelQuadrant
          fillColours={activeFillColours}
          onQuadrantClick={updateQuadrantColour}
          wheelId={wheelId}
        />
      </div>
    </body>
  );
};

export default Wheel;
