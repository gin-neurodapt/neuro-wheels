import React from "react";
import "./Download.css";

export const Download = ({ customFileName, handleDownload, handleFileNameChange }) => {
  return (
    <div className="download-content">
      <input
        type="text"
        placeholder="Custom file name extension (E.g. Week 5)"
        className="form-control"
        value={customFileName}
        onChange={handleFileNameChange}
      />
      <button
        type="button"
        className="btn btn-light"
        title="download"
        onClick={handleDownload}
      >
        <span className="material-symbols-outlined">download</span>
      </button>
    </div>
  );
};
