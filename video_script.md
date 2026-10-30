# CIS046-3 Software For Enterprise — 10-Minute Authentic Video Script
## Assignment 1: Enterprise Banana Challenge System
**Student Name:** Utsab  
**Institution:** University of Bedfordshire  
**Module Code:** CIS046-3  
**Target Video Duration:** Exactly 9:30 – 9:55 (Must not exceed 10:00)

---

## Recording Setup & Checklist Before You Press Record

1. **Terminal 1:** Run `npm start` (Make sure the server is live at `http://localhost:3000`).
2. **Browser:** Open Chrome/Edge at `http://localhost:3000` (Make sure you are logged out).
3. **Browser DevTools:** Keep DevTools ready (`F12`), docked to the right or bottom. Have the **Network** tab and **Application > Cookies** tab accessible.
4. **VS Code:** Keep these tabs open in order:
   - `public/app.js`
   - `server.js`
   - `database.js`
   - `.gitignore`
   - `readme.md`
5. **Screen Recorder:** Open OBS Studio, Zoom, or Xbox Game Bar (`Win + G`). Ensure your microphone is clear and recording your **real, authentic voice**.

---

# Minute-by-Minute Teleprompter Script

---

### [0:00 – 1:45] PART 1: Introduction & Live Application Demonstration

#### [SCREEN ACTION]
* Show browser at `http://localhost:3000` showing the clean, professional Enterprise Player Portal.
* Show the **Register** tab: enter username `Utsab`, email `utsab@example.com`, and password `password123`.
* Click **Create Account & Play** (or enter credentials on **Sign In** and click **Sign In & Play**).

#### [WHAT TO SAY]
> *"Hello everyone, and welcome. My name is Utsab, and this is my video presentation for Assignment 1 of CIS046-3: Software for Enterprise at the University of Bedfordshire.*
>
> *Today, I am demonstrating my Enterprise Banana Challenge System—a distributed, 3-tier web application built with Node.js, Express, Vanilla JavaScript, and an ACID-compliant SQLite relational database.*
>
> *As you can see on screen, we begin at the presentation layer with our Enterprise Player Portal. The system provides secure user authentication with username, email, and password hashing using bcrypt. When I register or sign in, the system establishes a stateful, authenticated virtual identity session over stateless HTTP using secure session cookies."*

#### [SCREEN ACTION]
* The screen smoothly transitions to the **Game Stage & HUD**.
* Point mouse at the top stats bar (Player: Utsab, Score: 0, Streak: 0x, High Score, Rounds: 0).
* Show the puzzle card loading from Dr. Marc Conrad's Banana API.
* Click digit `7` (or whatever the correct answer is) on the on-screen keypad and click **Submit**.
* Watch the green celebration flash, streak increment (1x), score increase (+10), and toast notification appear.

#### [WHAT TO SAY]
> *"Here on the game dashboard, we have our real-time Head-Up Display showing my active player name, live score, consecutive streak counter, and total rounds played.*
>
> *A mathematical puzzle has been fetched dynamically from Dr. Marc Conrad's external Banana API service.*
>
> *Let's deduce the missing number. I can use either the on-screen virtual keypad or physical keyboard numbers. Let's submit our answer... and as you can see, the system validates the answer on the server, triggers an emerald celebration pulse, and awards a streak multiplier bonus."*

#### [SCREEN ACTION]
* Intentionally click an incorrect digit (e.g. `0`) and hit **Submit**.
* Watch the card perform a red shake animation and the streak reset to `0x`.
* Scroll down to the **SQLite Global Leaderboard** and **My Audit Trail** tab.
* Click **My Audit Trail** to show the round history logged in SQLite.
* Click the **Leaderboard** button in the top navbar to open the modal dialog. Close it.
* Hit **F5 (Refresh)** to show that the player state, score, and session remain completely intact!

#### [WHAT TO SAY]
> *"If I intentionally enter an incorrect answer, notice the visual tactile feedback—the card shakes, a descriptive error banner appears, and the streak resets to zero.*
>
> *Right below the game board, we have our SQLite-backed Global Leaderboard and a live Audit Trail tab, which logs every single round attempt, the submitted guess, the server solution, and the timestamp.*
>
> *Even if I refresh the browser right now, my virtual identity, high score, and session persist seamlessly.*
>
> *Now, let's explore how this implementation directly embodies the four foundational computer science themes required by our module syllabus."*

---

### [1:45 – 3:30] PART 2: Theme 1 — Version Control & Code Hygiene

#### [SCREEN ACTION]
* Switch to VS Code terminal or Git GUI.
* Type and run: `git log --graph --oneline -n 8`
* Open [`.gitignore`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/.gitignore).

#### [WHAT TO SAY]
> *"The first core theme is Version Control. In enterprise software engineering, version control is not just a backup mechanism; it is an audit trail, collaboration foundation, and release management pipeline.*
>
> *As shown in my Git log, all development follows strict semantic conventional commit conventions—using prefixes like 'feat:', 'fix:', 'refactor:', 'merge:', and 'chore:'. Work was isolated across feature branches—such as feature/auth-sessions and feature/banana-api—before merging into main.*
>
> *Equally important in enterprise development is repository hygiene. If we open our .gitignore file, you can see that sensitive environment variables, debug logs, operating system metadata, and the node_modules folder are strictly quarantined from the repository.*
>
> *Furthermore, our SQLite database files—data/ and *.sqlite—are quarantined as well. This prevents binary database bloat in Git, ensuring any developer cloning the repository can run 'npm install' and 'npm start' to auto-generate a fresh, clean database schema dynamically."*

---

### [3:30 – 5:30] PART 3: Theme 2 — Event-Driven Programming

#### [SCREEN ACTION]
* Open [`public/app.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/public/app.js) in VS Code.
* Highlight lines around `setupEventListeners()` / `initEvents()`, `selectDigit()`, and `handleAnswerSubmit()`.
* Switch to [`server.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/server.js) and point to `app.post('/api/game/submit-answer', ...)` and the Express middleware chain.

#### [WHAT TO SAY]
> *"The second core theme is Event-Driven Programming, which operates across both our presentation layer and our application server.*
>
> *Unlike legacy procedural software that uses blocking while-loops or continuous polling, our Tier 1 client in app.js is purely reactive. We register asynchronous DOM event listeners for DOMContentLoaded, form submissions, virtual keypad clicks, and window keydown events for physical keyboard navigation (keys 0 through 9, Enter, and Escape).*
>
> *When an event fires, it does not freeze the browser thread. Instead, it dispatches asynchronous network requests using modern fetch() with Promises and async/await. While network traffic is in flight, non-blocking UI loaders and CSS skeletons provide immediate user feedback.*
>
> *On Tier 2, inside server.js, Node.js leverages its single-threaded, non-blocking Event Loop powered by libuv. Every incoming HTTP request is delegated asynchronously through our Express middleware pipeline, enabling the server to handle high concurrency with minimal CPU and memory overhead."*

---

### [5:30 – 7:30] PART 4: Theme 3 — Interoperability & 3-Tier Security Boundary

#### [SCREEN ACTION]
* Open [`server.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/server.js) in VS Code.
* Highlight `fetchBananaPuzzle()` (around lines 81–160).
* Point to `FALLBACK_PUZZLES` (the procedural SVG fallback).
* Switch to the browser, open **DevTools > Network tab**.
* Click **Skip Puzzle** or submit an answer so a new `/api/game/new-puzzle` request appears in the Network tab.
* Click on `/api/game/new-puzzle`, open the **Preview / Response** JSON.
* **Highlight that `solution` is NOT in the response—only `question` image URL and stats!**

#### [WHAT TO SAY]
> *"Our third theme is Interoperability. Enterprise systems rarely operate in isolation; they must communicate across heterogeneous network boundaries using standardized protocols.*
>
> *Our Tier 2 server interfaces with Dr. Marc Conrad's external Banana API service over HTTPS GET requests, marshaling JSON payloads containing the puzzle image and its mathematical solution.*
>
> *Now, let me highlight a critical architectural security mechanism: Anti-Cheat Solution Vaulting.*
>
> *If this were a naive client application, the browser would fetch the Banana API directly, allowing anyone to open Chrome DevTools, inspect the JSON response, and see the correct answer. In our 3-tier architecture, the browser never talks directly to Dr. Marc Conrad's service.*
>
> *The Node.js server acts as an API gateway. It extracts the integer solution, vaults it strictly inside req.session.currentSolution on the server, and sends ONLY the question image URL to the client. As you can see right here in our live DevTools Network tab, the response contains only the question URL. Cheating via client-side inspection is mathematically impossible.*
>
> *Furthermore, for enterprise resilience, we implemented a 5-second AbortController timeout. If Dr. Marc Conrad's upstream server suffers latency or downtime, our system gracefully catches the error and serves an internal procedural SVG fallback puzzle, guaranteeing 100% service uptime."*

---

### [7:30 – 9:15] PART 5: Theme 4 — Virtual Identity & SQLite Relational Persistence

#### [SCREEN ACTION]
* Open Browser DevTools **Application > Cookies > http://localhost:3000**.
* Click on `connect.sid`. Show the `HttpOnly` and `SameSite` flags.
* Switch to VS Code and open [`database.js`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/database.js).
* Show the `users` table schema, `game_history` table schema, and indexes.

#### [WHAT TO SAY]
> *"Our fourth theme is Virtual Identity. The HTTP protocol is inherently stateless; each request has no native memory of previous interactions.*
>
> *To solve this, our application establishes a stateful Virtual Identity using express-session, bcrypt password hashing, and cryptographically signed session cookies.*
>
> *Notice here in our browser DevTools under Cookies: we have 'connect.sid'. It is flagged as HttpOnly, which prevents malicious client-side JavaScript or Cross-Site Scripting (XSS) from hijacking the session cookie, and SameSite Lax to protect against Cross-Site Request Forgery (CSRF).*
>
> *To elevate this application to true enterprise standards, I implemented an embedded SQLite relational database in database.js.*
>
> *Rather than relying solely on volatile server RAM, our database maintains two relational tables:*
> *First, the 'users' table, storing player identities, unique emails, salted bcrypt password hashes, high scores, streaks, and timestamps, indexed by high_score.*
> *Second, the 'game_history' table, creating an immutable audit trail of every puzzle attempt, linking the player ID, user answer, vaulted solution, result, and whether it was a live API or fallback puzzle.*
>
> *This means even if the server is stopped and restarted tomorrow, player accounts, credentials, historical high scores, and leaderboards are permanently preserved with full ACID guarantees."*

---

### [9:15 – 10:00] PART 6: Conclusion, Academic Attributions & Wrap-Up

#### [SCREEN ACTION]
* Open [`readme.md`](file:///c:/Users/utsab/OneDrive/Desktop/Banana%20Game/readme.md) and scroll to **Academic Integrity & Attribution**.
* Switch back to the running web application in the browser.
* Smile and speak clearly for the final sign-off.

#### [WHAT TO SAY]
> *"To conclude, this system successfully synthesizes all four core paradigms:*
> 1. *Version Control with structured Git discipline,*
> 2. *Event-Driven Programming on both client and server,*
> 3. *Interoperability with resilient 3-tier boundary security, and*
> 4. *Virtual Identity supported by session cryptography and SQLite relational persistence.*
>
> *All external assets—including Dr. Marc Conrad's Banana API, the Express and SQLite open-source libraries, and generative scaffolding tools—are fully disclosed and cited in our readme.md and inline code headers.*
>
> *Thank you very much for your time and for watching my demonstration."*

---

## 🎬 Tips for a Smooth 10/10 Recording:
1. **Speak clearly and at a measured pace.** Do not rush.
2. **Keep an eye on the timer** on your phone or secondary monitor.
3. If you make a small stumble, just take a 1-second pause and repeat the sentence—do not worry about perfection; authentic confidence is what tutors look for!
4. **Target length:** 9 minutes 30 seconds to 9 minutes 50 seconds.
