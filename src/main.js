// main.js
// This file initializes the application and sets up auth state monitoring

import "../styles/main.css";

import { createBottomNav } from "./components/bottomNav.js";



// Initialize authentication state monitoring
document.addEventListener("DOMContentLoaded", () => {
  const bottomNav = createBottomNav();
  const main = document.querySelector("main");
  const body = document.querySelector("body");
  body.appendChild(bottomNav);
});


if (window.location.pathname.endsWith("main.html")) {
  history.pushState(null, "", window.location.href);

  window.addEventListener("popstate", function () {
    window.location.href = "main.html";
  });
}

if (window.location.pathname.endsWith("main.html")) {
  history.pushState(null, "", window.location.href);

  window.addEventListener("popstate", function () {
    window.location.href = "main.html";
  });
}



