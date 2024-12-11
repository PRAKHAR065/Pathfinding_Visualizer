
const gridContainer = document.getElementById("grid");
const algorithmSelect = document.getElementById("algorithm");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const speedSlider = document.getElementById("speed");
const resultDisplay = document.getElementById("result");

const rows = 20;
const cols = 20;
let grid = Array.from({ length: rows }, () => Array(cols).fill(0));
let start = { x: 0, y: 0 };
let end = { x: rows - 1, y: cols - 1 };
let speed = 400; // Speed in milliseconds (default)
let isPaused = false;
let pauseCallback = null;

// Create grid
function createGrid() {
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 20px)`;
  gridContainer.style.gridTemplateRows = `repeat(${rows}, 20px)`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (r === start.x && c === start.y) cell.classList.add("start");
      if (r === end.x && c === end.y) cell.classList.add("end");

      cell.addEventListener("click", () => toggleObstacle(r, c, cell));

      gridContainer.appendChild(cell);
    }
  }
}

function toggleObstacle(row, col, cell) {
  if (grid[row][col] === 0) {
    grid[row][col] = 1;
    cell.classList.add("obstacle");
  } else {
    grid[row][col] = 0;
    cell.classList.remove("obstacle");
  }
}

// Update speed from slider
speedSlider.addEventListener("input", (e) => {
  speed = 1100 - e.target.value * 200; // Adjust speed dynamically
});

// Animation helper
function animateCell(row, col, type) {
  return new Promise((resolve) => {
    if (isPaused) {
      pauseCallback = () => resolve(animateCell(row, col, type));
      return;
    }
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (type === "visited") cell.classList.add("visited");
    if (type === "path") cell.classList.add("path");
    setTimeout(resolve, speed);
  });
}

// Visualization logic
async function visualizeAlgorithm(visitedNodes, pathNodes) {
  // Animate visited nodes
  for (const { x, y } of visitedNodes) {
    await animateCell(x, y, "visited");
  }

  // Animate shortest path
  for (const { x, y } of pathNodes) {
    await animateCell(x, y, "path");
  }

  resultDisplay.textContent = `Path Found! Cost: ${pathNodes.length}`;
}

// Pathfinding algorithm simulation
async function dijkstraPathfinding() {
  const visitedNodes = [];
  const pathNodes = [{ x: start.x, y: start.y }];

  // Simulate visited nodes and pathfinding
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 0) visitedNodes.push({ x: r, y: c });
    }
  }

  pathNodes.push({ x: end.x, y: end.y });

  // Visualize the process
  await visualizeAlgorithm(visitedNodes, pathNodes);
}


async function bfsPathfinding() {
    const visitedNodes = [];
    const pathNodes = [];
    const queue = [{ x: start.x, y: start.y, parent: null }];
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    visited[start.x][start.y] = true;
  
    let found = false;
    while (queue.length > 0 && !found) {
      const current = queue.shift();
      visitedNodes.push(current);
  
      // Check if we reached the end
      if (current.x === end.x && current.y === end.y) {
        found = true;
        let path = current;
        while (path) {
          pathNodes.push(path);
          path = path.parent;
        }
        pathNodes.reverse();
        break;
      }
  
      // Explore neighbors
      for (const [dx, dy] of [
        [0, 1], [1, 0], [0, -1], [-1, 0]
      ]) {
        const nx = current.x + dx, ny = current.y + dy;
        if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !visited[nx][ny] && grid[nx][ny] === 0) {
          visited[nx][ny] = true;
          queue.push({ x: nx, y: ny, parent: current });
        }
      }
    }
  
    await visualizeAlgorithm(visitedNodes, pathNodes);
  }
  
  async function aStarPathfinding() {
    const visitedNodes = [];
    const pathNodes = [];
    const openSet = [];
    const cameFrom = new Map();
  
    const gScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    const fScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  
    const heuristic = (x, y) => Math.abs(x - end.x) + Math.abs(y - end.y);
  
    gScore[start.x][start.y] = 0;
    fScore[start.x][start.y] = heuristic(start.x, start.y);
    openSet.push({ x: start.x, y: start.y, f: fScore[start.x][start.y] });
  
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      visitedNodes.push(current);
  
      if (current.x === end.x && current.y === end.y) {
        let node = `${current.x},${current.y}`;
        while (cameFrom.has(node)) {
          const [x, y] = node.split(',').map(Number);
          pathNodes.push({ x, y });
          node = cameFrom.get(node);
        }
        pathNodes.push(start);
        pathNodes.reverse();
        break;
      }
  
      for (const [dx, dy] of [
        [0, 1], [1, 0], [0, -1], [-1, 0]
      ]) {
        const nx = current.x + dx, ny = current.y + dy;
        if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] === 0) {
          const tentative_gScore = gScore[current.x][current.y] + 1;
          if (tentative_gScore < gScore[nx][ny]) {
            cameFrom.set(`${nx},${ny}`, `${current.x},${current.y}`);
            gScore[nx][ny] = tentative_gScore;
            fScore[nx][ny] = gScore[nx][ny] + heuristic(nx, ny);
  
            if (!openSet.some(n => n.x === nx && n.y === ny)) {
              openSet.push({ x: nx, y: ny, f: fScore[nx][ny] });
            }
          }
        }
      }
    }
  
    await visualizeAlgorithm(visitedNodes, pathNodes);
  }
  
  function startPathfinding() {
    isPaused = false;
    pauseCallback = null;
  
    const algorithm = algorithmSelect.value;
  
    if (algorithm === "dijkstra") {
      dijkstraPathfinding();
    } else if (algorithm === "bfs") {
      bfsPathfinding();
    } else if (algorithm === "aStar") {
      aStarPathfinding();
    } else {
      alert("Invalid algorithm selected!");
    }
  }
  
// Pause and resume logic
function togglePause() {
  isPaused = !isPaused;
  if (!isPaused && pauseCallback) {
    pauseCallback();
    pauseCallback = null;
  }
}

// Reset the grid
resetButton.addEventListener("click", () => {
  grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  createGrid();
  resultDisplay.textContent = "Path Cost: --";
});

startButton.addEventListener("click", startPathfinding);
document.getElementById("pause").addEventListener("click", togglePause);

createGrid();
