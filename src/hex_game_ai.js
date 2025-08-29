import {HexGraph} from './hex_game_backend.js'

function shuffleArray(array) {
  let currentIndex = array.length;
  let randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

export class HexGameAi{
  constructor(boardSize){
    this.boardSize = boardSize;
  }
  moveToIdx(move){
    return move[0]*this.boardSize+move[1];
  }
  idxToMove(idx){
    return [Math.floor(idx/this.boardSize), idx % this.boardSize]
  }
  getAvailableIndices(player1Moves, player2Moves){
    let player1Set = new Set(player1Moves.map((ij)=>this.moveToIdx(ij)));
    let player2Set = new Set(player2Moves.map((ij)=>this.moveToIdx(ij)));
    const allIdx = new Set([...Array(this.boardSize**2).keys()]);
    return [...allIdx.difference(player1Set).difference(player2Set)];
  }
  fillBoard(player1Moves, player2Moves){
    let player1Set = new Set(player1Moves.map((ij)=>this.moveToIdx(ij)));
    const futureIdx = shuffleArray(this.getAvailableIndices(player1Moves, player2Moves));
    const midValue = Math.floor(futureIdx.length/2);
    return [...player1Set, ...futureIdx.slice(midValue,futureIdx.length)]
    //does not need to return filled board of player-2 indices
  };
  fillAndCheckWinner(player1Moves, player2Moves){
    const hexGraph = new HexGraph(this.boardSize); //check only if player-1 win. No draw
    const filledPlayer1 = this.fillBoard(player1Moves, player2Moves);
    hexGraph.setNodeUsingPlayerMoves(filledPlayer1.map(idx=>this.idxToMove(idx)));
    if (hexGraph.checkTopLeftToBottomRightConnection()){
      return 0
    } else {
      return 1
    }
  }
  getWinRate(player1Moves, player2Moves, numberOfGames = 100){
    const winRate = {p1:0, p2:0};
    for(let i = 0; i < numberOfGames; i++){
      if(this.fillAndCheckWinner(player1Moves, player2Moves) === 0){
        winRate.p1 +=1;
      } else{
        winRate.p2 +=1;
      }
    }
    return winRate
  }
  searchNextMove(player1Moves, player2Moves, numberOfGames=100){
    let idxToWinRate = new Map();
    let availableIndices = this.getAvailableIndices(player1Moves, player2Moves)
    if (player1Moves.length > player2Moves.length){
      //search player2 turn
      for (const idx of availableIndices){
        const move = this.idxToMove(idx);
        const winRate = this.getWinRate(player1Moves, [...player2Moves, move], numberOfGames);
        idxToWinRate.set(idx,winRate.p2);
      }
    } else {
      //search player1 turn
      for (const idx of availableIndices){
        const move = this.idxToMove(idx);
        const winRate = this.getWinRate([...player1Moves, move], player2Moves, numberOfGames);
        idxToWinRate.set(idx,winRate.p1);
      }
    }
    return [...idxToWinRate.entries()].sort((a,b)=>b[1]-a[1]);
  }
  bestNextMove(player1Moves, player2Moves, numberOfGames=100){
    return this.idxToMove(this.searchNextMove(player1Moves, player2Moves, numberOfGames)[0][0]);
  }
}
//const test = new HexGameAi(7);
//console.log(test.getWinRate([[3,3],[1,4],[5,2],[0,5],[2,4],[4,2]],[[0,0],[6,6],[0,6],[3,0],[0,4]]));
//console.log(test.getWinRate([[3,3]],[[]],100));
//console.log(test.bestNextMove([[3,3],[1,4],[5,2],[0,5],[2,4],[4,2]],[[0,0],[6,6],[0,6],[3,0],[0,4],[6,2]],100));