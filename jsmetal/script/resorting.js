
// GLOBALBUBBLESORT

function resortNonOverlapping(alignment) {
		var START=new Date();
	
	var repeat;
	var temp;
	do{
		repeat = false;
		
		for (var j = 0; j < (alignment[0].content.length - 1); j++){
			
			if( areNonOverlapping( j,alignment) ){
				
				if( shouldBeFlipped( j,alignment) ){
					
					for(var i=0;i<G.sequenceNumber;i++){
						var newSeq= alignment[i].content.substr(0,j).concat(alignment[i].content[j+1]).concat(alignment[i].content[j]).concat(alignment[i].content.substr(j+2));
						alignment[i].content = newSeq;
						
						}
					repeat=true;
					
				}
			}
		}
	
	}while(repeat);
	var  END=new Date();
	
	return alignment;
}

// ARENONOVERLAPPING
// Tests if two columns are non-overlapping. We assume they are until
// we find a pair of non-gap characters.
function areNonOverlapping(j,aln){
	
	var nonOverlapping = true;
	
	for (var i =0; i<G.sequenceNumber;i++){
		
		//The moment we find a pair where neither character is gap, the columns are non-overlapping
		if( aln[i][j] != "-" && aln[i][j+1] != "-"){
			nonOverlapping = false;
			break;
		}
		
	}
	
	return nonOverlapping;
	
}

// SHOULDBEFLIPPED
// Tests if two *confirmed non-overlapping* columns should be flipped. Will do weird things
// if passed overlapping columns.
function shouldBeFlipped(j,aln){
	
	var flipThem = false;
	
	for(var i=0; i<G.sequenceNumber;i++){
		
		// Are both characters gaps? Let's continue
		if(aln[i][j] == "-" && aln[i][j+1]=="-"){
			continue;
		}
		// No? Then only one of them must be a gap (or something has gone horribly wrong).
		// If it's the one on the right, we must flip the columns. Whatever the case, we break the loop.
		else{
			flipThem = (aln[i][j+1]=="-")
			break;
		}		
	}
	return flipThem;
}


