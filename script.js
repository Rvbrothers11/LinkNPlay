const socket = io();

let currentRoom = "";
let mySymbol = "";
let isMyTurn = false;
let boardState = ["", "", "", "", "", "", "", "", ""];

const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]
];

document.addEventListener("DOMContentLoaded", () => {
    let username = localStorage.getItem("linkNPlayUser");

    if (!username) {
        username = prompt("Welcome to LinkNPlay! What's your gamer tag?");
        localStorage.setItem("linkNPlayUser", username);
    }

    document.getElementById("playerName").innerText = username;
});

function editUsername() {
    let currentName = localStorage.getItem("linkNPlayUser") || "Player One";
    let newName = prompt("Enter your new gamer tag:", currentName);

    if (newName && newName.trim() !== "") {
        localStorage.setItem("linkNPlayUser", newName.trim());
        document.getElementById("playerName").innerText = newName.trim();
    }
}

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

function selectGame(gameName, event) {
    const roomCode = document.getElementById('displayRoomCode').innerText;
    if (roomCode === "----" || document.getElementById('active-game').style.display === 'none') {
        alert("Sorry. You need to connect with a friend in the lobby first!");
        return;
    }

    socket.emit('triggerGame', { room: roomCode, game: gameName});
    animateHeroTransition(event.currentTarget, gameName);
}

function animateHeroTransition(cardElement, gameName) {
    const rect = cardElement.getBoundingClientRect();
    const clone = cardElement.cloneNode(true);

    clone.style.position = 'fixed';
    clone.style.top = rect.top + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.margin = '0';
    clone.style.zIndex = '9999';
    clone.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
    clone.style.cursor = 'default';

    document.body.appendChild(clone);

    requestAnimationFrame(() => {
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.width = '100vw';
        clone.style.height = '100vh';
        clone.style.borderRadius = '0';

        clone.querySelector('h3').style.opacity = '0';
        clone.querySelector('p').style.opacity = '0';
        clone.querySelector('.icon').style.opacity = '0';
    });

    setTimeout(() => {
        document.getElementById('lobby').style.display = 'none';
        document.querySelector('.game-grid').style.display = 'none';
        document.querySelector('.section-title').style.display = 'none';
        document.getElementById('active-game').style.display = 'none';

        if (gameName === 'tictactoe') {
            document.getElementById('tictactoe-arena').style.display = 'block';
        }

        clone.style.opacity = '0';
        setTimeout(() => clone.remove(), 600);
    }, 600);
}
    
socket.on('roomCreated', (roomCode) => {
    currentRoom = roomCode;
    mySymbol = "X";
    isMyTurn = true;

    document.getElementById('lobby').style.display = 'none';
    document.getElementById('active-game').style.display = 'block';
    document.getElementById('displayRoomCode').innerText = roomCode;
});

socket.on('roomJoined', (roomCode) => {
    currentRoom = roomCode;
    mySymbol = "0";
    isMyTurn = false;
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
    document.getElementById('tictactoe-arena').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';
    document.querySelector('.game-grid').style.display = 'grid';
    document.querySelector('.section-title').style.display = 'block';

    const statusText = document.querySelector('.room-status p');
    statusText.innerText = "Waiting for opponent to connect...";
    statusText.style.color = "var(--text-muted)";

    document.getElementById('roomCodeInput').value = "";

    setTimeout(() => {
        alert(message);
    }, 100);
}

socket.on('syncGameTransition', (gameName) => {
    const allCards = document.querySelectorAll('.game-card');
    let targetCard = null;

    allCards.forEach(card => {
        if (card.getAttribute('onclick').includes(gameName)) {
            targetCard = card;
        }
    });

    if (targetCard) {
        animateHeroTransition(targetCard, gameName);
    }
});




function makeMove(index) {
    if (!isMyTurn || boardState[index] !== "") return;

    boardState[index] = mySymbol;
    const cell = document.getElementById(`cell-${index}`);
    cell.innerText = mySymbol;
    cell.classList.add(mySymbol === "X" ? "x-symbol" : "o-symbol");

    isMyTurn = false;
    document.getElementById('turnIndicator').innerText = "Opponent's Turn...";

    socket.emit('playMove', {
        room: currentRoom,
        index: index,
        symbol: mySymbol
    });

    checkWin(mySymbol);
}

socket.on('updateBoard', (data) => {
    boardState[data.index] = data.symbol;
    const cell = document.getElementById(`cell-${data.index}`);
    cell.innerText = data.symbol;
    cell.classList.add(data.symbol === "X" ? "x-symbol" : "o-symbol");

    isMyTurn = true;
    document.getElementById('turnIndicator').innerText = "Your Turn! (" + mySymbol + ")";
    checkWin(data.symbol);
});