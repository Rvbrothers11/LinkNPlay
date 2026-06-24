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
            document.getElementById('chatLog').innerHTML = '<div class="chat-message system-msg">Welcome to Draw & Guess!</div>';
            startSkribblTurn();
        }
        else if (gameName === 'dotsboxes') {
            document.getElementById('dotsboxes-arena').style.display = 'block';
            startDotsBoxes();
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

function requestReturnToMenu() {
    socket.emit('returnToMenu', currentRoom);
}

socket.on('backToMenu', () => {
    if (typeof skribblTimerInterval !== 'undefined') {
        clearInterval(skribblTimerInterval);
    }

    document.getElementById('tictactoe-arena').style.display = 'none';
    document.getElementById('skribbl-arena').style.display = 'none';
    document.getElementById('dotsboxes-arena').style.display = 'none';

    document.getElementById('active-game').style.display = 'block';
    document.querySelector('.game-grid').style.display = 'grid';
    document.querySelector('.section-title').style.display = 'block';

    if (document.getElementById('chatLog')) {
        addChatMessage("SYSTEM", "Returned to game menu.", true);
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

    document.getElementById('skribbl-timer').innerText = `⏱️ ${skribblTime}s`;
    document.getElementById('skribbl-round').innerText = `Round: ${skribblRound} / ${maxSkribblRounds}`;
    document.getElementById('guessInput').disabled = false;

    isDrawer = (iAmHost && currentDrawerIsHost) || (!iAmHost && !currentDrawerIsHost);

    if (isDrawer) {
        document.getElementById('guessInput').disabled = true;
        document.getElementById('guessInput').placeholder = "You are drawing!";
        document.getElementById('skribbl-status').innerText = "Selecting word...";
        showWordSelection();
    } else {
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
        btn.className = 'btn btn-secondary';
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
    let hint = word.replace(/[a-zA-Z]/g, "_ ");
    document.getElementById('skribbl-status').innerText = "Guess the word: " + hint;
    startSkribblTimer();
});

function startSkribblTimer() {
    clearInterval(skribblTimerInterval);
    skribblTimerInterval = setInterval(() => {
        skribblTime--;
        document.getElementById('skribbl-timer').innerText = `⏱️ ${skribblTime}s`;

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
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
}); 

socket.on('receiveStroke', (data) => {
    ctx.strokeStyle = data.color;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
});

function changeColor(color) {
    if (!isDrawer) return;
    currentPenColor = color;
}

function clearCanvas() {
    if (!isDrawer) return;
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

    if (!isDrawer && currentSkribblWord !== "" && message.toLowerCase() === currentSkribblWord.toLowerCase()) {
        const myName = document.getElementById("playerName").innerText;
        clearInterval(skribblTimerInterval);

        let guesserPoints = Math.max(10, Math.floor((skribblTime / 60) * 500));
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
    handleSkribblEnd(true, data.winner, data.word, data.gPoints, data.dPoints);
});

socket.on('skribblTimeout', (data) => {
    clearInterval(skribblTimerInterval);
    handleSkribblEnd(false, "", data.word, 0, 0);
});

function handleSkribblEnd(wasWon, winnerName, word, gPoints, dPoints) {
    document.getElementById('guessInput').disabled = true;

    if (wasWon) {
        addChatMessage("SYSTEM", `${winnerName} guessed the word: ${word.toUpperCase()}!`, true);
        document.getElementById('skribbl-status').innerText = `Round over! The word was ${word.toUpperCase()}`;

        let myScore = parseInt(document.getElementById("playerScore").innerText);
        let myName = document.getElementById("playerName").innerText;

        if (winnerName === myName && !isDrawer) {
            document.getElementById("playerScore").innerText = myScore + gPoints;
            addChatMessage("SCORE", `You earned +${gPoints} points!`, true);
        } else if (isDrawer) {
            document.getElementById("playerScore").innerText = myScore + dPoints;
            addChatMessage("SCORE", `You earned +${dPoints} points as the artist!`, true);
        }
    } else {
        addChatMessage("SYSTEM", `Time's up! The word was: ${word.toUpperCase()}`, true);
        document.getElementById('skribbl-status').innerText = `Time's up! The word was ${word.toUpperCase()}`;
    }

    isDrawer = false;

    setTimeout(() => {
        if (!currentDrawerIsHost) {
            skribblRound++;
        }

        currentDrawerIsHost = !currentDrawerIsHost;

        if (skribblRound > maxSkribblRounds) {
            document.getElementById('skribbl-status').innerText = "Game Over! Check scores.";
            addChatMessage("SYSTEM", "The 5 rounds have ended!", true);
            setTimeout(() => resetToLobby("Skribbl match finished!"), 5000);
        } else {
            startSkribblTurn();
        }
    }, 4000);
}

function addChatMessage(sender, message, isSystem = false) {
    const chatLog = document.getElementById('chatLog');
    const msgElement = document.createElement('div');
    msgElement.className = isSystem ? 'chat-message system-msg' : 'chat-message';
    msgElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatLog.appendChild(msgElement);
    chatLog.scrollTop = chatLog.scrollHeight;
}

document.getElementById('guessInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { 
        sendGuess();
    }
});




const playlist = [
    { title: "Memories Of Spring", artist: "Credit: Tokyo Music Walker", src: "track1.mp3"},
    { title: "Hitman", artist: "Credit: Kevin MacLeod", src: "track2.mp3"},
    { title: "I'll Be Your Sunshine", artist: "Credit: Luke Bergs", src: "track3.mp3"}
];

let currentTrackIndex = 0;
const audio = document.getElementById('bgMusic');
const playBtn = document.getElementById('play-pause-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');

audio.volume = 0.2;

function loadTrack(index) {
    const track = playlist[index];
    audio.src = track.src;
    document.getElementById('track-name').innerText = track.title;
    document.getElementById('track-artist').innerText = track.artist;
    audio.load();
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        playBtn.innerText = "⏸";
    }
    else {
        audio.pause();
        playBtn.innerText = "▶";
    }
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) %   playlist.length;
    loadTrack(currentTrackIndex);
    if (!audio.paused || playBtn.innerText === "⏸") audio.play();
}
function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    if (!audio.paused || playBtn.innerText === "⏸")
        audio.play();
}

audio.addEventListener('ended', nextTrack);

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;

        let currentMins = Math.floor(audio.currentTime / 60);
        let currentSecs = Math.floor(audio.currentTime % 60);
        if (currentSecs < 10) 
            currentSecs = "0" + currentSecs;
        currentTimeEl.innerText = `${currentMins}:${currentSecs}`;

        let durationMins = Math.floor(audio.duration / 60);
        let durationSecs = Math.floor(audio.duration % 60);
        if (durationSecs < 10)
            durationSecs = "0" + durationSecs;
        totalTimeEl.innerText = `${durationMins}:${durationSecs}`;
    }
});

function seekAudio(e) {
    const container = document.getElementById('progress-container');
    const clickX = e.offsetX;
    const width = container.clientWidth;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

function toggleMusicPlayer() {
    const player = document.getElementById('floating-music-player');
    const toggleBtn = document.getElementById('music-toggle-btn');
    player.classList.toggle('music-collapsed');
    if (player.classList.contains('music-collapsed')) {
        toggleBtn.innerText = "+"
    }
    else {
        toggleBtn.innerText = "-";
    }
}

const dragHandle = document.getElementById('music-header');
const musicPlayer = document.getElementById('floating-music-player');

let isDraggingMusic = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0;
let yOffset = 0;

dragHandle.addEventListener("mousedown", dragStart);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", dragEnd);

function dragStart(e) {
    if (e.target.id === 'music-toggle-btn')
        return;
    isDraggingMusic = true;
    const rect = musicPlayer.getBoundingClientRect();
    mouseOffsetX = e.clientX - rect.left;
    mouseOffsetY = e.clientY - rect.top;
    
    musicPlayer.style.bottom = 'auto';
    musicPlayer.style.right = 'auto';
    musicPlayer.style.transition = 'none';
    musicPlayer.style.left = rect.left + 'px';
    musicPlayer.style.top = rect.top + 'px';
}

function drag(e) {
    if (!isDraggingMusic)
        return;
    e.preventDefault();
    musicPlayer.style.left = (e.clientX - mouseOffsetX) + 'px';
    musicPlayer.style.top = (e.clientY - mouseOffsetY) + 'px';
}

function dragEnd() {
    if (isDraggingMusic) {
        isDraggingMusic = false;
        musicPlayer.style.transition = 'width 0.3s ease, border-radius 0.3s ease';
    }
}

let dbCols = 3, dbRows = 3;
let dbLines = {};
let dbBoxOwners = {};
let dbP1Score = 0, dbP2Score = 0;
let isDbMyTurn = false;
let dbMyPlayerNum = 0;

function startDotsBoxes () {
    dbLines = {};
    dbBoxOwners = {};
    dbP1Score = 0;
    dbP2Score = 0;
    document.getElementById('db-p1-score').innerText = "0";
    document.getElementById('db-p2-score').innerText = "0";

    dbMyPlayerNum = iAmHost ? 1 : 2;
    isDbMyTurn = iAmHost;
    updateDbTurnIndicator();    
    renderDbBoard();
}

function renderDbBoard() {
    const board = document.getElementById('db-board');
    board.innerHTML = '';

    for(let r = 0; r <= dbRows; r++) {
        let dotRow = document.createElement('div');
        dotRow.className = 'db-row';
        for (let c = 0; c <= dbCols; c++) {
            let dot = document.createElement('div');
            dot.className = 'db-dot';
            dotRow.appendChild(dot);

            if (c < dbCols) {
                let hLine = document.createElement('div');
                hLine.className = 'db-hline db-line';
                hLine.id = `h-${r}-${c}`;
                hLine.onclick = () => playDbLine(hLine.id);
                dotRow.appendChild(hLine);
            }
        }
        board.appendChild(dotRow);

        if (r < dbRows) {
            let boxRow = document.createElement('div');
            boxRow.className = 'db-vline-container';
            for (let c = 0; c <=dbCols; c++) {
                let vLine = document.createElement('div');
                vLine.className = 'db-vline db-line';
                vLine.id = `v-${r}-${c}`;
                vLine.onclick = () => playDbLine(vLine.id);
                boxRow.appendChild(vLine);

                if (c < dbCols) {
                    let box = document.createElement('div');
                    box.className = 'db-box';
                    box.id = `b-${r}-${c}`;
                    boxRow.appendChild(box);
                }
            }
            board.appendChild(boxRow);
        }
    }
}

function playDbLine(lineId) {
    if (!isDbMyTurn || dbLines[lineId]) return;
    isDbMyTurn = false;
    updateDbTurnIndicator();
    socket.emit('dbMove', { room: currentRoom, lineId: lineId, player: dbMyPlayerNum });
    processDbMove(lineId, dbMyPlayerNum);
}

socket.on('dbMove', (data) => {
    processDbMove(data.lineId, parseInt(data.player, 10));
});

function processDbMove(lineId, playerNum) {
    playerNum = parseInt(playerNum, 10);
    dbLines[lineId] = playerNum;
    const lineEl = document.getElementById(lineId);
    if (lineEl) {
        lineEl.classList.add('drawn', playerNum === 1 ? 'p1' : 'p2');
    }

    let boxesCreated = checkForBoxes(lineId, playerNum);

    if (boxesCreated > 0) {
        if (playerNum === 1) dbP1Score += boxesCreated;
        else dbP2Score += boxesCreated;

        const score1El = document.getElementById('db-p1-score');
        const score2El = document.getElementById('db-p2-score');
        if (score1El) score1El.innerText = dbP1Score;
        if (score2El) score2El.innerText = dbP2Score;

        if (playerNum === dbMyPlayerNum) {
            isDbMyTurn = true;
        }
        checkDbWin();
    }
    else {
        if (playerNum === dbMyPlayerNum) {
            isDbMyTurn = false;
        }
        else {
            isDbMyTurn = true;
        }
    }
    updateDbTurnIndicator();
}

function checkForBoxes(lineId, playerNum) {
    let parts = lineId.split('-');
    let type = parts[0];
    let r = parseInt(parts[1], 10);
    let c = parseInt(parts[2], 10);
    let boxesMade = 0;

    if (type === 'h') {
        if (r > 0 && dbLines[`h-${r-1}-${c}`] && dbLines[`v-${r-1}-${c}`] && dbLines[`v-${r-1}-${c+1}`]) {
            fillBox(r-1, c, playerNum); boxesMade++;
        }
        if (r < dbRows && dbLines[`h-${r+1}-${c}`] && dbLines[`v-${r}-${c}`] && dbLines[`v-${r}-${c+1}`]) {
            fillBox(r, c, playerNum); boxesMade++;
        }
    } else if (type === 'v') {
        if (c > 0 && dbLines[`v-${r}-${c-1}`] && dbLines[`h-${r}-${c-1}`] && dbLines[`h-${r+1}-${c-1}`]) {
            fillBox(r, c-1, playerNum); boxesMade++;
        }
        if (c < dbCols && dbLines[`v-${r}-${c+1}`] && dbLines[`h-${r}-${c}`] && dbLines[`h-${r+1}-${c}`]) {
            fillBox(r, c, playerNum); boxesMade++;
        }
    }
    return boxesMade;
}

function fillBox(r, c, playerNum) {
    dbBoxOwners[`b-${r}-${c}`] = playerNum;
    let boxEl = document.getElementById(`b-${r}-${c}`);
    boxEl.classList.add(playerNum === 1 ? 'p1' : 'p2');
}

function updateDbTurnIndicator() {
    let totalBoxes = dbRows * dbCols;
    if (Object.keys(dbBoxOwners).length === totalBoxes) return;

    const status = document.getElementById('db-turnIndicator');
    if (isDbMyTurn) {
        status.innerText = "Your Turn! Draw a line.";
        status.style.color = dbMyPlayerNum === 1 ? "var(--danger)" : "var(--primary)";
    }
    else {
        status.innerText = "Opponent is thinking...";
        status.style.color = "var(--text-muted)";
    }
}

function checkDbWin() {
    let totalBoxes = dbRows * dbCols;
    if (Object.keys(dbBoxOwners).length === totalBoxes) {
        const status = document.getElementById('db-turnIndicator');
        if (dbP1Score > dbP2Score) {
            status.innerText = dbMyPlayerNum === 1 ? "You Win!" : "You Lose!";
            status.style.color = dbMyPlayerNum === 1 ? "var(--danger)" : "var(--text-muted)";
        }
        else if (dbP2Score > dbP1Score) {
            status.innerText = dbMyPlayerNum === 2 ? "You Win!" : "You Lose!";
            status.style.color = dbMyPlayerNum === 2 ? "var(--primary)" : "var(--text-muted)";
        }
        else {
            status.innerText = "It's a Tie!";
            status.style.color = "white";
        }
        isDbMyTurn = false;
    }
}