export function createBottomNav() {
  const nav = document.createElement("nav");
  nav.classList.add("bottom-nav");

  nav.innerHTML = `
    <div class="bottom-nav-container">
        <button class="add">+</button>
    </div>
  `;

  const addButton = nav.querySelector(".add");

  function addClick() {
    const taskList = document.querySelector(".task-list-container");
    if (!taskList) return;

    // toggle visibility
    if (taskList.style.display === "none" || taskList.style.display === "") {
      taskList.style.display = "block";
    } else {
      taskList.style.display = "none";
    }
  }

  addButton.addEventListener("click", addClick);

  return nav;
}
