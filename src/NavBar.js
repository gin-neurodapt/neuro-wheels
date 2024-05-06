import React from "react";
import "./NavBar.css";
import logo from "./assets/logo.svg";

const NavBar = ({ wheel }) => {
  return (
    <nav className="navbar bg-body-tertiary">
        <a
          className="navbar-brand"
          href="https://www.neurodapt.au/"
          rel='noreferrer'
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
        <div className="space"></div>
    </nav>
  );
};

export default NavBar;
