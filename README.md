# Tank Trouble Frontend

## Description

This is a frontend code for the game Tank Trouble written in TypeScript using the p5.js library. The game is a classic shooter in which players control tanks and try to shoot down other players while avoiding their fire. The game can be played with up to 3 players on the same keyboard.

Link to the backend repository:
[tankio-backend](https://github.com/kubo550/tankio-backend)

## How to Play

- Use the arrow keys to move your tank.
- Use the space key to shoot.
- Avoid getting hit by the other players' fire.
- The last tank standing wins!

## Tech Details

- The game uses the p5.js library for rendering graphics and handling user input.
- The game has no player limit, but the game is best played with 2-5 players.
- The walls in the game are randomly generated at the start of each round, creating a unique play experience each time. To achieve this, the game uses a maze generation algorithm called Recursive Backtracker.

## Preview

https://user-images.githubusercontent.com/43968748/235489431-980ddfbf-b37f-44c8-9281-394cd7a8605c.mov

## How to Run

1. Clone the repository.
2. Run `npm install` to install the dependencies.
3. Run `npm start` to start the development server.
4. Clone backend repository from https://github.com/kubo550/tankio-backend
5. Run `npm install` to install the server dependencies.
6. Run `npm run dev` to start the server.
7. Open http://localhost:3000 in your browser.
8. Enjoy the game!
