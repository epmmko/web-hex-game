import { useState, useEffect, useCallback, memo, useRef} from 'react'
import {HexGraph} from './hex_game_backend.js'
import './App.css'
import {HexGameAi} from './hex_game_ai.js'
const ASPECT_RATIO = 1.15470058; //aspect_ratio = 2/sqrt(3)
//check if 2 arrays have the same primitive value or not
const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let k = 0; k < arr1.length; k++) {
    if (arr1[k] !== arr2[k]) {
      return false;
    }
  }
  return true;
};
//check if targetArray is in mainArray or not
//const isPresent = mainArray.some(innerArray => arraysEqual(innerArray, targetArray));

class HexBoard{
  //use vertical width = horizontal width, then use 
  // "aspect-ratio" in css to make it becomes equilateral hexagon
  // polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)
  //   x b_____c      b = (25, 0)%, c = (75, 0)%
  //     /     \
  //   a/   o  z\d    a = (0, 50)%, d = (100, 50)%
  //    \       /     o = (50, 50)%
  //     \_____/
  //   y f     e      f = (25, 100)%, e = (75, 100)%
  // aspect ratio = width / height. > 1 means wider
  // equilateral hexagon: ad / bf = 2 / sqrt(3) = 1.154700538
  // above polygon: width / height = 1
  //on screen coordinate (row, column)
  // x = (0,0)
  // a = (1,0), o = (1, 2/3)
  // y = (2,0)
  // c = (0,1)
  // z = (1,1) 
  constructor(boardSize){
    this.boardSize = boardSize;
    this.horizontalNCells = 0.25 + 0.75 * (2 * boardSize - 1);
    this.oneCellWidth = 100.0/this.horizontalNCells;
      //a to d straight length
    this.oneCellWidthText = `${this.oneCellWidth}%`;
  }
  getScreenIndex(hexRow, hexCol){
    let outScreenRow = this.boardSize + hexRow - hexCol - 1;
    let outScreenCol = hexRow + hexCol;
    return [outScreenRow, outScreenCol]; //point to topleft that is outside the hexagon
  }
  getCellTopLeftPercent(screenRow, screenCol){
    let xLeft = 0.75 * this.oneCellWidth * screenCol;
    let yTop = 0.5 * this.oneCellWidth * screenRow;
    return [xLeft, yTop];
  }
  getCellTopLeftPercentText(screenRow, screenCol){
    let [xLeft, yTop] = this.getCellTopLeftPercent(screenRow, screenCol);
    return [`${xLeft}%`, `${yTop}%`];
  }
  getCellLeftEdgePercent(hexRow, hexCol){ //return point 'a'
    let [screenRow, screenCol] = this.getScreenIndex(hexRow, hexCol);
    let [x, y] = this.getCellTopLeftPercent(screenRow+1, screenCol);
    return [x, y];
  }
  getCellTopLeftEdgePercent(hexRow, hexCol){ //return point 'b'
    let [screenRow, screenCol] = this.getScreenIndex(hexRow, hexCol);
    let [x, y] = this.getCellTopLeftPercent(screenRow, screenCol+1.0/3.0);
    return [x, y];
  }
  getCellTopRightEdgePercent(hexRow, hexCol){ //return point 'c'
    let [screenRow, screenCol] = this.getScreenIndex(hexRow, hexCol);
    let [x, y] = this.getCellTopLeftPercent(screenRow, screenCol+1);
    return [x, y];
  }
  getCellRightEdgePercent(hexRow, hexCol){ //return point 'd'
    let [screenRow, screenCol] = this.getScreenIndex(hexRow, hexCol);
    let [x, y] = this.getCellTopLeftPercent(screenRow+1, screenCol+1+1.0/3.0);
    return [x, y];
  }
  getCellBottomRightEdgePercent(hexRow, hexCol){ //return point 'e'
    let [screenRow, screenCol] = this.getScreenIndex(hexRow, hexCol);
    let [x, y] = this.getCellTopLeftPercent(screenRow+2, screenCol+1);
    return [x, y];
  }
  getCellBottomLeftEdgePercent(hexRow, hexCol){ //return point 'f'
    let [screenRow, screenCol] = this.getScreenIndex(hexRow, hexCol);
    let [x, y] = this.getCellTopLeftPercent(screenRow+2, screenCol+1.0/3.0);
    return [x, y];
  }
  getCellCenterPercent(hexRow, hexCol){ //return point 'center'
    let [screenRow, screenCol] = this.getScreenIndex(hexRow, hexCol);
    let [x, y] = this.getCellTopLeftPercent(screenRow+1, screenCol+2/3);
    x = x * ASPECT_RATIO;
    return [x, y];
  }
  getHexIndex(hexRow, hexCol){
    return hexRow * this.boardSize + hexCol;
  }
}

function HexButton({iHex, jHex, top, left, onClick, ref, backgroundColor='#777', 
      width="10%", colorBlinkCss=null, makeDisabled=false}){
    const [currentColor, setCurrentColor] = useState(backgroundColor);
    const [owner, setOwner] = useState(-1);
    const handleClick = (e)=> {
      let currentOwner;
      let winner;
      [currentOwner, winner] = onClick(e,iHex,jHex);
      if (currentOwner !== false) {
        setOwner(currentOwner);
        let cellColor = (currentOwner === 0 ? "#F77": "#77F");
        setCurrentColor(cellColor);
      }
    };
    if (colorBlinkCss === null){
      return (
          <>
          <button className="hexagon" ref={ref} onClick={handleClick} disabled={makeDisabled}
            style={{top:top, left:left, width:width, backgroundColor:currentColor}}/>
          </>
      );
    } else if (colorBlinkCss === "RED"){
      return (
          <>
          <button className="hexagon blinking-red" ref={ref} onClick={handleClick} disabled={makeDisabled}
            style={{top:top, left:left, width:width, backgroundColor:currentColor}}/>
          </>
      );
    } else if (colorBlinkCss === "BLUE"){
      return (
          <>
          <button className="hexagon blinking-blue" ref={ref} onClick={handleClick} disabled={makeDisabled}
            style={{top:top, left:left, width:width, backgroundColor:currentColor}}/>
          </>
      );
    }

}

function DropDownWithTextBox({onChoiceSelect, displayText, choicesList, initialValue, idValue, disabled, useInline=true}) {
  const [selectedValue, setSelectedValue] = useState(initialValue); // State to store the selected number
  // Event handler to update the state when the dropdown value changes
  const handleDropdownChange = (event) => {
    setSelectedValue(event.target.value);
    onChoiceSelect(event.target.value);
  };
  return (
    <>
      {useInline ? (<p style={{display:'inline'}}> {displayText} </p>) :
                   (<div>{displayText}</div>)}
      <select value={selectedValue} onChange={handleDropdownChange} id={idValue}
          className="dropdownMenu" width="1em" disabled={disabled}>
        <option value="" disabled>
        </option>
        {choicesList.map((val) => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>
    </>
  );
}

function SvgEdge({boardSize, edgeNumber, color}){
  const hexBoard = new HexBoard(boardSize);
  const N = hexBoard.boardSize;
  let svgText="";
  const edgeNumToFnObjs = { //edge number to function object: 
    0: (k) => { //top-left
      var [x, y] = hexBoard.getCellLeftEdgePercent(0,k);
      svgText += `${x*ASPECT_RATIO} ${y} `;
      var [x, y] = hexBoard.getCellTopLeftEdgePercent(0,k);
      svgText += `L${x*ASPECT_RATIO} ${y} `;
      var [x, y] = hexBoard.getCellTopRightEdgePercent(0,k);
      svgText += `L${x*ASPECT_RATIO} ${y} `;
    },
    1: (k) => { //top-right
      var [x, y] = hexBoard.getCellTopLeftEdgePercent(k,N-1);
      svgText += `${x*ASPECT_RATIO} ${y} `;
      var [x, y] = hexBoard.getCellTopRightEdgePercent(k,N-1);
      svgText += `L${x*ASPECT_RATIO} ${y} `;
      var [x, y] = hexBoard.getCellRightEdgePercent(k,N-1);
      svgText += `L${x*ASPECT_RATIO} ${y} `;
    },
    2: (k) => { //bottom-right
      var [x, y] = hexBoard.getCellBottomLeftEdgePercent(N-1,k);
      svgText += `${x*ASPECT_RATIO} ${y} `
      var [x, y] = hexBoard.getCellBottomRightEdgePercent(N-1,k);
      svgText += `L${x*ASPECT_RATIO} ${y} `
      var [x, y] = hexBoard.getCellRightEdgePercent(N-1,k);
      svgText += `L${x*ASPECT_RATIO} ${y} `
    },
    3: (k) => { //bottom-left
      var [x, y] = hexBoard.getCellLeftEdgePercent(k,0);
      svgText += `${x*ASPECT_RATIO} ${y} `
      var [x, y] = hexBoard.getCellBottomLeftEdgePercent(k,0);
      svgText += `L${x*ASPECT_RATIO} ${y} `
      var [x, y] = hexBoard.getCellBottomRightEdgePercent(k,0);
      svgText += `L${x*ASPECT_RATIO} ${y} `
    }
  }
  for (let k = 0; k < N; k++){
    if (k === 0){
      svgText += "M";
    } else {
      svgText += "L";
    }
    edgeNumToFnObjs[edgeNumber](k)
  }
  return(
    <div style={{position:'absolute', pointerEvents:'none', left:'0.5%', width:"80%", aspectRatio:1.154700538, zIndex:2}}>
      <svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="xMinYMin" xmlns="http://www.w3.org/2000/svg">
        <path d={svgText} stroke={color} strokeWidth={1} fill="none"/>
      </svg>
    </div>
  );
}

function Cursor({boardSize, cursor}){
  const hexBoard = new HexBoard(boardSize)
  var [localSRow, localSCol] = hexBoard.getScreenIndex(cursor.row,cursor.col);
  var [x,y] = hexBoard.getCellTopLeftPercentText(localSRow,localSCol);
  return(
    <>
    <div className='circle' style={{"top":y, "left":x, "pointerEvents":'none', "fill":'none',
      'width':`${hexBoard.oneCellWidth * 0.95}%`, 'clipPath':'circle(25%)', 'backgroundColor': '#15B'}}></div>
    <div className='circle' style={{"top":y, "left":x, "pointerEvents":'none', "fill":'none',
      'width':`${hexBoard.oneCellWidth * 0.95}%`, 'clipPath':'circle(18%)', 'backgroundColor': '#88F'}}></div>
    </>
  );
}
 

function MakeCells({boardSize,handleHexCellClick,winnerState, player1Moves, player2Moves, setRef}){
  const allCells = [];
  const hexBoard = new HexBoard(boardSize);
  let makeDisabled = winnerState !== "NONE";
  for(let i = 0; i < boardSize; i++){
    for(let j = 0; j < boardSize; j++){
      const [outScreenRow, outScreenCol] = hexBoard.getScreenIndex(i,j);
      const [xLeftText, yTopText] = hexBoard.getCellTopLeftPercentText(outScreenRow, outScreenCol);
      const idx = hexBoard.getHexIndex(i,j);
      allCells.push(<HexButton key={`${i}_${j}`} iHex={i} jHex={j} top ={yTopText} 
        left = {xLeftText} onClick={handleHexCellClick} ref = {(elem) => setRef(elem, idx)}
        width = {`${hexBoard.oneCellWidth * 0.95}%`} makeDisabled = {makeDisabled}/>);
    }
  }
  if (winnerState === "PLAYER-1"){
    player1Moves.map(([i,j])=>{
      const [outScreenRow, outScreenCol] = hexBoard.getScreenIndex(i,j);
      const [xLeftText, yTopText] = hexBoard.getCellTopLeftPercentText(outScreenRow, outScreenCol);
      allCells.push(<HexButton key={`${i}_${j}r`} iHex={i} jHex={j} top ={yTopText} 
        left = {xLeftText} onClick={handleHexCellClick} width = {`${hexBoard.oneCellWidth * 0.95}%`}
        colorBlinkCss="RED" makeDisabled = {makeDisabled}/>)
    });
  } else if (winnerState === "PLAYER-2") {
    player2Moves.map(([i,j])=>{
      const [outScreenRow, outScreenCol] = hexBoard.getScreenIndex(i,j);
      const [xLeftText, yTopText] = hexBoard.getCellTopLeftPercentText(outScreenRow, outScreenCol);
      allCells.push(<HexButton key={`${i}_${j}b`} iHex={i} jHex={j} top ={yTopText} 
        left = {xLeftText} onClick={handleHexCellClick} width = {`${hexBoard.oneCellWidth * 0.95}%`}
        colorBlinkCss="BLUE" makeDisabled = {makeDisabled}/>)
    });
  }
  return allCells;
}
function App() {
  const [turnCount, setTurnCount] = useState(0);
  const winner = useRef("NONE");
  const [winnerState, setWinnerState] = useState("NONE");
  const player1Moves = useRef([]);
  const player2Moves = useRef([]);
  const [gameMode, setGameMode] = useState("2 players: Mouse vs Keyboard");
  const [boardSize, setBoardSize] = useState(7);
  const onNumberSelect = (val) => setBoardSize(parseInt(val));
  const [trialPerPossibleMove, setTrialPerPossibleMove] = useState(100);
  const [statusText,setStatusText] = useState(<>Player-1's (<span style={{color: '#F88'}}>red</span>) Turn</>);
  const MemoizedSvgEdge = memo(SvgEdge);
  const [player2Cursor, setPlayer2Cursor] = useState({row:3, col:3})
  const hexRef = useRef([]);
  const aiModes = ["AI: 1st player", "AI: 2nd player", "AI vs AI"];
  const allModes = ["2 players: Mouse vs Keyboard", 
            "2 players: Take turn to click", ...aiModes];
  const setHexRef = (elem, idx) => {
    if (elem){
      hexRef.current[idx] = elem;
    }
  };
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'q':
        if (player2Cursor.row - 1 < 0){
          break;
        }
        setPlayer2Cursor((prev) => ({row: prev.row-1, col: prev.col}));
        break;
      case 'w':
        if ((player2Cursor.row - 1 < 0)||(player2Cursor.col + 1 >= boardSize)){
          break;
        }
        setPlayer2Cursor((prev) => ({row: prev.row-1, col: prev.col+1}));
        break;
      case 'e':
        if (player2Cursor.col + 1 >= boardSize){
          break;
        }
        setPlayer2Cursor((prev) => ({row: prev.row, col: prev.col+1}));
        break;
      case 'a':
        if (player2Cursor.col - 1 < 0){
          break;
        }
        setPlayer2Cursor((prev) => ({row: prev.row, col: prev.col-1}));
        break;
      case 's':
        if ((player2Cursor.row + 1 >= boardSize) || (player2Cursor.col - 1 < 0)){
          break;
        }
        setPlayer2Cursor((prev) => ({row: prev.row+1, col: prev.col-1}));
        break;
      case 'd':
        if (player2Cursor.row + 1 >= boardSize){
          break;
        }
        setPlayer2Cursor((prev) => ({row: prev.row+1, col: prev.col}));
        break;
      case 'r':
        if (turnCount % 2 === 1){

          hexRef.current[player2Cursor.row * boardSize + player2Cursor.col].click();
        }
        break;
      default:
        break;
    }
  }
  
  useEffect(() => {
    if (aiModes.includes(gameMode)){
      let aiMove;
      let hexGameAi = new HexGameAi(boardSize);
      if ((turnCount%2 === 0 && (gameMode === "AI: 1st player")) ||
          (turnCount%2 === 1 && (gameMode === "AI: 2nd player"))){
        //AI as player 1 turn
        aiMove = hexGameAi.bestNextMove(player1Moves.current, player2Moves.current, trialPerPossibleMove);
        hexRef.current[aiMove[0] * boardSize + aiMove[1]].click();
      }

      if (gameMode === "AI vs AI"){
        const timer = setTimeout(() => {
          aiMove = hexGameAi.bestNextMove(player1Moves.current, player2Moves.current, trialPerPossibleMove);
          hexRef.current[aiMove[0] * boardSize + aiMove[1]].click();
        }, 100); // 1-second delay between moves
        return () => clearTimeout(timer);
      }
      
    }
    if (gameMode === "2 players: Mouse vs Keyboard"){
      window.addEventListener('keydown', handleKeyDown);
      return () => {window.removeEventListener('keydown', handleKeyDown);};
    }

  },[boardSize, gameMode, turnCount, player2Cursor]);

  const handleHexCellClick = useCallback((event,i,j) => {
    //copy previous value of useState that will not be updated immediately
    //for nested array, use only shallow copy is enough, no mutating member array content
    let localTurnCount = turnCount;
    let currentTurn;
    let statusText1 = "";
    let alreadyOccupiedByPlayer1 = player1Moves.current.some(innerArray => arraysEqual(innerArray, [i,j]))
    let alreadyOccupiedByPlayer2 = player2Moves.current.some(innerArray => arraysEqual(innerArray, [i,j]))
    if ((!alreadyOccupiedByPlayer1) && (!alreadyOccupiedByPlayer2)){
      currentTurn = localTurnCount;
      if ((gameMode === "2 players: Mouse vs Keyboard") && (event.nativeEvent.isTrusted === true) 
          && (currentTurn%2 !==0)){
        //player-1 click when it is player-2 turn => do nothing
        return [false, null];
      }
      localTurnCount += 1;
      if (currentTurn%2 === 0) {
          player1Moves.current = [...player1Moves.current, [i,j]];
          statusText1 = <>Player-2's (<span style={{color: '#88F'}}>blue</span>) Turn</>; 
          //it was play-1 turn and now it is changed to player-2 turn
      } else {
          player2Moves.current = [...player2Moves.current, [i,j]];
          statusText1 = <>Player-1's (<span style={{color: '#F88'}}>red</span>) Turn</>;
      }
      statusText1 = statusText1;
      //update value of useState
      setTurnCount(localTurnCount);
      setStatusText(statusText1);
      checkWinner(currentTurn,player1Moves.current,player2Moves.current);
      if (winner.current === "NONE") {
        return [currentTurn%2, null];
      } else{
        return [currentTurn%2, true];
      }
      
    }
    else {
      //the click is on the existing cell, do nothing
      return [false, null];
    }
  }, [turnCount]);
  const checkWinner = ((currentTurn,localPlayer1Moves,localPlayer2Moves) => {
    let hexGraph = new HexGraph(boardSize);
    if (currentTurn%2 === 0) {
      //check if player 1 win or not
      hexGraph.setNodeUsingPlayerMoves(localPlayer1Moves);
      if (hexGraph.checkTopLeftToBottomRightConnection()){
        winner.current = "PLAYER-1";
        setStatusText("Player 1 (Red) win!");
      }
    } else {
      hexGraph.setNodeUsingPlayerMoves(localPlayer2Moves);
      if (hexGraph.checkBottomLeftToTopRightConnection()){
        winner.current = "PLAYER-2";
        setStatusText("Player 2 (Blue) win!");
      }
    }
    setWinnerState(winner.current);
  });
  return (
    <>
      <h1>Hex Game</h1>
      <div style={{position:'absolute', left:'81%', width:"18%", 
        aspectRatio:1,backgroundColor:'rgba(10, 56, 62, 1)', zIndex:0,
        fontSize:"1.5em"}}>
      <p>
        Move History<br></br>
        Player 1: {"["+player1Moves.current.map(row => "[" + row.map(item => `${item}`).join(', ') + "]").join(',')+"]"}<br></br>
        Player 2: {"["+player2Moves.current.map(row => "[" + row.map(item => `${item}`).join(', ') + "]").join(',')+"]"}
      </p>
      </div>
      <div style={{fontSize:"1.5em"}}>
        Connect two opposite sides to win<br/>
        <DropDownWithTextBox onChoiceSelect={onNumberSelect} idValue = {"board_size"}
          displayText="Selected board size: &nbsp;" choicesList={[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]} initialValue="7"
          disabled={turnCount!==0}/>
        <br/><button style={{"fontSize":'1em', "height":'1.2em', 'padding':'10px 10px', 'alignItems':'center', 'justifyContent':'center',
              'display':'flex', 'marginLeft':'0px', 'width':'220px'}} 
              onClick={()=>window.location.reload()}>Reset Game</button>
        
        <DropDownWithTextBox onChoiceSelect={(val)=>setGameMode(val)} idValue = {"play_mode"}
          displayText="Game mode: &nbsp;" choicesList={allModes}
            initialValue="2 players: Mouse vs Keyboard" disabled={turnCount!==0} useInline={false}/>
        <br/>
        <DropDownWithTextBox onChoiceSelect={(val)=>setTrialPerPossibleMove(parseInt(val))} idValue = {"setSearchNum"}
          displayText="AI trials / possible move: &nbsp;" choicesList={[100,200,500,1000,2000]}
            initialValue="2 players: Mouse vs Keyboard" disabled={turnCount!==0} useInline={true}/>
        <br/>
        {gameMode === "2 players: Mouse vs Keyboard" ? 
        <>For player-2 using keyboard (<span style={{color: "#88F"}}>blue</span>): q = up-left, w = up, e = up-right,<br/>
        a = down-left, s = down, d = down-right, r = select <br/>
        </>:""}
        {statusText}
      </div>
      <div style={{position:'absolute', left:"0.5%", width:"80%", aspectRatio:1.154700538, backgroundColor:'#242424', zIndex:1}}>
        <MakeCells boardSize={boardSize} handleHexCellClick={handleHexCellClick} setRef={setHexRef}
         winnerState={winnerState} player1Moves={player1Moves.current} player2Moves={player2Moves.current}/>
        {gameMode === "2 players: Mouse vs Keyboard" && <Cursor boardSize={boardSize} cursor={player2Cursor}/>}
        
         
      </div>
        <MemoizedSvgEdge boardSize={boardSize} edgeNumber={0} color="#F88"/>
        <MemoizedSvgEdge boardSize={boardSize} edgeNumber={1} color="#88F"/>
        <MemoizedSvgEdge boardSize={boardSize} edgeNumber={2} color="#F88"/>
        <MemoizedSvgEdge boardSize={boardSize} edgeNumber={3} color="#88F"/>
      <div style={{position:'fixed', bottom:0, right:0, padding:"10px", zIndex:100, width:"20%"}}>
This HexGame in ReactJS by Ekarit Panacharoensawad is dedicated to the public domain under CC0 1.0 .
To the extent possible under law, Ekarit Panacharoensawad has waived all copyright and related or neighboring rights to this work.
      </div>
    </>
  )
}

export default App

