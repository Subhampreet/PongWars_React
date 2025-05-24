import React, { useRef, useEffect, useState, useCallback } from 'react';

// Original Source: https://pong-wars.koenvangilst.nl/
// Original Creator: Koen van Gilst

const colorPalette = {
  // Ice colors (cooler tones)
  IceBlue: "#A7D9FF", // Light ice blue
  ArcticWhite: "#F0F8FF", // Almost white, very light blue
  DeepOcean: "#2C3E50", // Dark blue for contrast (like deep water/shadows)
  FrostyMist: "#E0FFFF", // Pale cyan

  // Fire colors (warmer tones)
  FlameRed: "#FF4500", // Bright orange-red
  BurningOrange: "#FF8C00", // Vivid orange
  MoltenGold: "#FFD700", // Yellowish gold, like molten metal
  AshGray: "#4A4A4A", // Dark gray for contrast (like ash/smoke)
};

const ICE_COLOR = colorPalette.ArcticWhite; // The background color for ice territory
const ICE_BALL_COLOR = colorPalette.FlameRed; // The color of the ice ball
const FIRE_COLOR = colorPalette.FlameRed; // The background color for fire territory
const FIRE_BALL_COLOR = colorPalette.ArcticWhite; // The color of the fire ball

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
      // Half ice, half fire
      initialSquares[i][j] = i < numSquaresX / 2 ? ICE_COLOR : FIRE_COLOR;
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
    reverseColor: ICE_COLOR, // This ball changes squares to ICE_COLOR
    ballColor: ICE_BALL_COLOR,
  },
  {
    x: (CANVAS_WIDTH / 4) * 3,
    y: CANVAS_HEIGHT / 2,
    dx: -8,
    dy: 8,
    reverseColor: FIRE_COLOR, // This ball changes squares to FIRE_COLOR
    ballColor: FIRE_BALL_COLOR,
  },
];

const PongWars = () => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const [iceScore, setIceScore] = useState(0); // Changed from dayScore
  const [fireScore, setFireScore] = useState(0); // Changed from nightScore

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
  }, []);

  // Function to draw all squares and update scores
  const drawSquares = useCallback((ctx) => {
    let currentIceScore = 0;
    let currentFireScore = 0;

    const currentSquares = squaresRef.current;

    for (let i = 0; i < numSquaresX; i++) {
      for (let j = 0; j < numSquaresY; j++) {
        ctx.fillStyle = currentSquares[i][j];
        ctx.fillRect(i * SQUARE_SIZE, j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

        // Update scores based on new colors
        if (currentSquares[i][j] === ICE_COLOR) currentIceScore++;
        if (currentSquares[i][j] === FIRE_COLOR) currentFireScore++;
      }
    }
    setIceScore(currentIceScore); // Changed from setDayScore
    setFireScore(currentFireScore); // Changed from setNightScore
  }, [numSquaresX, numSquaresY]);

  // Function to check and handle square collisions
  const checkSquareCollision = useCallback((ball) => {
    let bounced = false;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const checkX = ball.x + Math.cos(angle) * (SQUARE_SIZE / 2);
      const checkY = ball.y + Math.sin(angle) * (SQUARE_SIZE / 2);

      const i = Math.floor(checkX / SQUARE_SIZE);
      const j = Math.floor(checkY / SQUARE_SIZE);

      if (i >= 0 && i < numSquaresX && j >= 0 && j < numSquaresY) {
        if (squaresRef.current[i][j] !== ball.reverseColor) {
          squaresRef.current[i][j] = ball.reverseColor;

          if (!bounced) {
            if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
              ball.dx = -ball.dx;
            } else {
              ball.dy = -ball.dy;
            }
            bounced = true;
          }
        }
      }
    }
  }, [numSquaresX, numSquaresY]);

  // Function to check and handle boundary collisions
  const checkBoundaryCollision = useCallback((ball) => {
    if (ball.x + ball.dx > CANVAS_WIDTH - SQUARE_SIZE / 2 || ball.x + ball.dx < SQUARE_SIZE / 2) {
      ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy > CANVAS_HEIGHT - SQUARE_SIZE / 2 || ball.y + ball.dy < SQUARE_SIZE / 2) {
      ball.dy = -ball.dy;
    }
  }, []);

  // Function to add randomness to ball movement
  const addRandomness = useCallback((ball) => {
    ball.dx += (Math.random() * 0.02 - 0.01);
    ball.dy += (Math.random() * 0.02 - 0.01);

    ball.dx = Math.min(Math.max(ball.dx, -MAX_SPEED), MAX_SPEED);
    ball.dy = Math.min(Math.max(ball.dy, -MAX_SPEED), MAX_SPEED);

    if (Math.abs(ball.dx) < MIN_SPEED) ball.dx = ball.dx > 0 ? MIN_SPEED : -MIN_SPEED;
    if (Math.abs(ball.dy) < MIN_SPEED) ball.dy = ball.dy > 0 ? MIN_SPEED : -MIN_SPEED;
  }, []);

  // The main game loop function
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawSquares(ctx);

    ballsRef.current.forEach((ball) => {
      drawBall(ctx, ball);
      checkSquareCollision(ball);
      checkBoundaryCollision(ball);

      ball.x += ball.dx;
      ball.y += ball.dy;

      addRandomness(ball);
    });

    animationFrameId.current = requestAnimationFrame(animate);
  }, [drawBall, drawSquares, checkSquareCollision, checkBoundaryCollision, addRandomness]);

  // useEffect for setting up and cleaning up the game loop
  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [animate]);

  return (
    <div id="container">
      <canvas id="pongCanvas" ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}></canvas>
      {/* Updated score display text */}
      <div id="score">ice {iceScore} | fire {fireScore}</div>
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