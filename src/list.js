import { documentId } from "firebase/firestore/lite";
import "../styles/list.css";

import { logoutUser, checkAuthState, addUserSubcollectionDoc, onAuthReady } from "./authentication.js";
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
const TaskDueInput = document.getElementById("task-due");
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
  ListName.textContent = localList.name || "Type your list here";

  ListName.addEventListener("input", () => {
  if (ListName.textContent.trim().length > 0) {
    ListName.classList.add("has-text");
  } else {
    ListName.classList.remove("has-text");
  }
});

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

    //This is needed for the due date to display next to the task

    const taskContainer = document.createElement("div");
    taskContainer.classList.add("task-container");

    const taskHead = document.createElement("div");
    taskHead.classList.add("task-head");

    const taskContent = document.createElement("div");
    taskContent.classList.add("task-content");

    const taskName = document.createElement("h3");
    taskName.classList.add("task-name");
    taskName.className = task.name;
    taskName.innerHTML = task.name;

    const taskCheckbox = document.createElement("input");
    taskCheckbox.classList.add("task-checkbox");
    taskCheckbox.type = "checkbox";
    taskCheckbox.id = task.name;

    const taskDesc = document.createElement("p");
    taskDesc.classList.add("task-desc");
    taskDesc.innerHTML = `${task.description || ""}`;
    
    const taskDue = document.createElement("div");
    taskDue.classList.add("task-due");
    taskDue.innerHTML = `${task.due}`;

    const date = new Date(task.due + "T00:00:00");
    const options = { month: "short", day: "numeric" };
    taskDue.innerHTML = date.toLocaleDateString("en-US", options).replace(" ", "<br>");

    
    // Adding h3 and checkbox into head div
    taskHead.appendChild(taskCheckbox);
    taskHead.appendChild(taskName);
    
    // Adding p into content div
    taskContent.appendChild(taskDesc);
    
    // Add the head div and content div to container div
    taskContainer.appendChild(taskHead);
    taskContainer.appendChild(taskContent);

    TaskList.appendChild(taskContainer);
    TaskList.appendChild(taskDue);
    
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
  const taskDue = TaskDueInput.value.trim();

  // Check if the task name is empty
  if (!taskName) {
    alert("Task name is required!");
    return;
  }

  // Adding the task to the local list
  localList.tasks.push({
    name: taskName,
    description: taskDesc,
    due: taskDue,
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


    /*Code no longer needed but keeping just in case
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
    */

    const currentUser = await new Promise((resolve) => {
      const unsubscribe = onAuthReady((user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!currentUser) {
      console.warn("Not signed in → cannot load tasks.");
      return;
    }

    const uid = currentUser.uid;

    localList.tasks = [];

    // Get tasks from the collection (skip the 'metadata' doc)
    const tasksRef = collection(db, "Users", uid, "Tasks");
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
        due: data.due,
        createdAt: data.createdAt || null,
      });
    });

    // When everything updates
    // Render the front-end
    renderUI();
  } catch (error) {
    console.error("Error loading the active list:", error);
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
    
    const currentUser = await new Promise((resolve) => {
      const unsubscribe = onAuthReady((user) => {
        unsubscribe();
        resolve(user);
      });
    });
    
    const uid = currentUser.uid;
    
    // Ensure metadata exists for this list (creates collection implicitly)
    // It stores info like creation time.
    // This is so that we can load list names later.
    await setDoc(doc(db, "Users", uid, "Tasks", "metadata"), {
      createdAt: serverTimestamp(),
      title: listName,
    });

    
    if (!currentUser) {
          alert("You must be signed in to save tasks.");
      return;
    }
    

    // For each local task, check Firestore and decide whether to write
    for (const task of localList.tasks) {
      const taskDocRef = doc(db, "Users", uid, "Tasks", task.name);


      const data = {
        name: task.name,
        description: task.description || "",
        due: task.due || null,
        createdAt: serverTimestamp(),
      };
      await setDoc(taskDocRef, data, { merge: true });
    }

    alert("Saved to your user account!");
  } catch (error) {
    console.error(error);
    alert("Save failed.");
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

onAuthReady((user) => {
  loadActiveListAndTasks();
});

