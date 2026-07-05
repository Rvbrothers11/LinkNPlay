**LinkNPlay**

<img width="1268" height="704" alt="image" src="https://github.com/user-attachments/assets/61216a6c-00ae-4c29-8561-0f439d6f37de" />

<img width="1279" height="709" alt="image" src="https://github.com/user-attachments/assets/22e67575-d1c1-441d-9ce5-6539060e5189" />


A five-in-one multiplayer dashboard built directly for your web browser. This project was built for #horizons! YAYYYYYY!
**AI Decleration:** I used AI to help me find bugs which if i couldnt fix i got help from AI and to understand how does websockets and servers work, and places where i can improve my website. 

**What my multiplayer hub does?**
This is a multi-tool dashboard designed for when the user wants to play against their friends in Tic Tac Toe, show off drawing skills in Skribbl, claim territory in Dots & Boxes, blast ships in Sea Battle, or drop chips in Connect 4, all while listening to custom music and tracking who is actually dominating the session.

**It includes 8 features:**
**Multiplayer Lobby:** For quick, easy to access room codes so you and your friends can instantly connect!

**Tic Tac Toe:** Just keep this tab open and destroy your friends in the ultimate classic showdown!

**Skribbl (Draw & Guess):** Keep your drawing skills up to date for the next hackathon!!! Guess the word before the timer runs out.

**Dots & Boxes:** Claim your territory! If you close a box, you get an extra turn.

**Sea Battle:** Wanna test your strategic reflexes? Shuffle your fleet and fire missiles at the enemy grid!

**Connect 4:** Drop chips on the go with full gravity animations!

**Custom Music Player:** Listen to today's top hits! Upload your own .mp3 files and control the volume while you play.

**Session Leaderboard:** Want to know who is actually winning the game? Open this slide-out drawer to see your overall Wins, Losses, and Ties across all 5 games.

**How to use?**
Open the site on your browser, and the same on your friend's browser. 
Click on generate code. Send it to your friend and tell them to paste it into the input code text part of the dashboard.
Click connect from the friend's side and you guys are now in a room!
Click on any game and start playing!

**To use it locally:**
Clone or download this repository to your computer.

Open your terminal in the folder and type npm install socket.io express to grab the backend tools.

Type node server.js to wake up the server.

Open http://localhost:3000 in any modern web browser (Chrome, Safari, Firefox, etc.).

YAY It works!!!

To use the site (link): https://linknplay.viditbhati.hackclub.app/


How It Works: This project is built from scratch using the main web languages:
HTML: Structures the different views (Dashboard, Game Arenas, Leaderboard).

CSS: Uses CSS Grid to create a responsive neon layout and animations for things like the Connect 4 chips dropping.

JavaScript (Vanilla + Node.js): It handles the mathematical logic of the games, and uses Socket.io to sync your chat messages, canvas drawings, and missile shots across the internet in real-time
