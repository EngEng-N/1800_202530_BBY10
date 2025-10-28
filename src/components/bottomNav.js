export function createBottomNav() {
  const nav = document.createElement("nav");
  nav.classList.add("bottom-nav");

  nav.innerHTML = `
    <div class="bottom-nav-container">
      <button class="btn btn-primary">Home</button>
      <button class="btn btn-secondary">Calendar</button>
      <button class="btn btn-success">Profile</button>
    </div>
  `;

  Object.assign(nav.style, {
    position: "sticky",
    bottom: "0",
    left: "0",
    width: "100%",
    background: "#f8f9fa",
    padding: "10px",
    display: "flex",
    justifyContent: "space-around",
    borderTop: "1px solid #ccc",
    zIndex: "9999",
  });

  return nav;
}
