
const mines = 12;
const size = 10;
var grid;


function getProperty(prop) {
    let style = getComputedStyle(document.getElementById("grid"));
    return style.getPropertyValue(prop);
}

function setProperty(prop, val) {
    document.documentElement.style.setProperty(prop, val);
}


// Possible states for the grid:
// - Untouched, with mine
// - Untouched, without mine
// - Revealed as empty
// - Flagged as having mine
// - Exploded

// State entries:
// {
//     hasMine (boolean)
//     hasFlag (boolean)
//     isRevealed (boolean)
//     numAdjacent (number)
// }

function initializeGrid(size) {
    grid = Array(size);
    let row, col;

    let sizeFieldDiv = document.getElementById("size");
    sizeFieldDiv.value = size;

    // Create the grid's structure
    for ( row = 0; row < size; row++ ) {
        grid[row] = Array(size);
        for ( col = 0; col < size; col++ ) {
            grid[row][col] = {
                hasMine: false,
                hasFlag: false,
                isRevealed: false,
                numAdjacent: 0,
            };
        }
    }

    // Determine where the mines go
    for ( let i = 0; i < mines; i++ ) {
        do {
            row = Math.floor(Math.random() * size);
            col = Math.floor(Math.random() * size);
        } while ( grid[row][col].hasMine )
        grid[row][col].hasMine = true;
    }

    // Count adjacent cells
    for ( row = 0; row < size; row++ ) {
        for ( col = 0; col < size; col++ ) {
            grid[row][col].numAdjacent = countAdjacentMines(row, col);
        }
    }
}


function countAdjacentMines(row, col, debug) {
    let adjacent = 0;
    let rowTemp, colTemp;

    for ( let rowDelta = -1; rowDelta <= 1; rowDelta++ ) {
        for ( let colDelta = -1; colDelta <= 1; colDelta++ ) {
            rowTemp = row + rowDelta;
            colTemp = col + colDelta;

            // Don't check the current cell
            if ( rowTemp == row && colTemp == col ) {
                if ( debug ) {
                    console.info("checking", rowTemp, colTemp, "CURRENT"); // DEBUG
                }
                continue;
            }

            if ( rowTemp >= 0 && rowTemp < size && colTemp >= 0 && colTemp < size ) {
                if ( debug ) {
                    console.info("checking", rowTemp, colTemp, grid[rowTemp][colTemp].hasMine); // DEBUG
                }
                if ( grid[rowTemp][colTemp].hasMine ) {
                    adjacent++;
                }
            }
        }
    }

    return adjacent;
}


// The solution is correct if every cell with a mine has been flagged and every
// cell with a flag has a mine.  So, check if hasMine === hasFlag.
// TODO: Also, make sure that every cell has either been revealed or has a flag.
function checkSolution() {
    let numRevealedOrFlagged = 0;

    for ( let row = 0; row < grid.length; row++ ) {
        for ( let col = 0; col < grid[row].length; col++ ) {
            if ( grid[row][col].hasFlag != grid[row][col].hasMine ) {
                // If hasFlag != hasMine, then the solution isn't correct.
                return false;
            }

            // This is to make sure that we don't declare victory
            // before revealing or flagging all cells.
            if ( grid[row][col].hasFlag || grid[row][col].isRevealed ) {
                numRevealedOrFlagged += 1;
            }
        }
    }

    if ( numRevealedOrFlagged == size * size ) {
        return true;
    } else {
        return false;
    }
}


function drawGrid() {
    var gridDiv = document.getElementById("grid");

    gridDiv.innerHTML = '';

    for ( let row = 0; row < grid.length; row++ ) {
        var rowElem = document.createElement("div");
        rowElem.className = "row";

        for ( let col = 0; col < grid[row].length; col++ ) {
            var cell = document.createElement("div");
            cell.className = "cell";

            if ( grid[row][col].isRevealed ) {
                cell.className += " revealed";
            }

            if ( grid[row][col].isRevealed && grid[row][col].numAdjacent != 0 ) {
                cell.className += " adjacent";
                cell.className += " adjacent-" + grid[row][col].numAdjacent;
            }

            // TEMPORARY!!
            if ( grid[row][col].hasMine ) {
                cell.className += " mine";
            }

            if ( grid[row][col].hasFlag ) {
                cell.className += " flag";
            }

            if ( grid[row][col].isRevealed && grid[row][col].numAdjacent != 0 ) {
                cell.innerHTML = grid[row][col].numAdjacent;
            }

            cell.onclick = function() {
                clickCell(row, col);
            }
            cell.oncontextmenu = function(event) {
                flagCell(row, col);
                event.preventDefault();
            }
            rowElem.appendChild(cell);
        }

        gridDiv.appendChild(rowElem);
    }

    let numFlagged = countFlaggedCells();

    let flagDiv = document.getElementById("flaggedCount");
    flagDiv.innerHTML = numFlagged;

    let minesLeftDiv = document.getElementById("mineCount");
    minesLeftDiv.innerHTML = mines - numFlagged;

    // let topBarDiv = document.getElementById("top-bar");
    setProperty("--columns", size);
    setProperty("--rows", size);
}


function revealCells(row, col) {
    console.info("revealCells()", row, col, grid[row][col]); // DEBUG

    // It should never come to this, but just in case.
    if ( grid[row][col].hasMine ) {
        return;
    }

    // Already checked this cell.
    if ( grid[row][col].isRevealed ) {
        return;
    }

    // Normal base condition.  Reveal and terminate.
    if ( grid[row][col].numAdjacent != 0 ) {
        grid[row][col].isRevealed = true;
        return;
    }

    grid[row][col].isRevealed = true;

    // Recursive step.  Call on adjacent cells.
    let rowTemp, colTemp;
    for ( let rowDelta = -1; rowDelta <= 1; rowDelta++ ) {
        for ( let colDelta = -1; colDelta <= 1; colDelta++ ) {
            rowTemp = row + rowDelta;
            colTemp = col + colDelta;

            if ( rowTemp >= 0 && rowTemp < size && colTemp >= 0 && colTemp < size ) {
                revealCells(rowTemp, colTemp);
            }
        }
    }
}


function clickCell(row, col) {
    if ( ! gameActive ) {
        return;
    }

    if ( grid[row][col].hasFlag ) {
        return;
    }

    if ( grid[row][col].hasMine ) {
        grid[row][col].isRevealed = true;
        setStatus("You lose!", "red");
        gameActive = false;
    }

    revealCells(row, col);

    if ( checkSolution() ) {
        setStatus("Victory!", "green");
        gameActive = false;
    }

    drawGrid();
}


function flagCell(row, col) {
    if ( ! gameActive ) {
        return;
    }

    console.info("Flag cell!", row, col); // DEBUG

    if ( grid[row][col].isRevealed ) {
        return;
    }

    grid[row][col].hasFlag = !grid[row][col].hasFlag;

    if ( checkSolution() ) {
        setStatus("Victory!", "green");
        gameActive = false;
    }

    drawGrid();
}


function countFlaggedCells() {
    return grid.flat()
               .map(cell => cell.hasFlag)
               .filter(val => val)
               .length;
}


// function countUntouchedCells() {
//     return grid.flat()
//                .reduce((acc, cell) => {
//                    if ( !cell.hasFlag && !cell.isRevealed ) {
//                        return acc + 1;
//                    } else {
//                        return acc
//                    }
//                }, 0)
// }


function setStatus(message, style) {
    message = message || "";
    var statusDiv = document.getElementById("status");
    statusDiv.innerHTML = message;
    statusDiv.className = style;
}


function initialize() {
    gameActive = true;
    initializeGrid(size);
    drawGrid();
    setStatus();
}

window.onload = function() {
    document.getElementById("js-reset").onclick = initialize;

    this.initialize();
}

