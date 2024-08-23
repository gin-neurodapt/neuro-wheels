import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import html2canvas from "html2canvas";

import { WHEEL_TYPES } from "./types/wheel.type.config";
import { capitalizeFirstLetter } from "./utils/textTransform";

import Wheel from "./wheel/Wheel";
import NavBar from "./NavBar";
import Loading from "./loading/Loading";
import Footer from "./Footer";

const App = () => {
  const [wheel, setWheel] = useState(WHEEL_TYPES[1]);
  const screenshotRef = useRef(null);
  const [customFileName, setCustomFileName] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuActive, setIsMenuActive] = useState(false);

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
              <NavBar
                wheel={wheel}
                isMenuActive={isMenuActive}
                setIsMenuActive={setIsMenuActive}
              ></NavBar>
              <Wheel
                wheel={wheel}
                setWheel={setWheel}
                handleDownload={handleDownload}
                handleFileNameChange={handleFileNameChange}
                customFileName={customFileName}
                isMenuActive={isMenuActive}
                setIsMenuActive={setIsMenuActive}
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
