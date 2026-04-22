# src/routes

Student-friendly guide for this folder.

## What this folder is for
Route guards and route mapping helpers for public/protected navigation.

## Files in this folder
- ProtectedRoute.jsx: This is a React component file in src/routes. Its main purpose is this: Guard that blocks unauthenticated access to protected routes. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- PublicOnlyRoute.jsx: This is a React component file in src/routes. Its main purpose is this: Guard that redirects authenticated users away from public-only routes. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- routeConstants.js: This is a JavaScript file in src/routes. Its main purpose is this: Route mapping and section path resolution helpers. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
## Student tips
- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.



