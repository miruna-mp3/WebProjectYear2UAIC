const form = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    fetch(form.action, {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        messageDiv.textContent = data.message;
        messageDiv.style.color = data.success ? "green" : "red";
        if (data.success) {
            window.location.href = 'home';
        }
    })
    .catch(() => {
        messageDiv.textContent = "Sign in failed, please try again.";
        messageDiv.style.color = "red";
    });
});