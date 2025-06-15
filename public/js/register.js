const form = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const password = form.password.value;
    const password2 = form.password2.value;

    if (password !== password2) {
        messageDiv.textContent = "Passwords do not match!";
        messageDiv.style.color = "red";
        return;
    }

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
            window.location.href = 'login';
        }
    })
    .catch(() => {
        messageDiv.textContent = "Registration failed, please try again.";
        messageDiv.style.color = "red";
    });
});