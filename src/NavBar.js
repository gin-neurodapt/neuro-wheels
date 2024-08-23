import React from "react";
import "./NavBar.css";
import logo from "./assets/logo.svg";

const NavBar = ({ wheel, isMenuActive, setIsMenuActive }) => {
  const handleMenuDropdown = () => {
    setIsMenuActive(!isMenuActive);
  };

  return (
    <nav className="navbar bg-body-tertiary">
      <a
        className="navbar-brand"
        href="https://www.neurodapt.au/"
        rel="noreferrer"
        target="_blank"
      >
        <img
          src={logo}
          alt="NeuroDapt Logo"
          width="120"
          className="d-inline-block align-text-top"
        />
      </a>
      <h1 className="title">{wheel}</h1>
      <div className="responsive-title">
        <h1>
          {wheel}
          <button className="btn btn-menu" onClick={handleMenuDropdown}>
            <span className="material-symbols-outlined">expand_more</span>
          </button>
        </h1>
      </div>
      <div className="space"></div>
    </nav>
  );
};

export default NavBar;
