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
const ListName = document.getElementById("list-name");
const TaskNameInput = document.getElementById("task-name");
const TaskDescInput = document.getElementById("task-desc");
const TaskDueInput = document.getElementById("task-due");
const AddTaskBtn = document.getElementById("add-task-btn");
const TaskList = document.getElementById("task-list");

function getList() {
  const listRef = collection(db, "lists");
  onSnapshot(listRef, (snapShot) => {
    TaskList.innerHTML = "";
    if (snapShot.empty) {
      console.log("No lists found!");
    } else {
      snapShot.forEach((doc) => {
        const listData = doc.data();
        const li = document.createElement("li");
        li.textContent = listData.name;
        TaskList.appendChild(li);
      });
      // getTask();
    }
  });
}

// Step 3
// Create a function to add a list and listen for changes
// Assume there is always one list in the database
// User can add more lists later
async function setList() {
  const name = ListName.textContent.trim();

  if (!name) {
    alert("List name is required!");
    return;
  }

  await setDoc(doc(db, name, "metadata"), {
    // "metadata" is a doc inside the list collection
    // dummy doc to make sure a collection exists
    createdAt: serverTimestamp(),
    title: name,
  });

  // Save as active list
  await setDoc(doc(db, "settings", "activeList"), { name });
}

async function getActiveList() {
  const activeSnap = await getDoc(doc(db, "settings", "activeList"));
  if (activeSnap.exists()) {
    ListName.textContent = activeSnap.data().name;
  }
}

// Step 4
// Create a function

// Event listener to add a task and listen for changes
// Assume there is always one task in the database
// User can add more tasks later
async function setTask() {
  // Each task / document will have a name and description
  // [value] takes whatever was entered
  const taskName = TaskNameInput.value.trim();
  const taskDesc = TaskDescInput.value.trim();
  const taskDue = TaskDueInput.value;
  const name = ListName.textContent.trim();
  const taskListRef = doc(db, name, taskName);

  if (!taskName) {
    alert("Task name is required!");
    return;
  }
  console.log("Due Date: " + taskDue);

  await setDoc(taskListRef, {
    createdAt: serverTimestamp(),
    name: taskName,
    description: taskDesc,
    dueDate: taskDue,
  });

  // Clear input fields
  TaskNameInput.value = "";
  TaskDescInput.value = "";
  TaskDueInput.value = "";

  // Save as active task
  await setDoc(doc(db, "settings", "activeTask"), { name: taskName });

  // Refresh the task list
  getTasks();
}

async function getTasks() {
  const name = ListName.textContent.trim();
  const tasksRef = collection(db, name);
  const snapshot = await getDocs(tasksRef);

  TaskList.innerHTML = "";

  snapshot.forEach((docSnap) => {
    if (docSnap.id === "metadata") return;

    const data = docSnap.data();
    // Creating html elements for each task
    const taskContainer = document.createElement("div");
    taskContainer.classList.add("task-container");

    const taskHead = document.createElement("div");
    taskHead.classList.add("task-head");

    const taskContent = document.createElement("div");
    taskContent.classList.add("task-content");

    const taskTitle = document.createElement("h3");
    taskTitle.textContent = data.name;

    const taskCheckbox = document.createElement("input");
    taskCheckbox.type = "checkbox";
    taskCheckbox.id = data.id;

    const taskDesc = document.createElement("p");
    taskDesc.innerHTML = `Description:<br>${data.description}`;

    const taskDue = document.createElement("p");
    taskDue.classList.add("taskDue");

    let simpleDate = "none";

    if (data.dueDate) {
    const dateObject = new Date(data.dueDate);
    simpleDate = {
    month: "short",
    day: "numeric",
    };

    taskDue.innerHTML = dateObject.toLocaleDateString("en-US", simpleDate).replace(" ", "<br>");
    }

    taskContent.appendChild(taskDue);
    // Appending elements to the DOM
    taskHead.appendChild(taskCheckbox);
    taskHead.appendChild(taskTitle);
    taskContent.appendChild(taskDesc);
    taskContainer.appendChild(taskHead);
    taskContainer.appendChild(taskContent);
    TaskList.appendChild(taskContainer);
  });
}

async function getActiveTask() {
  // Get the active list name
  const activeSnap = await getDoc(doc(db, "settings", "activeList"));
  if (!activeSnap.exists()) {
    console.error("No active list set!");
    return;
  } else {
    const listName = activeSnap.data().name;
  }
  getTasks();
}

// Event listeners
ListName.addEventListener("blur", setList);
AddTaskBtn.addEventListener("click", setTask);

// What gets called on page load
window.onload = () => {
  getActiveList();
  getActiveTask();
};
