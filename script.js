const SCRIPT_URL = "URL_WEB_APP_GOOGLE_SCRIPT_ANDA";

// DOM Elements
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const overScreen = document.getElementById("over-screen");
const leaderboardScreen = document.getElementById("leaderboard-screen");

const startForm = document.getElementById("start-form");
const usernameInput = document.getElementById("username");
const waInput = document.getElementById("wa");

const currentScoreDisplay = document.getElementById("current-score");
const timerDisplay = document.getElementById("timer-display");
const finalScoreDisplay = document.getElementById("final-score");
const leaderboardList = document.getElementById("leaderboard-list");

const btnMenuLeaderboard = document.getElementById("btn-menu-leaderboard");
const btnOverLeaderboard = document.getElementById("btn-over-leaderboard");
const btnBackMenu = document.getElementById("btn-back-menu");
const btnRestart = document.getElementById("btn-restart");
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// State Global
let playerInfo = { username: "", wa: "" };
let gameLoopId = null;
let timerInterval = null;
let isGameOver = false;
let score = 0;
let timeLeft = 30;

// Objek Game
let player = { x: 145, y: 330, width: 70, height: 16, speed: 7 };
let target = { x: 0, y: 0, radius: 10, speed: 3.5 };

let moveLeft = false;
let moveRight = false;

// Event Movement Controls
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") moveLeft = true;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveRight = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") moveLeft = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveRight = false;
});

function bindControl(btn, dir) {
  const start = (e) => { e.preventDefault(); if (dir === "L") moveLeft = true; else moveRight = true; };
  const stop = (e) => { e.preventDefault(); if (dir === "L") moveLeft = false; else moveRight = false; };
  
  btn.addEventListener("mousedown", start);
  btn.addEventListener("mouseup", stop);
  btn.addEventListener("touchstart", start);
  btn.addEventListener("touchend", stop);
}
bindControl(btnLeft, "L");
bindControl(btnRight, "R");

// Submit Form
startForm.addEventListener("submit", (e) => {
  e.preventDefault();
  playerInfo.username = usernameInput.value.trim();
  playerInfo.wa = waInput.value.trim();

  if (playerInfo.username && playerInfo.wa) {
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    initGame();
  }
});

// Navigation
function openLeaderboard() {
  menuScreen.classList.add("hidden");
  overScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  leaderboardScreen.classList.remove("hidden");
  fetchLeaderboard();
}

btnMenuLeaderboard.addEventListener("click", openLeaderboard);
btnOverLeaderboard.addEventListener("click", openLeaderboard);
btnBackMenu.addEventListener("click", () => {
  leaderboardScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
});
btnRestart.addEventListener("click", () => {
  overScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  initGame();
});

// Game Core Logic
function initGame() {
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  if (timerInterval) clearInterval(timerInterval);

  isGameOver = false;
  score = 0;
  timeLeft = 30;
  moveLeft = false;
  moveRight = false;

  player.x = (canvas.width - player.width) / 2;
  currentScoreDisplay.textContent = "0";
  timerDisplay.textContent = "30s";

  spawnTarget();
  gameLoop();

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `${timeLeft}s`;

    if (timeLeft <= 0) {
      gameOver();
    }
  }, 1000);
}

function spawnTarget() {
  target.x = Math.random() * (canvas.width - 40) + 20;
  target.y = -10;
  target.speed = 3.5 + Math.floor(score / 50) * 0.5;
}

function update() {
  if (isGameOver) return;

  // Gerakan Pemain
  if (moveLeft && player.x > 0) player.x -= player.speed;
  if (moveRight && player.x + player.width < canvas.width) player.x += player.speed;

  // Gerakan Kristal
  target.y += target.speed;

  // Deteksi Tabrakan (Pemain Mengambil Kristal)
  if (
    target.y + target.radius >= player.y &&
    target.y - target.radius <= player.y + player.height &&
    target.x >= player.x &&
    target.x <= player.x + player.width
  ) {
    score += 10;
    currentScoreDisplay.textContent = score;
    spawnTarget();
  }

  // Jika Kristal Jatuh Melewati Layar
  if (target.y > canvas.height) {
    spawnTarget();
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gambar Pemain (Pesawat/Papan)
  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Gambar Kristal (Target)
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
  ctx.fill();
}

function gameLoop() {
  if (isGameOver) return;

  update();
  render();

  if (!isGameOver) {
    gameLoopId = requestAnimationFrame(gameLoop);
  }
}

function gameOver() {
  isGameOver = true;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  if (timerInterval) clearInterval(timerInterval);

  finalScoreDisplay.textContent = score;

  gameScreen.classList.add("hidden");
  overScreen.classList.remove("hidden");

  saveScore(score);
}

// Service Google Sheets
function saveScore(scoreValue) {
  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "saveScore",
      username: playerInfo.username,
      wa: playerInfo.wa,
      score: scoreValue
    })
  }).catch((err) => console.error("Gagal menyimpan:", err));
}

function fetchLeaderboard() {
  leaderboardList.innerHTML = '<li class="loading">Memuat data leaderboard...</li>';

  fetch(SCRIPT_URL)
    .then((res) => res.json())
    .then((data) => {
      leaderboardList.innerHTML = "";
      if (!data || data.length === 0) {
        leaderboardList.innerHTML = '<li class="loading">Belum ada skor tercatatkan.</li>';
        return;
      }

      data.forEach((entry) => {
        const li = document.createElement("li");
        li.textContent = `${entry.username} — ${entry.score} Poin`;
        leaderboardList.appendChild(li);
      });
    })
    .catch((err) => {
      console.error("Gagal mengambil leaderboard:", err);
      leaderboardList.innerHTML = '<li class="loading">Gagal memuat leaderboard.</li>';
    });
      }
