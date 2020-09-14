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
		//return static eval
	}
	
	//Special cases: search exceeds depth 64, 50 move rule, repetitions
	//Check time up
	SearchController.nodes++;
	
	//Check rep fifty move rule
	
	if (GameBoard.ply > MAXDEPTH - 1)
	{
		//return static eval
	}
	
	let Score = -INFINITE;
	
	GenerateMoves();
	
	/*
	Get PV Move (because we want to search best moves first)
	Order PV Move (set high move ordering score)
	*/
	
	let Legal = 0;				//How many legal moves have we made?
	let OldAlpha = alpha;		//Check to see if new best move is found (and store in PV table)
	let BestMove = NOMOVE;
	let Move = NOMOVE;
	
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
			BestMove = move;
			//Update history table
		}
	}
	
	/*
	Mate check: 
	are we in check? then return +- inf
	else return 0
	*/
	
	if (alpha != OldAlpha)
	{
		//store PvMove
	}
	
	return alpha;
}

//Called to get a best move for the current position at the allocated depth / move time
function SearchPosition ()
{
	let bestMove = NOMOVE;
	let bestScore = -INFINITE;
	
	//Iterative deepening framework
	for (let currentDepth = 1; currentDepth <= SearchController.depth; currentDepth++)
	{
		//Call ALPHABETA
		
		if (SearchController.stop == BOOL.TRUE)
		{
			break;
		}
	}
	
	SearchController.best = bestMove;
	SearchController.thinking = BOOL.FALSE;
}






















