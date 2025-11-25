
import { collection, addDoc, getDocs, query, orderBy, setDoc} from "firebase/firestore";
import { db } from "./firebaseConfig.js";
import { deleteDoc, doc } from "firebase/firestore";
import { addUserSubcollectionDoc, onAuthReady } from "./authentication.js";


const reminderGrid = document.querySelector(".reminder-main");


let remindersCollection = null;
let currentUserUid = null;
let editingId = null;
let editing = false;



const form = document.getElementById("reminderForm");

// RENDER REMINDER
function renderReminder(reminder, id) {
    const reminderDiv = document.createElement("div");
    reminderDiv.classList.add("reminder-example");
    reminderDiv.textContent = reminder.text;

    const dateDiv = document.createElement("div");
    dateDiv.classList.add("reminder-deadline");

    // Convert date + time to proper Date object
    const dateObj = new Date(`${reminder.date}T${reminder.time}`);
    const dateOptions = { month: "short", day: "numeric" };
    const timeOptions = { hour: "numeric", minute: "2-digit" };

    const formattedDate = dateObj.toLocaleDateString("en-US", dateOptions);
    const formattedTime = dateObj.toLocaleTimeString("en-US", timeOptions);

    dateDiv.innerHTML = `
    <span class="date-part">${formattedDate}</span><br>
    <span class="time-part">${formattedTime}</span>
`;


    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.classList.add("delete-reminder-btn");

    deleteBtn.addEventListener("click", async () => {
        await deleteDoc(doc(db, "Users", currentUserUid, "Reminders", id));
        deleteBtn.parentElement.parentElement.remove();
        loadReminders();
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.classList.add("edit-reminder-btn");

    editBtn.addEventListener("click", () => {
        startEditingReminder(id, reminder);
    });

    const dateContainer = document.createElement("div");
    dateContainer.classList.add("date-container");
    dateContainer.appendChild(dateDiv);
    dateContainer.appendChild(deleteBtn);
    dateContainer.appendChild(editBtn);


    const leftContainer = document.createElement("div");
    leftContainer.classList.add("left-container");
    leftContainer.appendChild(reminderDiv);
    leftContainer.appendChild(dateContainer);

    reminderGrid.appendChild(leftContainer);
}

// LOAD REMINDERS
async function loadReminders() {
    reminderGrid.innerHTML = "";
    if (!remindersCollection) return;

    const q = query(remindersCollection, orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap => renderReminder(docSnap.data(), docSnap.id));
}


form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = document.getElementById("reminderText").value.trim();
    const date = document.getElementById("reminderDate").value;
    const time = document.getElementById("reminderTime").value;

    if (!text || !date || !time) return;

    try {
        if (editing) {
            // UPDATE existing reminder
            const docRef = doc(db, "Users", currentUserUid, "Reminders", editingId);
            await setDoc(docRef, { text, date, time, reminderName: text }, { merge: true });

            editing = false;
            editingId = null;

            form.querySelector("button[type='submit']").textContent = "Add Reminder";
        } else {
            // CREATE new reminder
            await addUserSubcollectionDoc(currentUserUid, "Reminders", {
                reminderName: text,
                text,
                date,
                time,
            });
        }

        form.reset();
        await loadReminders();

    } catch (err) {
        console.error("Failed to save reminder:", err);
        alert("Unable to save reminder. Try again.");
    }
});


function startEditingReminder(id, reminder) {
    editingId = id;
    editing = true;

    document.getElementById("reminderText").value = reminder.text;
    document.getElementById("reminderDate").value = reminder.date;
    document.getElementById("reminderTime").value = reminder.time;

    // Change button text so user knows they're editing
    form.querySelector("button[type='submit']").textContent = "Update Reminder";
}




onAuthReady((user) => {
    if (user) {
        currentUserUid = user.uid;
        remindersCollection = collection(db, "Users", user.uid, "Reminders"); // creates reminders subcollection
        loadReminders();
    } else {
        currentUserUid = null;
        remindersCollection = null; 
        reminderGrid.innerHTML = "";
    }
});

// Initial load
loadReminders();
