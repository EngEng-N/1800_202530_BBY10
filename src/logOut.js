import { logoutUser, checkAuthState } from "./authentication.js";

// Initialize auth state check
document.addEventListener("DOMContentLoaded", () => {
  console.log("LogOut.js loaded - Initializing auth state check");
  window.logoutUser = logoutUser;
  checkAuthState();
});
