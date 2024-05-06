import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import html2canvas from "html2canvas";

import { WheelTypes } from "./types/wheelTypes";
import { capitalizeFirstLetter } from "./utils/capitalise";

import Wheel from "./wheel/Wheel";
import NavBar from "./NavBar";
import Loading from "./loading/Loading";
import Footer from './Footer'

const App = () => {
  const [wheel, setWheel] = useState(WheelTypes[1]);
  const screenshotRef = useRef(null);
  const [customFileName, setCustomFileName] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1100);
  }, []);

  const handleDownload = async () => {
    try {
      const canvas = await html2canvas(screenshotRef.current);
      const imageDataURL = canvas.toDataURL("image/jpeg");
      const link = document.createElement("a");
      link.href = imageDataURL;
      const fileExtension = customFileName
        ? ` - ${capitalizeFirstLetter(customFileName)}`
        : "";
      link.download = `NeuroDapt - ${wheel}${fileExtension}.jpg`;
      link.click();
    } catch (error) {
      console.error("Error capturing screenshot:", error);
    }
  };
  const handleFileNameChange = (e) => {
    setCustomFileName(e.target.value);
  };
  return (
    <div className="App">
      <div className="loading-wrapper">
        {isLoading ? (
          <Loading />
        ) : (
          <div className="app-content">
            <div ref={screenshotRef}>
              <NavBar wheel={wheel}></NavBar>
              <Wheel
                wheel={wheel}
                setWheel={setWheel}
                handleDownload={handleDownload}
                handleFileNameChange={handleFileNameChange}
                customFileName={customFileName}
              ></Wheel>
            </div>
            <Footer></Footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
