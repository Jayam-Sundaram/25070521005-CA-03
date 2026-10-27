# CINEVERSE: Your World of Film

React + Vite client, Express + Node server, MongoDB (Mongoose). Inspect data with MongoDB Compass.

## Folder structure
The project has exactly two folders:
- `client/` the React (Vite) website
- `server/` the Node.js + Express API that talks to MongoDB

## What is built
Home (hero, trending, top-rated, popular, recommended, genres), Discover (search, genre/year/min-rating filters, 3 sorts, pagination, URL query params), Movie details (cast, director, trailer, similar, reviews), register/login/logout (bcrypt + JWT in an HTTP-only cookie), ratings 1-10 with create/edit/delete reviews, persistent MongoDB watchlist, admin dashboard (stats, users, movie CRUD), TMDB integration with local fallback catalogue.

**Catalogue:** the local catalogue has 105 titles (28 series), including Marvel films, Breaking Bad, Better Call Saul, It: Welcome to Derry and more. Movies and TV Shows have their own nav links. New titles are added to MongoDB on every server start without overwriting admin edits. Posters for local titles are generated artwork; set `TMDB_API_KEY` to get real posters. In TMDB mode, "Movies and series" shows movies; pick TV series to see shows.

## Run it
Prerequisites: Node 18+, and MongoDB Community Server running locally (or an Atlas URI).
```bash
# Terminal 1: server
cd server
cp .env.example .env          # then edit JWT_SECRET (and TMDB_API_KEY if you have one)
npm install
npm run seed:admin            # creates the first admin from ADMIN_* in .env
npm run dev                   # http://localhost:5000
# Terminal 2: client
cd client
npm install
npm run dev                   # http://localhost:5173
```
Server tests: `cd server && npm test`. Production build: `cd client && npm run build`.

**Admin account:** there is no public way to become admin. `POST /api/auth/register` ignores any `role` field. Only `npm run seed:admin` (run on the server with `.env`) creates or promotes an admin.

**TMDB:** get a free key at themoviedb.org, put it in `server/.env` as `TMDB_API_KEY`. With no key, the app serves the 10-movie local catalogue stored in MongoDB.

## MongoDB Compass
1. Local: install MongoDB Community Server + Compass, connect to `mongodb://127.0.0.1:27017`. Atlas: copy the connection string from "Connect > Compass", put the same string in `MONGODB_URI`.
2. Open database `cineverse`. Collections: `users`, `movies`, `reviews`, `watchlists`.
3. Verify: post a review in the app, then refresh `reviews` in Compass (check `userId`, `movieId`, `rating`). Add a movie to the watchlist and see the new document in `watchlists`. `users.passwordHash` should look like `$2a$12$...`, never plain text.

## API
| Method | Route | Auth |
|---|---|---|
| POST | /api/auth/register, /login, /logout | public |
| GET | /api/auth/me | user |
| GET | /api/movies?q&genre&year&minRating&sort&page&list | public |
| GET | /api/movies/search, /genres, /:id | public |
| GET | /api/movies/:movieId/reviews | public |
| POST | /api/movies/:movieId/reviews | user |
| PUT/DELETE | /api/reviews/:reviewId | author (admin may delete) |
| GET/POST/DELETE | /api/watchlist, /api/watchlist/:movieId | user |
| GET | /api/admin/stats, /users, /movies | admin |
| POST/PUT/DELETE | /api/admin/movies(/:id) | admin |
| GET | /api/health | public |

## Schema
- **User**: name, email (unique), passwordHash, role (`user`|`admin`), timestamps
- **Movie** (local/fallback/admin): slug (unique), title, overview, releaseYear, runtime, genres[], director, cast[], posterUrl, backdropUrl, trailerUrl, popularity
- **Review**: userId -> User, movieId (TMDB id or slug), rating 1-10, reviewText (max 2000); unique index (userId, movieId)
- **Watchlist**: userId -> User, movieId; unique index (userId, movieId)

External metadata (TMDB) is never stored as reviews; community averages are computed with a MongoDB aggregation over `reviews`.

## Manual test checklist
- [ ] Register with a weak password: rejected. Register twice with one email: second rejected.
- [ ] Log in, refresh page: still logged in. Log out: `/watchlist` redirects to login.
- [ ] Discover: search, each filter, sorts, pagination, copy URL into a new tab.
- [ ] Open a movie, post a review, edit it, delete it. Posting a second review is refused.
- [ ] Log in as a second user: no edit/delete buttons on the first user's review.
- [ ] Add to watchlist, log out and in: still there. Remove it.
- [ ] As a normal user visit `/admin`: redirected. `curl /api/admin/stats` without login: 401.
- [ ] As admin: add, edit, delete a movie; stats update.
- [ ] Open `/movie/does-not-exist`: friendly error. Stop the server: error state with retry.

## Report outline
1. Introduction and objectives 2. Requirement analysis 3. System design (architecture, ER diagram, API design) 4. Technology choices 5. Implementation (auth, reviews, watchlist, admin, TMDB) 6. Security (hashing, cookies, validation, authorization) 7. Testing 8. Screenshots 9. Limitations and future work 10. Conclusion and references.

## How the pieces fit
React runs in the browser and draws the UI. When it needs data it calls `fetch('/api/...')`. Vite's dev proxy forwards that to Express, which runs on Node.js. Express checks the cookie, validates input, then uses Mongoose to read/write MongoDB. The JSON result travels back and React re-renders.

## Viva questions
1. **What is React?** A JavaScript library for building UIs from reusable components.
2. **Why Vite?** Fast dev server and bundler with simple config.
3. **What is Node.js?** A runtime that runs JavaScript outside the browser.
4. **What is Express?** A minimal Node framework for routes and middleware.
5. **What is MongoDB?** A document database storing JSON-like documents.
6. **What is Mongoose?** An ODM giving MongoDB schemas, validation and models.
7. **What is REST?** Resource-based URLs with HTTP verbs (GET read, POST create, PUT update, DELETE remove).
8. **What is middleware?** A function that runs between request and response, e.g. `requireAuth`.
9. **How is the password stored?** Hashed with bcrypt (12 rounds, salted); never plain text.
10. **Why hash and not encrypt?** Hashes are one-way; even admins can't recover passwords.
11. **How does login persist?** A signed JWT in an HTTP-only cookie sent automatically by the browser.
12. **Why HTTP-only cookie?** JavaScript can't read it, which limits theft via XSS.
13. **Why not localStorage for the token?** Any injected script could steal it.
14. **How is admin protected?** `requireAuth` then `requireAdmin` on every admin route; the client guard is only for UX.
15. **How do you create the first admin?** `npm run seed:admin`; registration never accepts a role.
16. **What stops editing others' reviews?** `ownReview` compares the review's `userId` to the logged-in user on the server.
17. **How is one review per user per movie enforced?** A unique compound index on (userId, movieId), plus a friendly pre-check.
18. **How is the average computed?** MongoDB `$group` with `$avg` over real review documents.
19. **How is the watchlist kept unique?** Unique index plus an idempotent `upsert`.
20. **What is CORS?** Browser rule restricting cross-origin calls; the server allows only `CLIENT_URL` with credentials.
21. **Where is the TMDB key?** In `server/.env`; only Express calls TMDB.
22. **What if there's no TMDB key?** The service layer serves the fallback catalogue seeded into MongoDB.
23. **Why URL query params on Discover?** Filters become shareable and survive refresh.
24. **How is validation done?** Server-side in `utils/validate.js` and Mongoose schemas; the UI is not trusted.
25. **What does the error middleware do?** Maps errors (validation, duplicate key, bad id) to HTTP codes in one place.
26. **What is a protected route in React?** A wrapper (`Guard`) that redirects unauthenticated users to login.
27. **What are useState/useEffect?** Hooks for component state and side effects like fetching.
28. **Which status codes do you use?** 200, 201, 400, 401, 403, 404, 409, 502.
29. **What is a reference in Mongoose?** `ObjectId` with `ref`, letting `populate` join users into reviews.
30. **What is `.env` for?** Keeps secrets out of source code and git.

## Posters when TMDB is blocked (India)
Some Indian ISPs block TMDB. Options, easiest first:
1. Change your computer or router DNS to `1.1.1.1` / `8.8.8.8`, or use a mobile hotspot from another provider, then retry.
2. Set `TMDB_BASE_URL=https://api.tmdb.org/3` in `server/.env` (alternative host; may be blocked too).
3. Skip TMDB: get a free OMDb key (omdbapi.com/apikey.aspx), set `OMDB_API_KEY` in `server/.env`, then run `npm run fetch-posters` in `server`. Posters are saved into MongoDB once, so the site shows them without calling any API afterwards. Fictional sample titles will have no poster.
4. Manually: put images in `client/public/posters/` and set Poster URL in the admin panel to `/posters/name.jpg`.
