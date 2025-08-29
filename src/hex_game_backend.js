/*
Visual representation (cells)
                         6 ___ 0
                     5 ___/0,6\___ 1        
                 4 ___/0,5\___/1,6\___ 2 
             3 ___/0,4\___/1,5\___/2,6\___ 3 
         2 ___/0,3\___/1,4\___/2,5\___/3,6\___ 4 
     1 ___/0,2\___/1,3\___/2,4\___/3,5\___/4,6\___ 5 
 0 ___/0,1\___/1,2\___/2,3\___/3,4\___/4,5\___/5,6\___ 6 
  /0,0\___/1,1\___/2,2\___/3,3\___/4,4\___/5,5\___/6,6\  
  \___/1,0\___/2,1\___/3,2\___/4,3\___/5,4\___/6,5\___/  Line 8
    0 \___/2,0\___/3,1\___/4,2\___/5,3\___/6,4\___/  Line 9
        7 \___/3,0\___/4,1\___/5,2\___/6,3\___/  Line 10
           14 \___/4,0\___/5,1\___/6,2\___/  Line 11
               21 \___/5,0\___/6,1\___/  Line 12
                   28 \___/6,0\___/  Line 13
                       35 \___/  Line 14
                           42
*/

export class HexGraph{
  constructor(boardSize){
    this.boardSize = boardSize;
    this.nodes = [];
  }
  setNodeUsingPlayerMoves(playerMoves){
    this.nodes = [];
    let iHex, jHex, idx;
    for(let i = 0; i<playerMoves.length; i++){
      [iHex,jHex] = playerMoves[i];
      idx = this.getIndex(iHex,jHex)
      this.nodes = [... this.nodes, idx];
    }
  }
  getRowCol(graph_index){
    return [Math.floor(graph_index / this.boardSize), graph_index % this.boardSize];
  }
  getIndex(row, col){
    return row * this.boardSize + col;
  }
  addOneNode(index){
    this.nodes = [... this.nodes, index];
  }
  getPossibleNeighbors(index){
    let possibleNeighbors = new Set();
    possibleNeighbors.add(index - 1);
    possibleNeighbors.add(index + 1);
    possibleNeighbors.add(index + this.boardSize); //down-right
    possibleNeighbors.add(index + this.boardSize - 1); //down
    possibleNeighbors.add(index - this.boardSize + 1); //up
    possibleNeighbors.add(index - this.boardSize); //up-left
    let row, col, index_row, index_col;
    [index_row,index_col] = this.getRowCol(index);
    let possibleNeighborsCopy = new Set(possibleNeighbors);
    for (const idx of possibleNeighborsCopy){
      [row,col] = this.getRowCol(idx);
      if (idx < 0 || idx > this.boardSize * this.boardSize - 1) {
        possibleNeighbors.delete(idx);
      } else if ((Math.abs(row - index_row) > 1) || (Math.abs(col - index_col) > 1)) {
        possibleNeighbors.delete(idx);
      }
    }
    return possibleNeighbors
  }
  getNeighbors(index){
    let ans = this.getPossibleNeighbors(index);
    for (const i of new Set(ans)){
      if (!this.nodes.includes(i)){
        ans.delete(i);
      }
    }
    return ans;
  }
  checkTopLeftToBottomRightConnection(){
    const allTopLeftSet = new Set();
    const allBottomRightSet = new Set();
    const topLeftSet = new Set();
    const bottomRightSet = new Set(); 
    for (let i=0; i<this.boardSize;i++){
      allTopLeftSet.add(i);
      allBottomRightSet.add(this.boardSize * this.boardSize - this.boardSize + i);
    }
    allTopLeftSet.intersection(new Set(this.nodes)).forEach(val => topLeftSet.add(val));
    allBottomRightSet.intersection(new Set(this.nodes)).forEach(val => bottomRightSet.add(val));
    const win = this.checkArrayToArrayConnection(topLeftSet,bottomRightSet);
    return win;
  }
  checkBottomLeftToTopRightConnection(){
    const allTopRightSet = new Set();
    const allBottomLeftSet = new Set();
    const topRightSet = new Set();
    const bottomLeftSet = new Set(); 
    for (let i=0; i<this.boardSize;i++){
      allTopRightSet.add((i+1) * this.boardSize-1);
      allBottomLeftSet.add(i * this.boardSize);
    }
    allTopRightSet.intersection(new Set(this.nodes)).forEach(val => topRightSet.add(val));
    allBottomLeftSet.intersection(new Set(this.nodes)).forEach(val => bottomLeftSet.add(val));
    const win = this.checkArrayToArrayConnection(bottomLeftSet, topRightSet);
    return win;
  }
  checkArrayToArrayConnection(set1, set2){
    if ((set1.size === 0) || (set2.size === 0)){
      return false
    }
    for(const item of set1){
      const unvisited = new Set([item]);
      const visited = new Set();
      let neighbors;
      while (unvisited.size > 0){
        let idx = unvisited.values().next().value;
        unvisited.delete(idx);
        neighbors = this.getNeighbors(idx);
        for(const neighbor of neighbors){
          if (!visited.has(neighbor)){
            unvisited.add(neighbor);
          }
        }
        visited.add(idx);
        for(const j of neighbors){
          if (set2.has(j)){
            return true;
          }
        }
      }
    }
    return false;
  }
  addManyNode(inputArray){
    for (let i=0; i<inputArray.length; i++){
      this.addOneNode(inputArray[i]);
    }
  }
}
//decide later to use NodeData or not
class NodeData{
  constructor(){
    this.neighbors = new Set();
    this.possibleNeighbors = new Set();
  }
}

