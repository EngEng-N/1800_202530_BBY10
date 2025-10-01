import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

const loginButton = document.querySelector('.btn-primary');
function sayHello() {
    // alert('Hello!');
    window.location.href='login.html'
}
loginButton.addEventListener('click', sayHello);
