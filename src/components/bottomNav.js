export function createBottomNav() {
  const nav = document.createElement("nav");
  nav.classList.add("bottom-nav");

  nav.innerHTML = `
    <div class="bottom-nav-container">
      <a class="btn btn-primary" href="./main.html">Home</a>
      <a class="btn btn-secondary" href="./calendar.html">Calendar</a>
      <a class="btn btn-success" href="./profile.html">Profile</a>
    </div>
  `;

  Object.assign(nav.style, {
    position: "sticky",
    bottom: "0",
    left: "0",
    width: "100%",
    background: "#73af85",
    padding: "10px",
    display: "flex",
    justifyContent: "space-around",
    borderTop: "1px solid #ccc",
    zIndex: "9999",
  });

  return nav;
}