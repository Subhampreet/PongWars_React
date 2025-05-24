import React, { useRef, useEffect, useState, useCallback } from 'react';

// Source palette: https://twitter.com/AlexCristache/status/1738610343499157872
// Idea for Pong wars: https://twitter.com/nicolasdnl/status/1749715070928433161

const colorPalette = {
  ArcticPowder: '#F1F6F4',
  MysticMint: '#D9E8E3',
  Forsythia: '#FFC801',
  DeepSaffron: '#FF9932',
  NocturnalExpedition: '#114C5A',
  OceanicNoir: '#172B36',
};

const DAY_COLOR = colorPalette.MysticMint;
const DAY_BALL_COLOR = colorPalette.NocturnalExpedition;
const NIGHT_COLOR = colorPalette.NocturnalExpedition;
const NIGHT_BALL_COLOR = colorPalette.MysticMint;
const SQUARE_SIZE = 25;
const MIN_SPEED = 5;
const MAX_SPEED = 10;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;

// Helper function to initialize squares
const initializeSquares = () => {
  const numSquaresX = CANVAS_WIDTH / SQUARE_SIZE;
  const numSquaresY = CANVAS_HEIGHT / SQUARE_SIZE;
  const initialSquares = [];
  for (let i = 0; i < numSquaresX; i++) {
    initialSquares[i] = [];
    for (let j = 0; j < numSquaresY; j++) {
      initialSquares[i][j] = i < numSquaresX / 2 ? DAY_COLOR : NIGHT_COLOR;
    }
  }
  return initialSquares;
};

// Helper function to initialize balls
const initializeBalls = () => [
  {
    x: CANVAS_WIDTH / 4,
    y: CANVAS_HEIGHT / 2,
    dx: 8,
    dy: -8,
    reverseColor: DAY_COLOR,
    ballColor: DAY_BALL_COLOR,
  },
  {
    x: (CANVAS_WIDTH / 4) * 3,
    y: CANVAS_HEIGHT / 2,
    dx: -8,
    dy: 8,
    reverseColor: NIGHT_COLOR,
    ballColor: NIGHT_BALL_COLOR,
  },
];

const PongWars = () => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const [dayScore, setDayScore] = useState(0);
  const [nightScore, setNightScore] = useState(0);

  // Using useRef for mutable game state that doesn't trigger re-renders
  // This is crucial for performance in a game loop.
  const squaresRef = useRef(initializeSquares());
  const ballsRef = useRef(initializeBalls());

  const numSquaresX = CANVAS_WIDTH / SQUARE_SIZE;
  const numSquaresY = CANVAS_HEIGHT / SQUARE_SIZE;

  // Function to draw a single ball
  const drawBall = useCallback((ctx, ball) => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, SQUARE_SIZE / 2, 0, Math.PI * 2, false);
    ctx.fillStyle = ball.ballColor;
    ctx.fill();
    ctx.closePath();
  }, []); // No dependencies, as it only uses ctx and ball

  // Function to draw all squares and update scores
  const drawSquares = useCallback(
    (ctx) => {
      let currentDayScore = 0;
      let currentNightScore = 0;

      // Create a new array for squares to ensure immutability for React state updates if we were to use useState for squares
      // However, since we're directly mutating squaresRef.current for performance in the game loop,
      // we ensure the mutation is done before setting scores.
      const currentSquares = squaresRef.current;

      for (let i = 0; i < numSquaresX; i++) {
        for (let j = 0; j < numSquaresY; j++) {
          ctx.fillStyle = currentSquares[i][j];
          ctx.fillRect(
            i * SQUARE_SIZE,
            j * SQUARE_SIZE,
            SQUARE_SIZE,
            SQUARE_SIZE
          );

          if (currentSquares[i][j] === DAY_COLOR) currentDayScore++;
          if (currentSquares[i][j] === NIGHT_COLOR) currentNightScore++;
        }
      }
      setDayScore(currentDayScore);
      setNightScore(currentNightScore);
    },
    [numSquaresX, numSquaresY]
  ); // Dependencies include constants

  // Function to check and handle square collisions
  const checkSquareCollision = useCallback(
    (ball) => {
      let bounced = false;
      // Iterate through multiple points around the ball's circumference for more robust collision detection
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const checkX = ball.x + Math.cos(angle) * (SQUARE_SIZE / 2);
        const checkY = ball.y + Math.sin(angle) * (SQUARE_SIZE / 2);

        const i = Math.floor(checkX / SQUARE_SIZE);
        const j = Math.floor(checkY / SQUARE_SIZE);

        if (i >= 0 && i < numSquaresX && j >= 0 && j < numSquaresY) {
          if (squaresRef.current[i][j] !== ball.reverseColor) {
            // Square hit! Update square color (direct mutation for performance)
            squaresRef.current[i][j] = ball.reverseColor;

            // Determine bounce direction based on the angle (prevents multiple bounces on a single square)
            if (!bounced) {
              // Only bounce once per square interaction
              if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
                ball.dx = -ball.dx;
              } else {
                ball.dy = -ball.dy;
              }
              bounced = true; // Mark as bounced to prevent further direction changes for this collision
            }
          }
        }
      }
    },
    [numSquaresX, numSquaresY]
  );

  // Function to check and handle boundary collisions
  const checkBoundaryCollision = useCallback((ball) => {
    if (
      ball.x + ball.dx > CANVAS_WIDTH - SQUARE_SIZE / 2 ||
      ball.x + ball.dx < SQUARE_SIZE / 2
    ) {
      ball.dx = -ball.dx;
    }
    if (
      ball.y + ball.dy > CANVAS_HEIGHT - SQUARE_SIZE / 2 ||
      ball.y + ball.dy < SQUARE_SIZE / 2
    ) {
      ball.dy = -ball.dy;
    }
  }, []); // No dependencies, as it only uses CANVAS_WIDTH/HEIGHT

  // Function to add randomness to ball movement
  const addRandomness = useCallback((ball) => {
    ball.dx += Math.random() * 0.02 - 0.01;
    ball.dy += Math.random() * 0.02 - 0.01;

    // Limit the speed of the ball
    ball.dx = Math.min(Math.max(ball.dx, -MAX_SPEED), MAX_SPEED);
    ball.dy = Math.min(Math.max(ball.dy, -MAX_SPEED), MAX_SPEED);

    // Make sure the ball always maintains a minimum speed
    if (Math.abs(ball.dx) < MIN_SPEED)
      ball.dx = ball.dx > 0 ? MIN_SPEED : -MIN_SPEED;
    if (Math.abs(ball.dy) < MIN_SPEED)
      ball.dy = ball.dy > 0 ? MIN_SPEED : -MIN_SPEED;
  }, []); // No dependencies

  // The main game loop function
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Clear canvas

    drawSquares(ctx); // Draw squares and update scores

    ballsRef.current.forEach((ball) => {
      drawBall(ctx, ball);
      checkSquareCollision(ball);
      checkBoundaryCollision(ball);

      // Update ball position
      ball.x += ball.dx;
      ball.y += ball.dy;

      addRandomness(ball);
    });

    animationFrameId.current = requestAnimationFrame(animate); // Request next frame
  }, [
    drawBall,
    drawSquares,
    checkSquareCollision,
    checkBoundaryCollision,
    addRandomness,
  ]);

  // useEffect for setting up and cleaning up the game loop
  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animate); // Start the animation loop

    return () => {
      // Cleanup: cancel the animation frame when the component unmounts
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [animate]); // Re-run effect if 'animate' function changes (due to useCallback deps)

  return (
    <div id="container">
      <canvas
        id="pongCanvas"
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      ></canvas>
      <div id="score">
        day {dayScore} | night {nightScore}
      </div>
      <p id="made">
        React Version made by{' '}
        <a href="https://github.com/Subhampreet">Subhampreet</a> | Inspired by{' '}
        <a href="https://koenvangilst.nl/labs/pong-wars">Koen van Gilst</a> |
        Source on <a href="https://github.com/vnglst/pong-wars">github</a>
      </p>
    </div>
  );
};

export default PongWars;
