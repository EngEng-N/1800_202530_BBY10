// main.js
// This file initializes the application and sets up auth state monitoring

import "../styles/main.css";
import "../styles/top-nav.css";

import { createBottomNav } from "./components/bottomNav.js";
import { createTopNav } from "./components/topNav.js";

// Initialize authentication state monitoring
document.addEventListener("DOMContentLoaded", () => {
  const bottomNav = createBottomNav();
  const topNav = createTopNav();
  const header = document.querySelector("header");
  const main = document.querySelector("main");
  const body = document.querySelector("body");
  header.appendChild(topNav);
  body.appendChild(bottomNav);
});
