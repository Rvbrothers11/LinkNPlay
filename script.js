const socket = io();

let iAmHost = false;
let skribblRound = 1;
const maxSkribblRounds = 5;
let currentDrawerIsHost = true;
let isDrawer = false;
let currentSkribblWord = "";
let skribblTime = 60;
let skribblTimerInterval = null;
const dictionary = ["apple", "pizza", "car", "tree", "house", "sun", "cat", "dog", "fish", "bird", "moon", "star", "flower", "computer", "ocean", "mountain", "guitar", "castle", "dragon", "spaceship"];

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
        else if (gameName === 'skribbl') {
            document.getElementById('skribbl-arena').style.display = 'block';
            skribblRound = 1;
            currentDrawerIsHost = true;
            document.getElementById("playerScore").innerText = "0";
            document.getElementById('chatLog').innerHTML = <div class="chat-message system-msg">Welcome to Draw & Guess!</div>;
            startSkribblTurn();
        }

        clone.style.opacity = '0';
        setTimeout(() => clone.remove(), 600);
    }, 600);
}
    
socket.on('roomCreated', (roomCode) => {
    currentRoom = roomCode;
    mySymbol = "X";
    isMyTurn = true;
    iAmHost = true;
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('active-game').style.display = 'block';
    document.getElementById('displayRoomCode').innerText = roomCode;
});

socket.on('roomJoined', (roomCode) => {
    currentRoom = roomCode;
    mySymbol = "O";
    isMyTurn = false;
    iAmHost = false;
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
    document.getElementById('skribbl-arena').style.display = 'none';
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

function checkWin(lastSymbol) {
    let roundWon = false;

    for (let i = 0; i < winningCombos.length; i++) {
        const [a, b, c] = winningCombos[i];
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        if (lastSymbol === mySymbol) {
            document.getElementById('turnIndicator').innerText = "YOU WIN!";
            document.getElementById('turnIndicator').style.color = "#fbbf24";
        }
        else {
            document.getElementById('turnIndicator').innerText = "YOU LOSE!";
            document.getElementById('turnIndicator').style.color = "#ef4444";
        }

        isMyTurn = false;
        setTimeout(resetBoard, 3000);
        return;
    }

    if (!boardState.includes("")) {
        document.getElementById('turnIndicator').innerText = "IT'S A TIE!";
        document.getElementById('turnIndicator').style.color = "white";
        isMyTurn = false;
        setTimeout(resetBoard, 3000);
    }
}

function resetBoard() {
    boardState = ["", "", "", "", "", "", "", "", ""];
    for (let i = 0; i < 9; i++) {
        const cell = document.getElementById(`cell-${i}`);
        cell.innerText = "";
        cell.classList.remove("x-remove", "o-symbol");
    }

    if (mySymbol === "X") {
        isMyTurn = true;
        document.getElementById('turnIndicator').innerText = "Your Turn! (X)";
    }
    else {
        isMyTurn = false;
        document.getElementById('turnIndicator').innerText = "Opponent's Turn...";
    }
    document.getElementById('turnIndicator').style.color = "var(--text-muted)";
}






const canvas = document.getElementById('drawingBoard');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentPenColor = '#ffffff';

ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineWidth = 4;

function startSkribblTurn() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearInterval(skribblTimerInterval);
    skribblTime = 60;

    document.getElementById('skribbl-timer').innerText = `${skribblTime}s`;
    document.getElementById('skribbl-round').innerText = `Round: ${skribblRound} / ${maxSkribblRounds}`;
    document.getElementById('guessInput').disabled = false;

    isDrawer = (iAmHost && currentDrawerIsHost) || (!iAmHost && !currentDrawerIsHost);

    if (isDrawer) {
        document.getElementById('skribbl-status').disabled = true;
        document.getElementById('guess-input').placeholder = "You are drawing!";
        document.getElementById('skribbl-status').innerText = "Selecting word...";
        showWordSelection();
    }

    else {
        currentSkribblWord = "";
        document.getElementById('skribbl-status').innerText = "Waiting for the drawer to pick a word...";
        document.getElementById('guessInput').placeholder = "Type a guess...";
        document.getElementById('word-selection-overlay').style.display = 'none';
    }
}

function showWordSelection() {
    const overlay = document.getElementById('word-selection-overlay');
    const optionsDiv = document.getElementById('word-options');
    optionsDiv.innerHTML = '';
    overlay.style.display = 'flex';

    let shuffled = [...dictionary].sort(() => 0.5 - Math.random());
    let options = shuffled.slice(0, 5);

    options.forEach(word => {
        let btn = document.createElement('button');
        btn.classname = 'btn btn-secondary';
        btn.innerText = word;
        btn.onclick = () => selectWord(word);
        optionsDiv.appendChild(btn);
    });
}

function selectWord(word) {
    document.getElementById('word-selection-overlay').style.display = 'none';
    currentSkribblWord = word;
    document.getElementById('skribbl-status').innerText = "Draw this: " + word.toUpperCase();
    socket.emit('setSkribblWord', { room: currentRoom, word: word });
    startSkribblTimer();
}

socket.on('receiveSkribblWord', (word) => {
    currentSkribblWord = word;
    let hint = word.replace(/[a-zA-Z]/g, "- ");
    document.getElementById('skribbl-status').innerText = "Guess the word: " + hint;
    startSkribblTimer();
});

function startSkribblTimer() {
    clearInterval(skribblTimerInterval);
    skribblTimerInterval = setInterval(() => {
        skribblTime--;
        document.getElementById('skribbl-timer').innerText = `${skribblTime}s`;

        if (skribblTime <= 0) {
            clearInterval(skribblTimerInterval);
            if (iAmHost) {
                socket.emit('skribblTimeout', {room: currentRoom, word: currentSkribblWord });
                handleSkribblEnd(false, "", currentSkribblWord, 0, 0);
            }
        }
    }, 1000);
}

canvas.addEventListener('mousedown', (e) => {
    if (!isDrawer) return;
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    socket.emit('startStroke', { room: currentRoom, x: e.offsetX, y: e.offsetY});
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !isDrawer) return;
    ctx.strokeStyle = currentPenColor;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    socket.emit('drawStroke', { room: currentRoom, x: e.offsetX, y: e.offsetY, color: currentPenColor });
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    ctx.beginPath();
});
canvas.addEventListener('mouseout', () => {
    isDrawing = false;
});

socket.on('receiveStartStroke', (data) => {
    ctx.beginPath(); ctx.moveTo(data.x, data.y);
});
socket.on('receiveStroke', (data) => {
    ctx.strokeStyle = data.color;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
});

function changeColor(color) {
    if (!isDrawer)
        return;
    currentPenColor = color;
}
function clearCanvas() {
    if (!isDrawer)
        return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clearCanvas', currentRoom);
}
socket.on('canvasCleared', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function sendGuess() {
    const input = document.getElementById('guessInput');
    const message = input.value.trim();
    if (message === "") return;

    if (!isDrawer && currentSkribblWord !=="" && message.toLowerCase() === currentSkribblWord.toLowerCase()) {
        const myName = document.getElementById("playerName").innerText;
        clearInterval(skribblTimerInterval);

        let guesserPoints = Math.max(10, Math.floor((skribblTime / 60) *500));
        let drawerPoints = Math.floor(guesserPoints / 2);

        socket.emit('skribblWin', { room: currentRoom, winner: myName, word: currentSkribblWord, gPoints: guesserPoints, dPoints: drawerPoints });
        handleSkribblEnd(true, myName, currentSkribblWord, guesserPoints, drawerPoints);
        input.value = "";
        return;
    }

    addChatMessage(document.getElementById("playerName").innerText, message);
    socket.emit('sendChat', { room: currentRoom, sender: document.getElementById("playerName").innerText, message: message});
    input.value = "";
}

socket.on('receiveChat', (data) => {
    addChatMessage(data.sender, data.message);
});
socket.on('skribblWin', (data) => {
    clearInterval(skribblTimerInterval);
    handleSkribblEnd(false, "", data.word, 0, 0);
});

function handleSkribblEnd(wasWon, winnerName, word, gPoints, dPoints) {
    isDrawer = false;
    document.getElementById('guessInput').disabled = true;

    if (wasWon) {
        addChatMessage("SYSTEM", `${winnerName} guessed the word: ${word.toUpperCase()}!`, true);
        document.getElementById('skribbl-status').innerText = `Round over! The word was ${word.toUpperCase}`;

        let myScore = parseInt(document.getElementById("playerScore").innerText);
        let myName = document.getElementById("playerName").innerText;

        if (winnerName === myName) {
            document.getElementById("playerScore").innerText = myScore + gPoints;
            addChatMessage("SCORE", `You earned +${gPoints} points!`, true);
        }
        else {
            document.getElementById("playerScore").innerText = myScore + dPoints;
            addChatMessage("Score", `You earned +${dPoints} points as the artist!`, true);
        }
    }
    else {
        addChatMessage("SYSTEM", `Time's up! The word was: ${word.toUpperCase()}`, true);
        document.getElementById('skribbl-status').innerText = `Time's up! The word was ${word.toUpperCase()}`;
    }

    setTimeout(() => {
        if (!currentDrawerIsHost) {
            skribblRound++;
        }

        if (skribblRound > maxSkribblRounds) {
            document.getElementById('skribbl-status').innerText = "Game Over! Check scores.";
            addChatMessage("SYSTEM", "The 5 rounds have ended!", true);
            setTimeout(() => resetToLobby("Skribbl match finished!"), 5000);
        }
        else {
            startSkribblTurn();
        }
    }, 4000);
}

