// Import statements for Firebase and other dependencies
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";

import {
  logoutUser,
  checkAuthState,
  addUserSubcollectionDoc,
  onAuthReady,
} from "../authentication.js";

import { db } from "../firebaseConfig";

// Step 2: DOM Element Constants
const TaskList = document.getElementById("task-list");
const ListName = document.getElementById("list-name");
const TaskNameInput = document.getElementById("task-name");
const TaskDescInput = document.getElementById("task-desc");
const TaskDueInput = document.getElementById("task-due");
const AddTaskBtn = document.getElementById("add-task-btn");
const saveBtn = document.querySelector(".save-button");

// Step 3: Local State
let localList = {
  name: "",
  tasks: [],
};

// Right now, no Firebase list is selected.
let firebaseActiveListName = null;

// --- Step 4: UI Management ---
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

    const deleteContainer = document.createElement("div");
    deleteContainer.classList.add("delete-container");

    const deleteTaskBtn = document.createElement("button");
    deleteTaskBtn.classList.add("delete-task-btn");
    deleteTaskBtn.textContent = "✕";

    deleteTaskBtn.addEventListener("click", async () => {
      // Remove task locally
      localList.tasks = localList.tasks.filter((t) => t.name !== task.name);
      renderUI();

      // Remove from Firestore ONLY if list was saved
      if (firebaseActiveListName) {
        const currentUser = await new Promise((resolve) => {
          const unsub = onAuthReady((user) => {
            unsub();
            resolve(user);
          });
        });

        if (currentUser) {
          await deleteTaskFromFirestore(
            currentUser.uid,
            firebaseActiveListName,
            task.name
          );
        }
      }
    });

    deleteContainer.appendChild(deleteTaskBtn);

    const taskDesc = document.createElement("p");
    taskDesc.innerHTML = `Description:<br>${task.description || ""}`;

    let taskDue = null;

    if (task.dueDate) {
      taskDue = document.createElement("div");
      taskDue.classList.add("task-due");
      const dueDate = document.createElement("p");
      dueDate.classList.add("task-due-date");
      // Format the date for display if needed, or just show the string
      dueDate.innerHTML = `Due Date: ${task.dueDate}`;
      taskDue.appendChild(dueDate);
    }

    // Adding h3 and checkbox into head div
    taskHead.appendChild(taskName);

    // Adding p into content div
    taskContent.appendChild(taskDesc);

    // Add the head div and content div to container div
    taskContainer.appendChild(taskHead);
    taskContainer.appendChild(taskContent);

    // Finally add the container to task-list div
    TaskList.appendChild(taskContainer);

    if (taskDue) {
      TaskList.append(taskDue);
    }

    TaskList.appendChild(deleteContainer);
  });
}

// --- Step 5: List Name Management ---
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

// --- Step 6: Task Creation ---
function addTask() {
  const taskName = TaskNameInput.value.trim();
  const taskDesc = TaskDescInput.value.trim();
  const taskDue = TaskDueInput.value;

  // Check if the task name is empty
  if (!taskName) {
    alert("Task name is required!");
    return;
  }

  // Adding the task to the local list
  localList.tasks.push({
    name: taskName,
    description: taskDesc,
    dueDate: taskDue || null,
  });

  // Clear the inputs and re-render the front-end
  TaskNameInput.value = "";
  TaskDescInput.value = "";
  TaskDueInput.value = "";
  renderUI();
}

// --- Step 7: Firebase I/O ---
async function resetList() {
  // reset the list creation state
  localList = { name: "", tasks: [] };

  // Ensure there is no active Firebase collection tied to this session
  firebaseActiveListName = null;
  // Render the blank UI
  renderUI();
}

async function deleteTaskFromFirestore(uid, listName, taskName) {
  const taskDocRef = doc(db, "Users", uid, listName, taskName);

  try {
    await deleteDoc(taskDocRef);
    console.log(`Deleted task "${taskName}" from Firestore`);
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

// Step 8
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

    // Register the list name in the central 'list_metadata' collection
    // This allows main.html to fetch and display the link.
    await setDoc(doc(db, "Users", uid, "list_metadata", listName), {
      title: listName,
      createdAt: serverTimestamp(),
    });

    // For each local task, check Firestore and decide whether to write
    for (const task of localList.tasks) {
      const taskDocRef = doc(db, "Users", uid, listName, task.name);
      const taskSnap = await getDoc(taskDocRef);

      if (taskSnap.exists()) {
        const remote = taskSnap.data();
        // Compare description (and date when added later)
        const remoteDesc = remote.description || "";
        const localDesc = task.description || "";
        const remoteDue = remote.dueDate || "";
        const localDue = task.dueDate || "";

        // Only overwrite if description changed (or other fields added later on)
        if (remoteDesc !== localDesc) {
          // may want to preserve remote.createdAt in future
          await setDoc(taskDocRef, {
            createdAt: serverTimestamp(),
            name: task.name,
            description: task.description || "",
            dueDate: task.dueDate || null,
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
          dueDate: task.dueDate || null,
        });
      }
    }

    // If there are remote tasks that were removed locally, they will not get delete in Firestore
    // Implement the remove button and codes later

    if (!currentUser) {
      alert("You must be signed in to save tasks.");
      return;
    }
    alert("List saved successfully!");
    firebaseActiveListName = listName;
  } catch (error) {
    console.error(error);
    alert("Save failed.");
  }

  // try {
  //   // Ensure metadata exists for this list (creates collection implicitly)
  //   // It stores info like creation time.
  //   // This is so that we can load list names later.
  //   await setDoc(doc(db, listName, "metadata"), {
  //     createdAt: serverTimestamp(),
  //     title: listName,
  //   });

  //   // Register the list name in the central 'list_metadata' collection
  //   // This allows main.html to fetch and display the link.
  //   await setDoc(doc(db, "list_metadata", listName), {
  //     title: listName,
  //     createdAt: serverTimestamp(),
  //   });

  //   // For each local task, check Firestore and decide whether to write
  //   for (const task of localList.tasks) {
  //     const taskDocRef = doc(db, listName, task.name);
  //     const taskSnap = await getDoc(taskDocRef);

  //     if (taskSnap.exists()) {
  //       const remote = taskSnap.data();
  //       // Compare description (and date when added later)
  //       const remoteDesc = remote.description || "";
  //       const localDesc = task.description || "";
  //       const remoteDue = remote.dueDate || "";
  //       const localDue = task.dueDate || "";

  //       // Only overwrite if description changed (or other fields added later on)
  //       if (remoteDesc !== localDesc) {
  //         // may want to preserve remote.createdAt in future
  //         await setDoc(taskDocRef, {
  //           createdAt: serverTimestamp(),
  //           name: task.name,
  //           description: task.description || "",
  //           dueDate: task.dueDate || null,
  //         });
  //       } else {
  //         // Descriptions match; skip writing to save writes
  //       }
  //     } else {
  //       // New task, create it
  //       await setDoc(taskDocRef, {
  //         createdAt: serverTimestamp(),
  //         name: task.name,
  //         description: task.description || "",
  //         dueDate: task.dueDate || null,
  //       });
  //     }
  //   }

  //   // If there are remote tasks that were removed locally, they will not get delete in Firestore
  //   // Implement the remove button and codes later

  //   alert("List saved successfully!");
  // } catch (error) {
  //   console.error("Error saving list:", error);
  //   alert("Failed to save list. Check console for details.");
  // }
}

// --- Event Listeners and Initialization ---

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
  resetList();
};

console.log("List creation file loaded");
