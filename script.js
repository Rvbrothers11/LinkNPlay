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
    const code = document.getElementById('roomCodeInput').value.toUpperCase();

    if (code.length ===4) {
        socket.emit('joinRoom', code);
    } else {
        alert("Please enter a 4-letter code.")
    }
}

function selectGame(gameName) {
    alert("You clicked " + gameName + "! We will build this arena next.");
}

socket.on('roomCreated', (roomCode) => {
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('active-game').style.display = 'block';
    document.getElementById('displayRoomCode').innerText = roomCode;
});

socket.on('roomJoined', (roomCode) => {
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('active-game').style.display = 'block';
    document.getElementById('displayRoomCode').innerText = roomCode;
});

socket.on('startGame', (roomCode) => {
    const statusText = document.querySelector('.room-status p');
    statusText.innerText = "Opponent connected! Game starting...";
    statusText.style.color = "#2ecc71";

    setTimeout(() => {
        alert("Boom! Both players are connected in room " + roomCode + "!");
    }, 500);
});

socket.on('error', (message) => {
    alert(message);
});

function disconnect() {
    const roomCode = document.getElementById('displayRoomCode').innerText;
    socket.emit('leaveRoom', roomCode);
    resetToLobby("You left the match.");
}

socket.on('opponentLeft', () => {
    resetToLobby("Your opponent disconnected!");
});

function resetToLobby(message) {
    document.getElementById('active-game').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';

    const statusText = document.querySelector('.room-status p');
    statusText.innerText = "Waiting for opponent to connect...";
    statusText.style.color = "var(--text-muted";

    document.getElementById('roomCodeInput').value = "";

    alert(message);
}