import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import {
      getFirestore,
      collection,
      addDoc,
      getDocs,
      deleteDoc,
      doc
    } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

    
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      messagingSenderID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    };

    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const reminderForm = document.getElementById("reminderForm");
    const reminderList = document.getElementById("reminderList");
    const remindersCollection = collection(db, "reminders");

    
    reminderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("title").value.trim();
      const date = document.getElementById("date").value;

      if (!title || !date) return;

      await addDoc(remindersCollection, {
        title: title,
        date: date
      });

      reminderForm.reset();
      loadReminders();
    });

    
    async function loadReminders() {
      reminderList.innerHTML = "";
      const querySnapshot = await getDocs(remindersCollection);
      querySnapshot.forEach((docSnap) => {
        const reminder = docSnap.data();
        const li = document.createElement("li");
        li.innerHTML = `
          <span><strong>${reminder.title}</strong><br>
          ${new Date(reminder.date).toLocaleString()}</span>
          <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
        `;
        reminderList.appendChild(li);
      });
    }


    reminderList.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const id = e.target.getAttribute("data-id");
        await deleteDoc(doc(db, "reminders", id));
        loadReminders();
      }
    });

    
    loadReminders();