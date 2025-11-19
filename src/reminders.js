
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebaseConfig.js";
import { addUserSubcollectionDoc, onAuthReady} from "./authentication.js";


const reminderGrid = document.querySelector(".reminder-main");


let remindersCollection = null;
let currentUserUid = null;


const form = document.createElement("form");
form.id = "reminderForm";
form.innerHTML = `
    <input type="text" id="reminderText" placeholder="Enter reminder" required>
    <input type="date" id="reminderDate" required>
    <button type="submit">Add Reminder</button>
`;
reminderGrid.parentElement.insertBefore(form, reminderGrid);


function renderReminder(reminder) {
    const reminderDiv = document.createElement("div");
    reminderDiv.classList.add("reminder-example");
    reminderDiv.textContent = reminder.text;

    const dateDiv = document.createElement("div");
    dateDiv.classList.add("reminder-deadline");

    const date = new Date(reminder.date + "T00:00:00");
    const options = { month: "short", day: "numeric" };
    dateDiv.innerHTML = date.toLocaleDateString("en-US", options).replace(" ", "<br>");

    reminderGrid.appendChild(reminderDiv);
    reminderGrid.appendChild(dateDiv);
}


async function loadReminders() {
    reminderGrid.innerHTML = ""; 
    if (!remindersCollection) return;
    const q = query(remindersCollection, orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => renderReminder(doc.data()));
}


form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("reminderText").value.trim();
    const date = document.getElementById("reminderDate").value;

    if (!text || !date) return;
    if(!currentUserUid) {
        alert("Must be signed in to save reminders!")
        return;
    }

    try {
    await addUserSubcollectionDoc(currentUserUid, "Reminders", {
        reminderName: text,
        text,
        date,
});   
    form.reset();
    await loadReminders();
} catch (err) {
     console.error("Failed to save reminder:", err);
        alert("Unable to save reminder. Try again.");
}
});


onAuthReady((user) => {
    if (user) {
        currentUserUid = user.uid;
        remindersCollection = collection(db, "Users", user.uid, "Reminders"); // creates reminders subcollection
        loadReminders();
    } else {
        currentUserUid = null;
        remindersCollection = null; //No collection will be fetched because no one is signed in.
        reminderGrid.innerHTML = "";
    }
    });

// Initial load
loadReminders();
