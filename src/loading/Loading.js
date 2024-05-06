import React from "react";
import "./Loading.css";
import logo from "../assets/logo.svg";

const Loading = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <img
          src={logo}
          alt="NeuroDapt Logo"
          className="d-inline-block align-text-top"
        />
        <h1>The Wheel of Life App</h1>
      </div>
    </div>
  );
};


export default Loading;