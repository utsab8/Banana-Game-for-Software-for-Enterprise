CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System



📌 Project Overview



This repository contains the full source code and architectural documentation for Assignment 1 of CIS046-3: Software For Enterprise (University of Bedfordshire).



The application is an enterprise-oriented, web-based math puzzle challenge powered by the external Banana API (https://marcconrad.com/uob/banana/). It demonstrates four foundational computer science paradigms:



Version Control (Git branching, atomic commits, workflow traceability)



Event-Driven Programming (Asynchronous event loops, DOM listeners, non-blocking I/O)



Interoperability (RESTful protocol integration, JSON data marshaling, distributed 3-tier boundary)



Virtual Identity (Session abstraction, HTTP-only cookie tracking, state persistence across stateless HTTP)



🏛️ System Architecture



The application adopts a 3-Tier Distributed Architecture to ensure separation of concerns and protect business logic:



\[ Tier 1: Client / Presentation ]

&#x20;        │  (Vanilla HTML5 / CSS3 / app.js)

&#x20;        │  Captures DOM events \& renders puzzle dynamically

&#x20;        ▼

\[ Tier 2: Application Server / API Gateway ]

&#x20;        │  (Node.js \& Express - server.js)

&#x20;        │  Manages sessions, verifies user answers, secures answers

&#x20;        ▼

\[ Tier 3: External Service Provider ]

&#x20;           (Marc Conrad's Banana API Service)

&#x20;           Generates algebraic matrix puzzles \& solutions





Security Note on Interoperability: To prevent client-side inspection vulnerabilities, the browser client never interacts directly with the external Banana API. The Node.js application server fetches the puzzle, extracts and caches the solution inside an encrypted server-side session, and forwards only the question image to the browser.



🛠️ Technology Stack



Runtime \& Backend: Node.js, Express.js



Session Management: express-session (Cookie-based session store)



Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3



External Integration: HTTP REST API (JSON payload)



Version Control: Git \& GitHub (Feature branch workflow)



📂 Repository Structure



├── public/

│   ├── index.html       # Client GUI interface

│   ├── style.css        # Responsive enterprise UI styling

│   └── app.js           # Client-side event listeners and DOM dispatchers

├── .gitignore           # Git ignore rules (node\_modules, logs, secrets)

├── package.json         # Project metadata and dependencies

├── server.js            # Express server, session controller \& API proxy

└── README.md            # Comprehensive project documentation





🚀 Getting Started \& Local Installation



Prerequisites



Node.js (Version 16.x or higher)



Git



Installation Steps



Clone this repository:



git clone https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>.git

cd <YOUR-REPO-NAME>





Install project dependencies:



npm install





Launch the development server:



npm start





(or node server.js)



Access the application:

Open your browser and navigate to:



http://localhost:3000





🎯 Alignment with the 4 Assignment Themes



1\. Version Control



Development adheres to semantic commit conventions (feat:, fix:, refactor:, docs:, chore:).



Work is developed across isolated feature branches (e.g., feature/auth-sessions, feature/banana-api) before merging into main.



Build artifacts and sensitive dependencies are strictly quarantined via .gitignore.



2\. Event-Driven Programming



The user interface relies on asynchronous DOM event listeners (click, keydown).



User actions trigger non-blocking network requests (fetch) using Promises and async/await.



The Node.js event loop handles concurrent HTTP requests efficiently without thread blocking.



3\. Interoperability



The backend interfaces with an external third-party service (https://marcconrad.com/uob/banana/api.php?out=json) via standard HTTP GET protocols.



Incoming JSON payloads are parsed, transformed, and decoupled from the internal data model before serving the client.



4\. Virtual Identity



Stateless HTTP is augmented with session state using express-session.



Each player is assigned a unique session cookie (connect.sid) stored securely in the browser.



User progression, usernames, and scores are tracked per session on the backend.



📜 Academic Integrity \& Attribution



Unit: CIS046-3 Software For Enterprise



Institution: University of Bedfordshire



External API: Provided by Dr. Marc Conrad (Banana API Documentation).



Third-Party Libraries: Express.js, express-session (open-source MIT license).



All generative AI assistance or external starter templates used during development are cited within inline code 

