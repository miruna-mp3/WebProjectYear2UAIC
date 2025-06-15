function addFriendFunction(name){
    const messageDiv = document.getElementById('responseToAdd');
    const formData = new FormData();
        formData.append('username', name);
    fetch('../database/addFriend.php', {
            method: 'POST',
            body: formData
        })
    .then(r => r.json())
    .then(data => {
        messageDiv.textContent = data.message;
        messageDiv.style.color = data.success ? "green" : "red";
        messageDiv.style.display = 'block';
    })
    .catch(error => {
        messageDiv.textContent = "Error: " + error;
        messageDiv.style.color = "red";
        messageDiv.style.display = 'block';
    });
}

function runScript() {
  fetch('../database/runScript.php', { method: 'POST' })
    .then(response => response.text())
    .then(data => {
      document.getElementById('result').innerHTML = data;
    })
    .catch(error => {
      document.getElementById('result').innerHTML = "Error: " + error;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const input = document.querySelector('.search input[type="text"]');
    const resultsList = document.getElementById('results');

    input.addEventListener('input', function() {
        const query = input.value.trim();
        if (query.length === 0) {
            resultsList.innerHTML = '';
            return;
        }

        const formData = new FormData();
        formData.append('query', query);

        fetch('../database/searchUsers.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(results => {
            resultsList.innerHTML = '';
            if (results.length === 0) {
                resultsList.innerHTML = '<li>No results</li>';
            } else {
                results.forEach(name => {
                    const div = document.createElement('div');
                    const li = document.createElement('li');
                    li.textContent = name;
                    const div2 = document.createElement('div');
                    const button = document.createElement('button')
                    const div3 = document.createElement('div');
                    div2.style.display = 'flex';
                    div2.style.alignItems = 'center';
                    div3.id = 'responseToAdd';
                    div3.style.display = 'none';
                    button.textContent = 'Add Friend';
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        addFriendFunction(name);
                    });
                    div2.appendChild(button);
                    div2.appendChild(div3);
                    div.appendChild(li);
                    div.appendChild(div2);
                    resultsList.appendChild(div);
                });
            }
        })
        .catch(err => {
            resultsList.innerHTML = '<li>Error loading results</li>';
        });
    });

    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !resultsList.contains(e.target)) {
            resultsList.innerHTML = '';
        }
    });
});