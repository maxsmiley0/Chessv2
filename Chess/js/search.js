//Similar to the GameBoard object, an object literal for the search
var SearchController = 
{
	nodes: 0,				//total nodes searched, including non-leaf nodes
	fh: 0,					//'fail high', tells us % how good our move ordering is
	fhf: 0,					//'fail high first'
	depth: 0,				//what depth are we searching to?
	time: 0,				//how much time we allocate to the search
	start: 0,				//what time we start the search
	stop: 0,				//boolean to determine if search has ended
	best: 0,				//stores best move found
	thinking: 0				//bool if computer is thinking
};
/*
//Picks next move, based on its history heuristic
//can we use a better sorting algorithm
function PickNextMove (MoveNum)
{
	let bestScore = -1;	
	let bestNum = MoveNum;		//stores the best move (as a number)
	
	for (let i = MoveNum; i < GameBoard.moveListStart[GameBoard.ply + 1]; i++)
	{
		if (GameBoard.moveScores[i] > bestScore)
		{
			bestScore = GameBoard.moveScores[i];
			bestNum = i;
		}
	}
	
	if (bestNum != MoveNum)
	{
		let temp = GameBoard.moveScores[MoveNum];
		GameBoard.moveScores[MoveNum] = GameBoard.move;
		GameBoard.moveScores[MoveNum] = GameBoard.move;
	}
}
*/
//Simply clears PvTable
function ClearPvTable ()
{
	for (let i = 0; i < PVENTRIES; i++)
	{
		GameBoard.PvTable[i].move = NOMOVE;
		GameBoard.PvTable[i].posKey = 0;
	}
}

//Returns if a position has already occurred
function IsRepetition ()
{
	/*
	It is inefficient to loop from the first position to now, recall that a pawn move or
	a capture is a PERMANENT modification to the board, and that is also the criteria to
	reset the fifty move counter. Thus, we only need to search starting from "fifty move counter"
	positions ago
	*/
	for (let i = GameBoard.hisPly - GameBoard.fiftyMove; i < GameBoard.hisPly - 1; i++)
	{
		
		if (GameBoard.posKey == GameBoard.history[i])
		{
			return BOOL.TRUE
		}
	}
	
	return BOOL.FALSE;
}

//Checking for a time out (time used to search exceeded time allocated to search)
function CheckUp()
{
	if (($.now() - SearchController.start) > SearchController.time)
	{	
		SearchController.stop == BOOL.TRUE;
	}
}

//Searches only captures until all nodes have been exhausted
function Quiescence (alpha, beta)
{
	//We don't want to call CheckUp every node because it's too intensive and unnecessary
	//This calls it every 2048 nodes
	if ((SearchController.nodes & 2047) == 0)
	{
		CheckUp();
	}
	
	SearchController.nodes++;
	
	//Fifty move draw rule (100 because 100 plies = 50 moves)
	if ((IsRepetition() || GameBoard.fiftyMove >= 100) && GameBoard.ply != 0)	
	{
		return 0;
	}
	
	if (GameBoard.ply > MAXDEPTH - 1)
	{
		return EvalPosition();
	}
	
	let score = EvalPosition();
	
	/*
	Standing pat: a method to quickly improve alpha beta cutoffs without loss of generality
	Logic is as follows: we assume the opponent will play the strongest move, so beta
	(the score our opponent is guaranteed) cannot be higher than the static evaluation
	*/
	if (score >= beta)
	{
		return beta;
	}
	if (score >= alpha)
	{
		alpha = score;
	}
	
	GenerateCaptures();
	
	let Legal = 0;				//How many legal moves have we made?
	let OldAlpha = alpha;		//Check to see if new best move is found (and store in PV table)
	let BestMove = NOMOVE;
	let Move = NOMOVE;
	
	/*
	Get PV Move (because we want to search best moves first)
	Order PV Move (set high move ordering score)
	*/
	
	//Loop through our moves
	for (let MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; MoveNum++)
	{
		//pick our next best move
		
		Move = GameBoard.moveList[MoveNum];
		//If illegal move, ignore
		if (MakeMove(Move) == BOOL.FALSE)
		{
			continue;
		}
		
		Legal++;
		Score = -Quiescence(-beta, -alpha);
		TakeMove();
		
		if (SearchController.stop == BOOL.TRUE)
		{
			return 0;
		}
		
		//We havent run out of time
		
		if (Score > alpha)
		{
			if (Score >= beta)
			{
				//Just a little statistics collection, gives an idea of our move ordering
				if (Legal == 1)
				{
					SearchController.fhf++;
				}
				SearchController.fh++;
				
				return beta;	//beta cutoff
			}
			alpha = Score;
			BestMove = Move;
		}
	}
	
	//New best move, store it in the PvTable
	if (alpha != OldAlpha)
	{
		StorePvMove(BestMove);
	}
	
	return alpha;
}

/*
AlphaBeta function, using a NegaMax framework 

What is the general layout for move ordering?
1. Principal Variation moves
2. Captures
3. Killer moves
4. Quiet moves ordered by values from the history heuristic
*/
function AlphaBeta (alpha, beta, depth)
{	
	//Leaf node case - return static eval	
	if (depth <= 0)
	{
		return Quiescence(alpha, beta);
	}
	
	//We don't want to call CheckUp every node because it's too intensive and unnecessary
	//This calls it every 2048 nodes
	if ((SearchController.nodes & 2047) == 0)
	{
		CheckUp();
	}
	
	SearchController.nodes++;
	
	//Fifty move draw rule (100 because 100 plies = 50 moves)
	if ((IsRepetition() || GameBoard.fiftyMove >= 100) && GameBoard.ply != 0)	
	{
		return 0;
	}
	
	if (GameBoard.ply > MAXDEPTH - 1)
	{
		return EvalPosition();
	}
	
	let InCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side], 0)], GameBoard.side^1);
	
	//If we find a line where we're in check, allocate an extra search ply, because it could often
	//to a dynamic line, with relatively small consequence (since moves out of checks are often extremely limited)
	if (InCheck == BOOL.TRUE)
	{
		depth++;
	}
	
	let Score = -INFINITE;
	
	GenerateMoves();
	
	let Legal = 0;				//How many legal moves have we made?
	let OldAlpha = alpha;		//Check to see if new best move is found (and store in PV table)
	let BestMove = NOMOVE;
	let Move = NOMOVE;
	
	/*
	Get PV Move (because we want to search best moves first)
	Order PV Move (set high move ordering score)
	*/
	
	//Loop through our moves
	for (let MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; MoveNum++)
	{
		//pick our next best move
		
		Move = GameBoard.moveList[MoveNum];
		//If illegal move, ignore
		if (MakeMove(Move) == BOOL.FALSE)
		{
			continue;
		}
		
		Legal++;
		Score = -AlphaBeta(-beta, -alpha, depth - 1);
		TakeMove();
		
		if (SearchController.stop == BOOL.TRUE)
		{
			return 0;
		}
		
		//We havent run out of time
		
		if (Score > alpha)
		{
			if (Score >= beta)
			{
				//Just a little statistics collection, gives an idea of our move ordering
				if (Legal == 1)
				{
					SearchController.fhf++;
				}
				SearchController.fh++;
				
				//update killer moves
				
				return beta;	//beta cutoff
			}
			alpha = Score;
			BestMove = Move;
			//Update history table
		}
	}
	
	//We didn't find any legal moves, so the game is over
	if (Legal == 0)
	{
		//If in check, it's checkmate
		if (InCheck == BOOL.TRUE)
		{
			//Adding ply so we can tell how many move leads to mate
			//Don't need to care about sign, taken care of by NegaMax
			return -MATE + GameBoard.ply;
		}
		//If not in check, stalemate
		else 
		{	
			return 0;
		}
	}
	
	//New best move, store it in the PvTable
	if (alpha != OldAlpha)
	{
		StorePvMove(BestMove);
	}
	
	return alpha;
}

/*
Clears our history heuristic (how we order quiet moves through alpha cutoffs) 
Clears killer move heuristic (how we order moves through beta cutoffs)
Clears PvTable
To be called before we start our search
*/
function ClearForSearch ()
{
	//indexed by piece and square
	for (let i = 0; i < 14 * BRD_SQ_NUM; i++)
	{
		GameBoard.searchHistory[i] = 0;
	}
	
	//indexed by ply, we store 3 of them per ply
	for (let i = 0; i < 3 * MAXDEPTH; i++)
	{
		GameBoard.searchKillers[i] = 0;
	}
	
	ClearPvTable();
	GameBoard.ply = 0;
	
	//Resetting members of the SearchController object literal
	SearchController.nodes = 0;
	SearchController.fh = 0;
	SearchController.fhf = 0;
	SearchController.start = $.now();
	SearchController.stop = BOOL.FALSE;
	
}


//Called to get a best move for the current position at the allocated depth / move time
function SearchPosition ()
{
	let bestMove = NOMOVE;
	let bestScore = -INFINITE;
	let line;
	let PvNum;		//number of moves in principal variation line
	
	ClearForSearch();
	
	//Iterative deepening framework
	for (let currentDepth = 1; currentDepth <= /*SearchController.depth*/ 5; currentDepth++)
	{
		bestScore = AlphaBeta(-INFINITE, INFINITE, currentDepth);
		
		if (SearchController.stop == BOOL.TRUE)
		{
			break;
		}
		
		bestMove = ProbePvTable();
		line = `D: ${currentDepth} Best ${PrMove(bestMove)} Score ${bestScore} Nodes ${SearchController.nodes}`;
		PvNum = GetPvLine(currentDepth);
		line += " Pv: ";
		
		for (let i = 0; i < PvNum; i++)
		{
			line += PrMove(GameBoard.PvArray[i]) + ' ';
		}
		
		console.log(line);
	}
	
	SearchController.best = bestMove;
	SearchController.thinking = BOOL.FALSE;
}



