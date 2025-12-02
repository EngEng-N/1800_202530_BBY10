import { db } from "../firebaseConfig.js";
import { doc, getDocs, collection } from "firebase/firestore";

import {
  logoutUser,
  checkAuthState,
  addUserSubcollectionDoc,
  onAuthReady,
} from "../authentication.js";

const listName = document.querySelector(".list-name");
const tasksContainer = document.querySelector(".tasks");

// Get the document ID from the URL
function getDocIdFromUrl() {
  // URLSearchParams { list → "Java" }
  const params = new URL(window.location.href).searchParams;
  //   console.log(params);

  // Java
  const list = params.get("list");
  return list;
  //   console.log(list);
}

// Fetch the list and display its name, description and due dates
async function displayListInfo() {
  // "Java"
  const collectionName = getDocIdFromUrl();

  // 1. Wait for the current user to be authenticated
  const currentUser = await new Promise((resolve) => {
    const unsubscribe = onAuthReady((user) => {
      unsubscribe();
      resolve(user);
    });
  });

  if (!currentUser) {
    console.error("User not authenticated. Cannot display list tasks.");
    tasksContainer.innerHTML = "<p>Please log in to view this list.</p>";
    return;
  }

  const uid = currentUser.uid;

  // Set the list title
  listName.textContent = collectionName;

  try {
    // 2. Get reference to the CORRECT nested subcollection
    // Path: 'Users' -> uid -> 'Tasks' -> listName -> collection_of_tasks
    // This assumes your tasks are saved in a subcollection under the listName document.
    // For consistency with your previous structure, tasks should be in:
    // /Users/{uid}/Tasks/{listName}/{task_document}

    // The collection is actually a "subcollection" of the listName document.
    // Based on the previous code, you need to query the documents *within* the 'Tasks' subcollection
    // if 'listName' is being used as a document ID under 'Tasks'.
    // HOWEVER, a more standard structure for tasks is to have the listName as a *collection*
    // of tasks, which seems to be what you intended initially.

    // Assuming the structure is: /Users/{uid}/Tasks/{listName}/{taskDocID}
    // and {listName} is the *collection* of tasks.
    const colRef = collection(db, "Users", uid, collectionName);

    // Fetch all documents (all tasks)
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      tasksContainer.innerHTML = "<p>No tasks found in this list.</p>";
      return;
    }

    // ... rest of your existing logic for looping through and displaying tasks ...
    snapshot.forEach((doc) => {
      if (doc.id === "metadata") {
        return;
      }
      const task = doc.data();

      // Create task HTML
      const taskEl = document.createElement("div");
      taskEl.classList.add("task-item");

      // Build the inner HTML piece-by-piece
      let html = `<h3>${task.name}</h3>`;

      // Only add due date if not empty
      if (task.dueDate && task.dueDate.trim() !== "") {
        html += `<p class='due-dates'><strong>Due:</strong> ${task.dueDate}</p>`;
      }

      // Only add description if not empty
      if (task.description && task.description.trim() !== "") {
        html += `<p class='description'>Description:<br>${task.description}</p>`;
      }

      taskEl.innerHTML = html;

      tasksContainer.appendChild(taskEl);
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    tasksContainer.innerHTML = "<p>Failed to load tasks due to an error.</p>";
  }
}

displayListInfo();
