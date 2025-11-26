import { db } from "../firebaseConfig.js";
import { doc, getDocs, collection } from "firebase/firestore";

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

  // Set the list title
  listName.textContent = collectionName;

  try {
    // Get reference to the entire collection: Java/
    const colRef = collection(db, collectionName);

    // Fetch all documents (all tasks)
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      tasksContainer.innerHTML = "<p>No tasks found.</p>";
      return;
    }

    // Loop through each task document
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
  }
}

displayListInfo();
