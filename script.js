const socket = io();

document.addEventListener("DOMContentLoaded", () => {
    let username = localStorage.getItem("linkNPlayUser");

    if (!username) {
        username = prompt("Welcome to LinkNPlay! What's your gamer tag?");
        localStorage.setItem("linkNPlayUser", username);
    }

    document.getElementById("playerName").innerText = username;
});

function createRoom() {
    socket.emit('createRoom');
}

function joinRoom() {
    const code = document.getElementById('roomCodeInput').value.toUppercase();

    if (code.length ===4) {
        socket.emit('joinRoom', code);
    } else {
        alert("Please enter a 4-letter code.")
    }
}

function disconnect() {
    window.location.reload();
}

function selectGame(gameName) {
    alert("You clicked" + gameName + "! We will build this arena next.");
}