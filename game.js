const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const restartButton = document.getElementById("restartButton");


// -------------------------
// Bird
// -------------------------

const bird = {
    x: 80,
    y: 250,
    width: 30,
    height: 30,

    velocity: 0,

    gravity: 0.45,
    jumpStrength: -7
};


// -------------------------
// Pipes
// -------------------------

let pipes = [];

const pipeWidth = 60;
const pipeGap = 160;
const pipeSpeed = 2.5;

let pipeTimer = 0;
const pipeSpawnTime = 100;


// -------------------------
// Game state
// -------------------------

let score = 0;
let gameOver = false;


// -------------------------
// Jump
// -------------------------

function jump() {

    if (!gameOver) {
        bird.velocity = bird.jumpStrength;
    }
}


// Keyboard controls

document.addEventListener("keydown", function(event) {

    if (event.code === "Space") {
        jump();
    }

});


// Mouse controls

canvas.addEventListener("click", jump);


// -------------------------
// Create pipes
// -------------------------

function createPipe() {

    const minimumHeight = 80;

    const maximumTopHeight =
        canvas.height - pipeGap - minimumHeight;

    const topHeight =
        Math.random() *
        (maximumTopHeight - minimumHeight)
        + minimumHeight;


    pipes.push({
        x: canvas.width,

        topHeight: topHeight,

        bottomY: topHeight + pipeGap,

        passed: false
    });

}


// -------------------------
// Draw bird
// -------------------------

function drawBird() {

    // Bird body
    ctx.fillStyle = "yellow";

    ctx.fillRect(
        bird.x,
        bird.y,
        bird.width,
        bird.height
    );


    // Eye
    ctx.fillStyle = "white";

    ctx.fillRect(
        bird.x + 18,
        bird.y + 5,
        8,
        8
    );


    ctx.fillStyle = "black";

    ctx.fillRect(
        bird.x + 22,
        bird.y + 7,
        3,
        3
    );


    // Beak
    ctx.fillStyle = "orange";

    ctx.fillRect(
        bird.x + 30,
        bird.y + 13,
        10,
        6
    );

}


// -------------------------
// Draw pipes
// -------------------------

function drawPipes() {

    ctx.fillStyle = "green";

    pipes.forEach(pipe => {

        // Top pipe
        ctx.fillRect(
            pipe.x,
            0,
            pipeWidth,
            pipe.topHeight
        );


        // Bottom pipe
        ctx.fillRect(
            pipe.x,
            pipe.bottomY,
            pipeWidth,
            canvas.height - pipe.bottomY
        );

    });

}


// -------------------------
// Update pipes
// -------------------------

function updatePipes() {

    pipeTimer++;

    if (pipeTimer >= pipeSpawnTime) {

        createPipe();

        pipeTimer = 0;
    }


    pipes.forEach(pipe => {

        pipe.x -= pipeSpeed;


        // Increase score after passing a pipe
        if (
            !pipe.passed &&
            pipe.x + pipeWidth < bird.x
        ) {

            pipe.passed = true;

            score++;
        }

    });


    // Remove pipes that have left the screen
    pipes = pipes.filter(
        pipe => pipe.x + pipeWidth > 0
    );

}


// -------------------------
// Collision detection
// -------------------------

function checkCollisions() {

    // Ground / ceiling
    if (
        bird.y <= 0 ||
        bird.y + bird.height >= canvas.height
    ) {

        gameOver = true;
    }


    pipes.forEach(pipe => {

        const birdRight =
            bird.x + bird.width;

        const birdBottom =
            bird.y + bird.height;

        const pipeRight =
            pipe.x + pipeWidth;


        const birdInsidePipeX =
            birdRight > pipe.x &&
            bird.x < pipeRight;


        if (birdInsidePipeX) {

            const hitsTopPipe =
                bird.y < pipe.topHeight;

            const hitsBottomPipe =
                birdBottom > pipe.bottomY;


            if (hitsTopPipe || hitsBottomPipe) {
                gameOver = true;
            }

        }

    });

}


// -------------------------
// Score
// -------------------------

function drawScore() {

    ctx.fillStyle = "white";

    ctx.font = "bold 32px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        score,
        canvas.width / 2,
        50
    );

}


// -------------------------
// Game over screen
// -------------------------

function drawGameOver() {

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle = "white";

    ctx.textAlign = "center";


    ctx.font = "bold 40px Arial";

    ctx.fillText(
        "Game Over",
        canvas.width / 2,
        canvas.height / 2 - 40
    );


    ctx.font = "24px Arial";

    ctx.fillText(
        `Score: ${score}`,
        canvas.width / 2,
        canvas.height / 2 + 10
    );


    ctx.font = "18px Arial";

    ctx.fillText(
        "Press Restart to play again",
        canvas.width / 2,
        canvas.height / 2 + 50
    );

}


// -------------------------
// Update game
// -------------------------

function update() {

    if (gameOver) {
        return;
    }


    // Gravity
    bird.velocity += bird.gravity;

    bird.y += bird.velocity;


    updatePipes();

    checkCollisions();

}


// -------------------------
// Draw game
// -------------------------

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Sky
    ctx.fillStyle = "#70c5ce";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawPipes();

    drawBird();

    drawScore();


    if (gameOver) {
        drawGameOver();
    }

}


// -------------------------
// Game loop
// -------------------------

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(gameLoop);

}


// -------------------------
// Restart game
// -------------------------

function restartGame() {

    bird.x = 80;
    bird.y = 250;
    bird.velocity = 0;

    pipes = [];

    pipeTimer = 0;

    score = 0;

    gameOver = false;

}


restartButton.addEventListener(
    "click",
    restartGame
);


// Start game

gameLoop();