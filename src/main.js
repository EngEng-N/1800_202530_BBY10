// main.js
// This file initializes the application and sets up auth state monitoring

import "../styles/main.css";
import "../styles/top-nav.css";

import { createBottomNav } from "./components/bottomNav.js";
import { createTopNav } from "./components/topNav.js";

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

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

// --- Firebase List Display Logic (NEW) ---

async function loadAllLists() {
  // 1. Fetch documents from the 'list_metadata' collection in Firebase.
  // 2. Iterate through the results.
  // 3. For each list, call renderListLink() to create the HTML element.

  // Fetch documents from the 'list_metadata' collection in Firebase.
  const snapAllDocs = await getDocs(collection(db, "list_metadata"));

  // Check if there is a container element to append lists to (in main.html)
  const listsContainer = document.querySelector(".lists-container");
  if (!listsContainer) {
    console.error(
      "The required container element ('lists-container') was not found in main.html."
    );
    return;
  }

  // Iterate through the results and display the list.
  snapAllDocs.forEach((doc) => {
    const listData = doc.data();
    const listName = listData.title;

    if (listName) {
      renderListLink(listName, listsContainer);
    }
  });
}

// Add the container argument (the element we want to append the link to)
function renderListLink(listName, containerElement) {
  // Create the clickable HTML element (<a> tag)
  const listLink = document.createElement("a");
  listLink.classList.add("list-link");

  // Set its href to: task.html?list=${encodeURIComponent(listName)}
  // Needed for navigation
  listLink.href = `task.html?list=${encodeURIComponent(listName)}`;

  const listContainer = document.createElement("div");
  listContainer.classList.add("list-container");

  const listHeading = document.createElement("h3");
  listHeading.classList.add("list-name");
  listHeading.innerHTML = listName;

  listLink.innerHTML = `<i class="fa-solid fa-circle-arrow-right"></i>`;

  listContainer.appendChild(listHeading);
  listContainer.appendChild(listLink);

  containerElement.appendChild(listContainer);
}

// --- Initialization ---

document.addEventListener("DOMContentLoaded", () => {
  // ... existing navigation component setup logic ...

  // 🔥 Call the list loading function after the DOM is ready
  loadAllLists();
});
