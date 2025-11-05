
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebaseConfig.js";


const reminderGrid = document.querySelector(".reminder-main");


const remindersCollection = collection(db, "reminders");


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
    const q = query(remindersCollection, orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => renderReminder(doc.data()));
}


form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("reminderText").value.trim();
    const date = document.getElementById("reminderDate").value;

    if (!text || !date) return;

    await addDoc(remindersCollection, { text, date });
    form.reset();
    loadReminders();
});

// Initial load
loadReminders();
