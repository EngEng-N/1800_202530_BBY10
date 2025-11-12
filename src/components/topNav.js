export function createTopNav() {
  const topNav = document.createElement("nav");
  topNav.classList.add("navbar");

  topNav.innerHTML = `
        <a href="" class="logo">LifeSync</a>
        <div class="hamburger" id="hamburger">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <ul class="nav-links" id="nav-links">
            <li><a href="#">Settings</a></li>
            <li><a href="#">Profile</a></li>
            <li><a href="#">Support</a></li>
            <button onclick="logoutUser()" class="logout-btn">
              Logout
            </button>
        </ul>
        `;

  const hamburger = topNav.querySelector(".hamburger");
  const navLinks = topNav.querySelector(".nav-links");

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("show");
  });

  return topNav;
}
