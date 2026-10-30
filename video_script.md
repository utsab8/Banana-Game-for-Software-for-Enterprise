# CIS046-3 Software For Enterprise — 10-Minute Authentic Video Presentation Script
## Assignment 1: Enterprise Banana Challenge System
**Student Name:** Utsab  
**Institution:** University of Bedfordshire  
**Module Code:** CIS046-3 (Software for Enterprise)  
**Target Video Duration:** Exactly 9:30 – 9:55 (Hard Limit: Under 10:00)  
**Architecture:** 3-Tier Enterprise Web Application (Vanilla JS / Node.js Express / SQLite)

---

## 📋 Pre-Recording Setup & Verification Checklist

Before pressing **Record** on OBS Studio, Zoom, or Xbox Game Bar (`Win + G`), prepare your workspace:

1. **Terminal:** Run `npm start` in your project folder. Confirm the console prints:
   ```text
   🍌 Enterprise Banana Challenge System (CIS046-3)
   🚀 Application Server active at: http://localhost:3000
   💾 SQLite Persistence: Connected (...banana_game.sqlite)
   🔒 Session Security: HTTP-Only Cookies Enabled
   🌐 Interoperability Gateway: Connected to Marc Conrad API
   🧩 Architecture: Modular (routes/, services/, middleware/)
   ```
2. **Browser (Chrome/Edge):**
   - Open `http://localhost:3000` in a full window (ensure you are logged out).
   - Open Chrome DevTools (`F12`), docked to the right or bottom.
   - Have the **Network** tab (filtered to `Fetch/XHR`) and **Application > Cookies** ready.
3. **VS Code (Editor Tabs in Order):**
   - `server.js` (Lean 118-line Application Orchestrator)
   - `routes/game.js` (Game Engine & Anti-Cheat Vault)
   - `routes/auth.js` (Virtual Identity & bcrypt Auth)
   - `services/bananaApi.js` (Interoperability & Procedural Fallback)
   - `database.js` (SQLite 3-Table Schema & Persistence)
   - `public/app.js` (Tier 1 Event-Driven Presentation Layer)
4. **Audio & Video Check:** Ensure your microphone is clear, and speak in your **authentic, confident voice** at a steady, conversational pace.

---

# ⏱️ Minute-by-Minute Teleprompter Script

---

### ⏱️ [0:00 – 1:45] PART 1: Executive Introduction & Live Application Walkthrough

#### 🎬 [SCREEN ACTION]
* Display the browser at `http://localhost:3000`. Show the dark glassmorphic **Enterprise Player Portal**.
* Show the **Register** tab: enter a new username (e.g., `Utsab`), email `utsab@example.com`, and password `password123`.
* Click **Create Account & Play** (the screen smoothly transitions into the **Game HUD**).

#### 🗣️ [WHAT TO SAY]
> *"Hello everyone, and welcome. My name is Utsab, and this is my video presentation for Assignment 1 of CIS046-3: Software for Enterprise at the University of Bedfordshire.*
>
> *Today, I am demonstrating my Enterprise Banana Challenge System—a distributed, 3-tier enterprise web application developed with Node.js, Express, a modular service-oriented architecture, Vanilla JavaScript, and an ACID-compliant SQLite relational database.*
>
> *As you can see on screen, we begin at Tier 1 with our modern, glassmorphic Enterprise Player Portal. The system provides secure user registration with unique emails and salted password hashing using bcrypt. When I register or sign in, the server establishes an authenticated, persistent virtual identity session over stateless HTTP using secure HTTP-only cookies."*

#### 🎬 [SCREEN ACTION]
* Point cursor to the **Top HUD**: Player Name (`Utsab`), Avatar (`🍌`), Title (`Banana Rookie`), Score (`0`), Streak (`0x`), and High Score.
* Point to the **Difficulty Mode Selector**: Toggle between **Easy** (casual, untimed), **Medium** (25s timer), and **Hard** (12s speed mode, 2x points, -5 penalty). Leave it on **Medium**.
* Show the algebraic puzzle dynamically loaded from **Dr. Marc Conrad’s Banana API**.
* Click digit `7` (or the correct answer) on the on-screen keypad and click **Submit Answer**.
* Point out the green celebration glow, streak bonus increment (1x), score update (+20 pts), and Web Audio chime.

#### 🗣️ [WHAT TO SAY]
> *"Here on the game dashboard, our real-time Head-Up Display reflects my player identity, custom emoji avatar, rank title, live score, and consecutive streak counter.*
>
> *We have engineered three distinct game difficulty modes: Easy with no countdown pressure, Medium with a 25-second limit, and Hard—an intense 12-second speed challenge with double points and penalty deductions.*
>
> *The visual puzzle before us is fetched in real time from Dr. Marc Conrad's external Banana API. I can input my deduction using the on-screen virtual keypad or physical keyboard numbers. Let's submit our answer... and as you can hear and see, the server validates the solution, triggers an emerald celebration pulse, plays an audio chime, and updates our live score."*

#### 🎬 [SCREEN ACTION]
* Click **Profile** in the navbar to open the modal: change your avatar to `👑` and select a title like `Monkey Sensei` or `Puzzle Master`. Click **Save Profile**.
* Click **Achievements** in the navbar: show the unlocked badges (e.g. `First Bite 🍌`) and locked progression targets. Close modal.
* Scroll down to show the **SQLite Global Leaderboard** with avatar badges and the **My Audit Trail** tab showing every recorded round attempt with exact timestamps.
* Press **F5 (Refresh)** to show the page instantly reload with player identity, avatar, streak, and high score 100% intact!

#### 🗣️ [WHAT TO SAY]
> *"Players can personalize their virtual identity by choosing custom avatar emojis and equipping earned honorific titles. In the Achievements modal, milestones such as 'First Bite', 'Streak Master', and 'Speed Demon' track long-term player progression.*
>
> *Below the game board, the SQLite-backed Global Leaderboard ranks top players worldwide, while the Audit Trail provides an immutable record of every guess, server solution, and timestamp.*
>
> *Even if I refresh the browser, our session restoration instantly rehydrates our profile, score, and state.*
>
> *Now, let us examine how this system fulfills the four core computer science themes demanded by enterprise software engineering."*

---

### ⏱️ [1:45 – 3:30] PART 2: Theme 1 — Version Control, Code Hygiene & Modular Architecture

#### 🎬 [SCREEN ACTION]
* Switch to the terminal in VS Code.
* Type and run: `git log --graph --oneline -n 6`
* Point out the latest commits, highlighting:
  - `feat: modularize backend into routes, services, and middleware architecture`
  - `feat: add game modes, sound effects, achievements, and player profiles`
* Open [`.gitignore`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/.gitignore) in VS Code.
* Open the file tree in VS Code and show the clean modular folders:
  - `routes/` (`auth.js`, `game.js`, `user.js`)
  - `services/` (`bananaApi.js`)
  - `middleware/` (`auth.js`)
  - `database.js`
  - `server.js`

#### 🗣️ [WHAT TO SAY]
> *"The first core theme is Version Control and Code Hygiene. In enterprise software engineering, version control is not merely a backup utility; it is a collaborative audit trail, feature branch workflow, and continuous delivery pipeline.*
>
> *As shown in my Git log, all development strictly adheres to semantic conventional commits—utilizing structured prefixes such as 'feat:', 'fix:', 'refactor:', and 'chore:'. Work was isolated across modular branches before merging cleanly into main on GitHub.*
>
> *In our .gitignore file, we enforce rigorous repository hygiene. Sensitive environment variables, debug logs, OS metadata, and node_modules are strictly quarantined.*
>
> *Notice also that our SQLite database directory—data/ and all .sqlite files—are intentionally untracked. This prevents binary database bloating in Git and ensures that any developer cloning the repository from GitHub can run 'npm install' and 'npm start' to auto-generate a fresh, pristine database schema.*
>
> *Furthermore, rather than maintaining a monolithic server file with over 800 lines, we refactored our backend into an enterprise modular architecture. We extracted discrete concerns into a routes directory, a bananaApi service layer, and an authentication middleware, reducing our primary server.js to a lean 118-line application orchestrator."*

---

### ⏱️ [3:30 – 5:15] PART 3: Theme 2 — Event-Driven Programming Across Client & Server

#### 🎬 [SCREEN ACTION]
* Open [`public/app.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/public/app.js) in VS Code.
* Highlight lines around `setupEventListeners()`, `selectDigit()`, `startCountdown()`, and the keyboard listener `window.addEventListener('keydown', ...)`.
* Switch to [`server.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/server.js) and [`routes/game.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/routes/game.js).
* Highlight `router.post('/submit-answer', ...)` and asynchronous Express middleware handling.

#### 🗣️ [WHAT TO SAY]
> *"Our second theme is Event-Driven Programming, which operates seamlessly across both our presentation layer and application server.*
>
> *Unlike legacy procedural software that relies on blocking loops or continuous polling, our Tier 1 client in app.js is purely reactive. When the DOM loads, it attaches asynchronous event listeners for form submissions, keypad interactions, modal toggles, and physical keyboard navigation—allowing players to use digits 0 through 9, Enter to submit, and Escape to dismiss modals.*
>
> *Our game difficulty modes also feature an active countdown timer driven by non-blocking interval tick events. When time expires, a timeout event is dispatched to the server to handle score penalties gracefully.*
>
> *Every user action dispatches asynchronous HTTP fetch requests using modern JavaScript Promises and async/await. While network traffic is in flight, non-blocking UI loaders and CSS skeletons keep the browser responsive.*
>
> *On Tier 2, Node.js uses its single-threaded, non-blocking Event Loop powered by libuv. Every incoming HTTP request is delegated asynchronously through our Express middleware pipeline, allowing the server to handle high concurrency with minimal CPU and memory overhead."*

---

### ⏱️ [5:15 – 7:15] PART 4: Theme 3 — Interoperability, 3-Tier Security Boundary & Fallback Resilience

#### 🎬 [SCREEN ACTION]
* Open [`services/bananaApi.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/services/bananaApi.js) in VS Code.
* Highlight `fetchBananaPuzzle()` (with `BANANA_API_URL`, `API_TIMEOUT_MS = 5000`, `AbortController`).
* Highlight the `FALLBACK_PUZZLES` array with embedded procedural SVG puzzles.
* Open [`routes/game.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/routes/game.js) and highlight lines 63–76 where `req.session.currentSolution = puzzle.solution` is vaulted, and only `question` is returned.
* Switch to the browser, open **DevTools > Network tab** (filtered to `Fetch/XHR`).
* Click **Skip Puzzle** to trigger `GET /api/game/new-puzzle`.
* Click on `/api/game/new-puzzle` in the Network list and open the **Response** preview.
* **Point your mouse and clearly highlight that `solution` is NOT in the response!**

#### 🗣️ [WHAT TO SAY]
> *"Our third theme is Interoperability. Enterprise systems must communicate across heterogeneous network boundaries using standardized protocols and loose coupling.*
>
> *Our backend encapsulates external communication inside services/bananaApi.js. The server communicates with Dr. Marc Conrad's external Banana API service over HTTPS GET requests, marshaling JSON payloads that contain the puzzle image URL and its mathematical answer.*
>
> *This brings us to a fundamental 3-Tier Enterprise Security Boundary: Anti-Cheat Solution Vaulting.*
>
> *In a naive client-side architecture, the browser would query the external API directly, allowing any user to open Chrome DevTools, inspect the JSON response, and see the correct answer. In our architecture, the browser never communicates directly with Dr. Marc Conrad's service.*
>
> *Our Tier 2 server acts as an API gateway. It intercepts the response, extracts the integer solution, vaults it securely inside the server-side session, and transmits ONLY the question image URL to the client. As you can see right here in our live DevTools Network tab, the response contains only the image URL and game parameters—the solution is absent. Cheating via client-side inspection is mathematically impossible.*
>
> *Furthermore, for enterprise fault tolerance, we implemented an AbortController with a 5-second timeout boundary. If Dr. Marc Conrad's upstream server experiences network latency or downtime, our system catches the exception and serves an embedded procedural SVG fallback puzzle, ensuring continuous 100% service availability."*

---

### ⏱️ [7:15 – 9:00] PART 5: Theme 4 — Virtual Identity, Security & SQLite Relational Persistence

#### 🎬 [SCREEN ACTION]
* Switch to the browser DevTools, click **Application > Cookies > http://localhost:3000**.
* Click on `connect.sid`. Show the **HttpOnly** checkbox checked, and **SameSite = Lax**.
* Switch to VS Code and open [`routes/auth.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/routes/auth.js) and [`routes/user.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/routes/user.js).
* Open [`database.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/database.js).
* Scroll to `initDatabase()` and highlight the 3 relational tables:
  1. `users` (id, username, email, password_hash, avatar, title, high_score)
  2. `game_history` (round audit log with foreign key to users)
  3. `user_achievements` (unlocked milestones with foreign key to users)
* Highlight the SQL indexes: `idx_users_high_score` and `idx_user_achievements_user`.

#### 🗣️ [WHAT TO SAY]
> *"Our fourth theme is Virtual Identity. The HTTP protocol is inherently stateless; every request arrives without memory of preceding interactions.*
>
> *To solve this, our system establishes a persistent virtual identity using express-session, bcrypt password hashing, and cryptographically signed session cookies.*
>
> *Notice here in our browser DevTools under Cookies: the session cookie 'connect.sid' is protected with the HttpOnly flag, which prevents malicious client-side JavaScript or Cross-Site Scripting attacks from reading the cookie. It also enforces SameSite Lax to defend against Cross-Site Request Forgery.*
>
> *In routes/auth.js and database.js, player passwords are never stored in plaintext—they are hashed using bcrypt with salt rounds. User profiles in routes/user.js allow players to customize their virtual identity with avatars and honorific titles.*
>
> *To elevate our application to enterprise data integrity, database.js implements an embedded SQLite relational database with full ACID guarantees. It manages three relational tables:*
> *First, the 'users' table, storing player identities, email addresses, password hashes, and high scores, optimized with a descending high_score index for instant leaderboard queries.*
> *Second, the 'game_history' table, creating an immutable audit trail of every puzzle attempted, recording the player's guess, the server solution, and the timestamp.*
> *Third, the 'user_achievements' table, maintaining relational milestone trophies linked via foreign keys with cascade deletions.*
>
> *This ensures that even if the server is stopped and restarted, player identities, credentials, custom titles, achievements, and leaderboard rankings remain permanently preserved."*

---

### ⏱️ [9:00 – 9:50] PART 6: Conclusion, Academic Attributions & Wrap-Up

#### 🎬 [SCREEN ACTION]
* Open [`readme.md`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/readme.md) in VS Code.
* Scroll to the **Academic Attribution & Integrity Disclosure** section.
* Switch back to the live browser showcasing the running game and leaderboard.
* Smile, look into the camera, and deliver the final wrap-up clearly.

#### 🗣️ [WHAT TO SAY]
> *"To conclude, this Enterprise Banana Challenge System demonstrates a robust, complete synthesis of all four core enterprise software themes:*
> 1. *Version Control with disciplined Git branching, semantic commits, and modular architecture,*
> 2. *Event-Driven Programming powering a responsive client and asynchronous Express server,*
> 3. *Interoperability with Dr. Marc Conrad's REST API backed by anti-cheat solution vaulting and SVG fallback resilience, and*
> 4. *Virtual Identity supported by session cryptography, bcrypt password hashing, and SQLite relational persistence.*
>
> *All external services and libraries—including Dr. Marc Conrad's Banana API, the Express and SQLite open-source frameworks, and assistive development tools—are fully acknowledged and cited in our readme.md and code documentation.*
>
> *Thank you very much for your time and for reviewing my presentation."*

---

## 💡 Practical Recording Tips for Scoring 100%:

1. **Pacing:** Practice reading the script once with a stopwatch before recording. Aim for **9 minutes 35 seconds**.
2. **Natural Tone:** Don't sound like a robot reading lines; speak naturally as if you are explaining your own project to your tutor.
3. **If You Stumble:** Do not restart the recording! Simply pause for 2 seconds, take a breath, repeat the last sentence cleanly, and keep going.
4. **Resolution:** Record in 1080p (1920x1080) at 30 or 60 fps with standard 16:9 widescreen format so code and DevTools text remain razor-sharp.
