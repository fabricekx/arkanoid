// Étape 1 — Setup minimal
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  //   canvas.width = 600;
  //   canvas.height = 400;
  canvas.style.width = window.innerWidth * 0.8 + "px"; // pour le css
  canvas.style.height = window.innerHeight * 0.8 + "px";

  canvas.width = window.innerWidth * 0.8; // pour le canvas
  canvas.height = window.innerHeight * 0.8;
}

console.log(window.innerWidth);
window.addEventListener("resize", resizeCanvas); // on appelle la fonction, on ne l'exécute pas
resizeCanvas();

// test du canvas
//   ctx.fillStyle = "gray";
//   ctx.fillRect(0,10,canvas.width,canvas.height); //top, left, width, height

// Variables globale////
let score = 0;
let stickyBallActive = false;

//// LEVELS ////

let levelIndex = 0;
const LEVELS = [
  // légende: n normal, s strong, i incassable, b bonus, . vide
  {
    rows: [
      ["b", ".", "n", ".", "b"],
      ["n", "b", "s", "b", "n"],
      ["b", "n", "i", "n", "b"],
      ["b", "b", "b", "b", "b"],
    ],
  },
  
  
  {
    rows: [
      ["i", "i", "i", "i", "i"],
      ["i", "s", "b", "s", "i"],
      ["i", "n", "b", "n", "i"],
      ["i", "s", "b", "s", "i"],
      ["i", "i", "b", "i", "i"],
    ],
  },
  {
    rows: [
      ["n", "b", "s", "b", "n"],
      [".", "s", "b", "s", "."],
      [".", ".", "b", ".", "."],
    ],
  },
  

  {
    rows: [
      ["n", "n", "n", "n", "n"],
      ["n", "s", "s", "s", "n"],
      ["b", "n", "i", "n", "b"],
    ],
  },
];

// création des objet sound:
let sound = new Audio();
const gameAudio = {
  hit: new Audio("sounds/glassBreak.wav"),
  gameOverSound: new Audio("sounds/gameOverSound.wav"),
  lost: new Audio("sounds/lost.wav"),
  paddleHit: new Audio("sounds/paddle.wav"),
  wall: new Audio("sounds/wall.wav"),
  metal: new Audio("sounds/metal.wav"),
  bonus: new Audio("sounds/bonus.wav"),
  bonus2: new Audio("sounds/bonus2.wav"),
    extend: new Audio("sounds/extend.wav"),
      power: new Audio("sounds/power.wav"),
  extralive: new Audio("sounds/extralive.wav"),
    slow: new Audio("sounds/slow.wav"),


};
//////// CLASSe BONUS /////
const bonuses = []; // tableau global pour stocker les bonus actifs

class Bonus {
  constructor(x, y, type = "expandPaddle") {
    this.x = x; // position initiale (au centre de la brique)
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.type = type; // type de bonus: "expandPaddle", "slowBall", "extraLife", "extraBall" etc.
    this.speed = 2; // vitesse de chute
    this.active = true;
    this.color = 0;
  }

  draw(ctx) {
    ctx.save(); // 🔒 sauvegarde l'état du contexte, pour empecher que la suite soit appliqué au reste du contexte

    const radius = this.width / 2;
    this.color += 5;
    ctx.beginPath();
    ctx.fillStyle = "hsl(" + this.color + " 100%, 50%)";

    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);

    ctx.fill();

    // contour optionnel
    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
    ctx.stroke();
    ctx.restore(); // restaure l'état précédent
  }

  update() {
    this.y += this.speed;

    // si touche la raquette
    if (
      this.y + this.height / 2 >= paddle.y &&
      this.y - this.height / 2 <= paddle.y + paddle.height &&
      this.x + this.width / 2 >= paddle.x &&
      this.x - this.width / 2 <= paddle.x + paddle.width
    ) {
      this.applyEffect();
      playSound(gameAudio.bonus2);
      console.log(this.type);

      this.active = false; // bonus ramassé
    }

    // si tombe en bas
    if (this.y - this.height / 2 > canvas.height) {
      this.active = false;
    }
  }

  applyEffect() {
    switch (this.type) {
      case "expandPaddle":
        paddle.width *= 1.5;
        playSound(gameAudio.extend);
        setTimeout(() => {
          paddle.width /= 1.5;
        }, 10000); // 10 secondes
        break;
      case "slowBall":
        playSound(gameAudio.slow);
        balls.forEach((ball) => {
          ball.vx *= 0.7;
          ball.vy *= 0.7;
        });
        setTimeout(() => {
          balls.forEach((ball) => {
            ball.vx /= 0.7;
            ball.vy /= 0.7;
          });
        }, 10000);
        break;

      case "extraLife":
        playSound(gameAudio.extralive);
        lives++;
        break;
      case "extraBall":
        balls.push(createBall());
        break;

      case "stickyBall":
        stickyBallActive = true;

        // optionnel : durée limitée
        setTimeout(() => {
          stickyBallActive = false;
          
        }, 20000);
        break;
        case "power":
          balls.forEach((b)=>{b.power=true});
          setTimeout(()=>balls.forEach((b)=>{b.power=false}),10000);
          break;
    }
    playSound(gameAudio.bonus);
  }
}

/////////////////////////////////// Étape 2 — La balle/////////////////////////////////////
// Modélisation
/*const ball = {
  x: canvas.width / 2,
  y: canvas.height - 30,
  radius: 6,
  vx: 3,
  vy: -3,
  alive: true
};*/

// creation d'un tableau contenant les balls:
const balls = [];

function createBall() {
  return {
    x: canvas.width / 2,
    y: canvas.height - 30,
    radius: 6,
    vx: 3 * (Math.random() > 0.5 ? 1 : -1),
    vy: -3,
    alive: true,
    stuck: false, // 👈 balle collante
    power : false, // balle traversante
  };
}

// Dessin
function drawBalls() {
  balls.forEach((ball) => {
    if (!ball.alive) return;

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function resetBalls() {
  balls.length = 0;
  balls.push(createBall());
}

resetBalls();
// drawBall();

// Mouvement sera appelée dans la boucle de jeu
function updateBalls() {
  balls.forEach((ball) => {
    if (!ball.alive) return;

    if (ball.stuck) {
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius;
      return;
    }
    ball.x += ball.vx;
    ball.y += ball.vy;
  });
}

//  //////////////////////Étape 3 — Rebonds sur les murs /////////////////////////////////////
function wallCollision() {
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];

    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
      ball.vx *= -1;
      playSound(gameAudio.wall);
    }

    if (ball.y < ball.radius) {
      ball.vy *= -1;
      playSound(gameAudio.wall);
    }
  }
}

//////////////////   Étape 4 — La raquette ///////////////////////////////
const paddle = {
  width: canvas.width / 10, // a rendre responsive
  height: 12,
  x: canvas.width / 2 - 40,
  y: canvas.height - 20,
  speed: 8,
};

function drawPaddle() {
  ctx.fillStyle = "grey";
  ctx.strokeStyle = "dark";
  ctx.lineWidth = 5;
  //  ctx.shadowColor = "lime";
  //   ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
  // ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.fill();
  ctx.stroke();
}

///////// Étape 5 — Contrôle clavier / souris //////////////////
let right = false;
let left = false;
let pause = false;

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (stickyBallActive) {
      balls.forEach((ball) => {
        if (ball.stuck) {
          ball.stuck = false;
          ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
          ball.vy = -3;
        }
      });
    } else {pause = !pause;
      balls.forEach((ball) => {
        if (ball.stuck) {
          ball.stuck = false;
          ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
          ball.vy = -3;
        } })
  }
}});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") right = true;
  if (e.key === "ArrowLeft") left = true;
});

let audioUnlocked = false;

window.addEventListener(
  "keydown",
  () => {
    if (audioUnlocked) return;

    gameAudio.hit
      .play()
      .then(() => {
        gameAudio.hit.pause();
        gameAudio.hit.currentTime = 0;
        audioUnlocked = true;
        console.log("Audio débloqué");
      })
      .catch(() => {});
  },
  { once: true },
);

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight") right = false;
  if (e.key === "ArrowLeft") left = false;
});

function updatePaddle() {
  if (right && paddle.x < canvas.width - paddle.width) {
    paddle.x += paddle.speed;
  }
  if (left && paddle.x > 0) {
    paddle.x -= paddle.speed;
  }
}

////////////////////  Étape 6 — Collision balle / raquette /////////////////////////

// Fonction améliorée:
function paddleCollisionAngle() {
  // Collision balle / paddle
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];

    if (
      ball.vy > 0 &&
      ball.x + ball.radius > paddle.x &&
      ball.x - ball.radius < paddle.x + paddle.width &&
      ball.y + ball.radius > paddle.y &&
      ball.y - ball.radius < paddle.y + paddle.height
    ) {
      playSound(gameAudio.paddleHit);

      if (stickyBallActive) {
        // on arrete la balle( et on mets à jours sa position dans la fonction updateBall)
        ball.stuck = true;
        ball.vx = 0;
        ball.vy = 0;
        ball.y = paddle.y - ball.radius;
        return;
      }
      // Calcul du point de contact relatif à la raquette
      const hitPoint = (ball.x - paddle.x) / paddle.width; // 0 = gauche, 0.5 = milieu ,1 = droite
const clampedHit = Math.max(0, Math.min(1, hitPoint)); // sécurité

      // Angle maximal de rebond (par ex. 75°)
const maxAngle = Math.PI / 3;

      // Convertir hitPoint en angle
      const angle = (clampedHit - 0.5) * 2 * maxAngle;

      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2); // vitesse constante

      ball.vx = speed * Math.sin(angle);
      ball.vy = -Math.abs(speed * Math.cos(angle)); // toujours vers le haut
    }
  }
}

///////////////////////////  Étape 7 — Les briques  ////////////////////////////////////////
// Grille de briques

const brick = {
  rows: 3,
  //   cols: 10,
  cols: Math.floor(canvas.width / 60),
  height: 20,
  // responsive: col = canvas/60, et space = 1/2 width et 60 = width+space= 3space

  offsetTop: 40,
  // offsetLeft: 30
};
brick.space = (canvas.width - canvas.width / 60) / (3 * brick.cols);
brick.width = 2 * brick.space;
const bricks = [];

function createBricks() {
  //// Remplacé par le createBricksFromLEvel
  for (let c = 0; c < brick.cols; c++) {
    bricks[c] = []; // tableau de tableau
    for (let r = 0; r < brick.rows; r++) {
      if (r == 1 && c == 0) {
        bricks[c][r] = { x: 0, y: 0, alive: true, strong: 3, extra: 1 };
      } else if (r == 2) {
        bricks[c][r] = { x: 0, y: 0, alive: true, strong: 3, extra: 0 };
      } else {
        bricks[c][r] = { x: 0, y: 0, alive: true, strong: 1, extra: 0 };
      } // on crée un abjet avec ces 3 propriétés
    }
  }
}
// createBricks();

function brickFromCode(code) {
  switch (code) {
    case "n":
      return { alive: true, strong: 1, type: "normal" };

    case "s":
      return { alive: true, strong: 3, type: "normal" };

    case "i":
      return { alive: true, strong: Infinity, type: "indestructible" };

    case "b":
      return { alive: true, strong: 1, type: "bonus" };

    default:
      return null;
  }
}

/////////// Remplace la fonction createBricks pour avoir des template basés sur LEVELS
function createBricksFromLevel(levelIndex) {
  bricks.length = 0;

  const level = LEVELS[levelIndex];

  level.rows.forEach((row, r) => {
    bricks[r] = [];

    row.forEach((cell, c) => {
      if (cell === ".") {
        bricks[r][c] = null;
        return;
      }

      bricks[r][c] = {
        ...brickFromCode(cell),
        x: 0,
        y: 0,
      };
    });
  });
}

createBricksFromLevel(levelIndex);

// Dessin
function drawBricks() {
  for (let r = 0; r < bricks.length; r++) {
    for (let c = 0; c < bricks[r].length; c++) {
      const b = bricks[r][c];
      const rowWidth =
        bricks[r].length * brick.width + (bricks[r].length - 1) * brick.space; // calcul de la largeur de la rangée
      const offsetLeft = (canvas.width - rowWidth) / 2; // calcul des marges gauche et droite

      if (!b || !b.alive) continue;

      const x = offsetLeft + c * (brick.width + brick.space);
      const y = r * (brick.height + brick.space / 3) + brick.offsetTop;

      b.x = x;
      b.y = y;
      // couleur du remplissage selon la solidité
      if (b.strong === 3) ctx.fillStyle = "red";
      else if (b.strong === 2) ctx.fillStyle = "orange";
      else ctx.fillStyle = "green";
      if (b.type == "indestructible") ctx.fillStyle = "gray";
      // dessin du remplissage
      ctx.fillRect(x, y, brick.width, brick.height);

      // contour uniquement pour les briques "extra"
      if (b.type == "bonus") {
        ctx.strokeStyle = "blue";

        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, brick.width, brick.height);
      }
    }
  }
}

////////////////   Étape 8 — Collision balle / briques /////////////////
function brickCollision() {
  balls.forEach((ball) => {
    if (!ball.alive) return;

    for (let r = 0; r < bricks.length; r++) {
      for (let c = 0; c < bricks[r].length; c++) {
        const b = bricks[r][c];
        if (!b || !b.alive) continue;

        if (
          ball.x + ball.radius > b.x &&
          ball.x - ball.radius < b.x + brick.width &&
          ball.y + ball.radius > b.y &&
          ball.y - ball.radius < b.y + brick.height
        ) {
          const overlapLeft = ball.x + ball.radius - b.x;
          const overlapRight = b.x + brick.width - (ball.x - ball.radius);
          const overlapTop = ball.y + ball.radius - b.y;
          const overlapBottom = b.y + brick.height - (ball.y - ball.radius);

          const minX = Math.min(overlapLeft, overlapRight);
          const minY = Math.min(overlapTop, overlapBottom);
if (!ball.power) {
          if (minX < minY) {
            ball.vx *= -1;
          } else {
            ball.vy *= -1;
          }
        }
          handleBrickHit(b);
          return; // 🔑 une seule collision par frame
        }
      }
    }
  });
}

function handleBrickHit(b) {
  // brique indestructible
  if (b.type === "indestructible") {
    playSound(gameAudio.metal);
    return;
  }

  // dégâts
  b.strong--;

  playSound(gameAudio.hit);
  if (b.strong <= 0) {
    b.alive = false;
    score += 10;

    // bonus éventuel
    if (b.type === "bonus") {
      spawnBonus(b.x + brick.width / 2, b.y);
    }
  }
}

function spawnBonus(x, y) {
  const types = [
    "expandPaddle",
    "slowBall",
    "extraLife",
    "extraBall",
    "stickyBall",
    "power"
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  const bonus = new Bonus(x, y, type);
  bonuses.push(bonus);
}

function handleBonus() {
  bonuses.forEach((b) => {
    b.update();
    b.draw(ctx);
  });

  // retirer les bonus inactifs
  for (let i = bonuses.length - 1; i >= 0; i--) {
    if (!bonuses[i].active) bonuses.splice(i, 1);
  }
}

function playSound(sound) {
  if (!audioUnlocked) return;
  sound.currentTime = 0;
  sound.play();
}

//////////// 10 Fonction Pause ///////
// Ne pas oublier de faire le addEventListener sur la touche space
function pauseGame() {
  {
    // Dessiner le texte pause
    // ctx.fillStyle = "rgba(0,0,0,0.5)";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
  }
}

//// 11 Vies //////////////
11; //// Définir les vies

let lives = 3; // nombre de vies initial

// Affichage des vies
function drawLives() {
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Lives: " + lives, 10, 30);
  ctx.textAlign = "right";
  ctx.fillText("Score: " + score, canvas.width - 30, 30);
}

// fonction balle perdue
function ballLoosed() {
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];

    if (ball.y - ball.radius > canvas.height) {
      playSound(gameAudio.lost);
      balls.splice(i, 1);
    }
  }

  // ⛔ IMPORTANT : sortir si pause ou game over
  if (pause) return;

  // 🎯 perte de vie UNIQUE
  if (balls.length === 0) {
    lives--;

    if (lives <= 0) {
      gameOver();
      return;
    }

    pause = true;
    setTimeout(() => {
      resetBallAndPaddle();
      pause = false;
    }, 600);
  }
}

function resetBallAndPaddle() {
  // replacer la balle au centre
  resetBalls();

  // replacer la raquette au centre
  paddle.x = (canvas.width - paddle.width) / 2;
}

function gameOver() {
  pause = true; // ou gameState.running = false si tu veux gérer running
  setTimeout(() => playSound(gameAudio.gameOverSound), 500);
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "40px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  ctx.font = "20px sans-serif";
  ctx.fillText(
    "Press Enter to restart",
    canvas.width / 2,
    canvas.height / 2 + 40,
  );
}

///////////////////   Redémarrer le jeu avec Enter ///////////////////////////////
window.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && checkVictory()) {
    nextLevel();
    resetBallAndPaddle();
    pause = false;
  }

  if (e.key === "Enter" && lives <= 0) {
    lives = 3;
    score = 0;
    levelIndex = 0;
    createBricksFromLevel(levelIndex);
    resetBallAndPaddle();
    pause = false;
  }
});

////// Victoire /////////////////
function checkVictory() {
  for (let r = 0; r < bricks.length; r++) {
    for (let c = 0; c < bricks[r].length; c++) {
      const b = bricks[r][c];
      if (!b) continue;
      if (b.alive && b.type !== "indestructible") {
        return false;
      }
    }
  }
  return true;
}

function drawVictory() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "40px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VICTORY!!!", canvas.width / 2, canvas.height / 2);
  ctx.font = "20px sans-serif";
  ctx.fillText(
    "Press Enter to next Level",
    canvas.width / 2,
    canvas.height / 2 + 40,
  );
}

function nextLevel() {
  levelIndex++;

  if (levelIndex >= LEVELS.length) {
    levelIndex = 0; // ou écran de fin
  }

  bonuses.length = 0;
  createBricksFromLevel(levelIndex);
}

/////////////////////////  Étape finale — Game loop ////////////////////////////
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (checkVictory()) {
    pause = true;
    drawVictory();
  } else if (pause) {
    pauseGame();
  } else {
    drawBalls();
    updateBalls();
    updatePaddle();
    wallCollision();
    paddleCollisionAngle();
    brickCollision();
    drawPaddle();
    drawBricks();
    drawLives();
    ballLoosed();
    handleBonus();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
