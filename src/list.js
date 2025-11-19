import { documentId } from "firebase/firestore/lite";
import "../styles/list.css";

import { logoutUser, checkAuthState } from "./authentication.js";
// Step 1
// Import the methods from firebase
// Firebase Database
import { db } from "./firebaseConfig.js";

// Firestore methods
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// Step 2
// Create constants for the DOM elements
const TaskList = document.getElementById("task-list");
const ListName = document.getElementById("list-name");
const TaskNameInput = document.getElementById("task-name");
const TaskDescInput = document.getElementById("task-desc");
const AddTaskBtn = document.getElementById("add-task-btn");
const saveBtn = document.querySelector(".save-button");

// Right now, no Firebase list is selected.
let firebaseActiveListName = null;

// Step 3
// Create local object to store the local state of the front-end
let localList = {
  // name of the current list (h2)
  name: "",

  // tasks would look something like this
  // tasks:
  // [
  // name: "task1", description: "This is a task.", createdAt?:Timestamp
  // ]
  tasks: [],
};

// Step 4
// Creates a function that renders the local state of the front-end
function renderUI() {
  // Make the h2 edittable
  // Render the h2
  ListName.textContent = localList.name || "Untitled List";

  // Render the task(s)
  // Check if there are existing tasks
  // if not display something
  // The task(s) reset everytime the user refreshes the page
  TaskList.innerHTML = "";
  if (!localList.tasks.length) {
    // Create a <p> to tell the user that they haven't add any task yet
    const empty = document.createElement("p");
    empty.textContent = "No tasks yet!";
    TaskList.appendChild(empty);
    return;
  }

  // Create a list container with name, description and checkbox
  localList.tasks.forEach((task) => {
    const taskContainer = document.createElement("div");
    taskContainer.classList.add("task-container");

    const taskHead = document.createElement("div");
    taskHead.classList.add("task-head");

    const taskContent = document.createElement("div");
    taskContent.classList.add("task-content");

    const taskName = document.createElement("h3");
    taskName.classList = task.name;
    taskName.innerHTML = task.name;

    const taskCheckbox = document.createElement("input");
    taskCheckbox.type = "checkbox";
    taskCheckbox.id = task.name;

    const taskDesc = document.createElement("p");
    taskDesc.innerHTML = `Description:<br>${task.description || ""}`;

    // Adding h3 and checkbox into head div
    taskHead.appendChild(taskCheckbox);
    taskHead.appendChild(taskName);

    // Adding p into content div
    taskContent.appendChild(taskDesc);

    // Add the head div and content div to container div
    taskContainer.appendChild(taskHead);
    taskContainer.appendChild(taskContent);

    // Finally add the container to task-list div
    TaskList.appendChild(taskContainer);
  });
}

// Step 5
// Creates a function that updates the name of the list (h2)
function updateListName() {
  // trim() to trim the unecessary space or tab in the name
  const name = ListName.textContent.trim();

  if (!name) {
    localList.name = "";
  } else {
    localList.name = name;
  }
  renderUI();
}

// Step 6
// Creates a function that add task(s) to the front-end
function addTask() {
  const taskName = TaskNameInput.value.trim();
  const taskDesc = TaskDescInput.value.trim();

  // Check if the task name is empty
  if (!taskName) {
    alert("Task name is required!");
    return;
  }

  // Adding the task to the local list
  localList.tasks.push({
    name: taskName,
    description: taskDesc,
  });

  // Clear the inputs and re-render the front-end
  TaskNameInput.value = "";
  TaskDescInput.value = "";
  renderUI();
}

// Step 7
// The fun part -> Firebase
async function loadActiveListAndTasks() {
  try {
    // Firestore document that stores which list is active
    const activeSnap = await getDoc(doc(db, "settings", "activeList"));

    // Check if there is an active list in Firebase
    if (!activeSnap.exists()) {
      // No active list set in Firestore - start with empty localList
      firebaseActiveListName = null;
      localList = { name: "", tasks: [] };
      renderUI();
      return;
    }

    firebaseActiveListName = activeSnap.data().name || null;
    // If no active list exists
    // Creates a local empty list with empty task
    if (!firebaseActiveListName) {
      localList = { name: "", tasks: [] };
      renderUI();
      return;
    }

    // Check if the list in the collection exists
    const testRef = collection(db, firebaseActiveListName);
    const testSnap = await getDocs(testRef);

    // If the collection is empty AND has no metadata doc = it does not exist
    if (testSnap.empty) {
      await setDoc(doc(db, "settings", "activeList"), { name: null });

      firebaseActiveListName = null;
      localList = { name: "", tasks: [] };
      renderUI();
      return;
    }

    // Update localList.name to match the Firebase list name
    // Clear any previous tasks
    localList.name = firebaseActiveListName;
    localList.tasks = [];

    // Get tasks from the collection (skip the 'metadata' doc)
    const tasksRef = collection(db, firebaseActiveListName);
    const snapshot = await getDocs(tasksRef);

    // docSnap is the document inside Firestore
    // docSnap.data() is the data/fields inside the document
    // It returns the JSON object in the document
    // Push the task(s) in the collection to the local list
    snapshot.forEach((docSnap) => {
      if (docSnap.id === "metadata") return;
      const data = docSnap.data();
      localList.tasks.push({
        name: data.name || docSnap.id,
        description: data.description || "",
        createdAt: data.createdAt || null,
      });
    });

    // When everything updates
    // Render the front-end
    renderUI();
  } catch (error) {
    console.error("Error loading the active list:", error);
    alert("Failed to load the active list!");
  }
}

// Step 7
// The final boss "Save"
// "Save" logics
// Save localList to Firestore when Save button is clicked
// Rules:
// - If localList.name !== firebaseActiveListName => create a NEW collection
// - For each task in localList.tasks:
//     - If a doc with same task.name exists in Firestore: overwrite only if description changed
//     - If doc doesn't exist: create it
// - After successful save, update settings/activeList to the localList.name
async function saveAll() {
  // Gets the list name from your local model
  // Removes leading/trailing spaces
  // If the user hasn't typed a list name → stop the function
  const listName = localList.name && localList.name.trim();
  if (!listName) {
    alert("List name is required before saving!");
    return;
  }

  try {
    // Ensure metadata exists for this list (creates collection implicitly)
    // It stores info like creation time.
    // This is so that we can load list names later.
    await setDoc(doc(db, listName, "metadata"), {
      createdAt: serverTimestamp(),
      title: listName,
    });

    // For each local task, check Firestore and decide whether to write
    for (const task of localList.tasks) {
      const taskDocRef = doc(db, listName, task.name);
      const taskSnap = await getDoc(taskDocRef);

      if (taskSnap.exists()) {
        const remote = taskSnap.data();
        // Compare description (and date when added later)
        const remoteDesc = remote.description || "";
        const localDesc = task.description || "";

        // Only overwrite if description changed (or other fields added later on)
        if (remoteDesc !== localDesc) {
          // may want to preserve remote.createdAt in future
          await setDoc(taskDocRef, {
            createdAt: serverTimestamp(),
            name: task.name,
            description: task.description || "",
          });
        } else {
          // Descriptions match; skip writing to save writes
        }
      } else {
        // New task, create it
        await setDoc(taskDocRef, {
          createdAt: serverTimestamp(),
          name: task.name,
          description: task.description || "",
        });
      }
    }

    // If there are remote tasks that were removed locally, they will not get delete in Firestore
    // Implement the remove button and codes later

    // Update settings/activeList to this list name
    await setDoc(doc(db, "settings", "activeList"), { name: listName });

    // Update the firebaseActiveListName tracker to reflect the saved list
    firebaseActiveListName = listName;

    alert("List saved successfully!");
  } catch (error) {
    console.error("Error saving list:", error);
    alert("Failed to save list. Check console for details.");
  }
}

// Event listeners
// When the list name loses focus, update the local state
ListName.addEventListener("blur", () => {
  localList.name = ListName.textContent.trim();
  localList.name = ListName.textContent;
  updateListName();
});

// Update local model while typing
ListName.addEventListener("input", () => {
  localList.name = ListName.textContent;
});

// Add task to local state
AddTaskBtn.addEventListener("click", (e) => {
  e.preventDefault();
  addTask();
});

// Save button writes everything to Firestore
if (saveBtn) {
  saveBtn.addEventListener("click", (e) => {
    e.preventDefault();
    saveAll();
  });
} else {
  console.warn(".save-button not found in DOM. Save will not be available.");
}

window.onload = () => {
  loadActiveListAndTasks();
};
