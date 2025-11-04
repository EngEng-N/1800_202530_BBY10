// main.js
// This file initializes the application and sets up auth state monitoring

import "../styles/main.css";

import { createBottomNav } from "./components/bottomNav.js";
import { logoutUser, checkAuthState } from "./authentication.js";

// Initialize authentication state monitoring
document.addEventListener("DOMContentLoaded", () => {
  console.log("Main.js loaded - Initializing auth state check");
  window.logoutUser = logoutUser;
  checkAuthState();

  const bottomNav = createBottomNav();
  const main = document.querySelector("main");
  const body = document.querySelector("body");
  body.appendChild(bottomNav);
});
