//CHECKCONSISTENCY
// Checks the consistency of the two alignments provided and, if everything's fine, returns an array containing the
// number of sequences, the length of each original sequence (minus the gaps) and the original sequences themselves.

function checkConsistency(alignmentA,alignmentB){
	
	var sequenceNumber;
	
	var origSeqA = new Array();
	var origSeqB = new Array();
	var origSeqs = new Array();
	
	var origLengthA;
	var origLengthB;
	var origLengths = new Array();	
	
	
	//Unless names are to be ignored, 
	if( !G.ignoreNamesFlag ){
			for(var i =0; i<sequenceNumber;i++){
				if(alignmentA[i].name != alignmentB[i].name){
					throw "Sequence identifiers are not consistent between alignments. Fix this issue or use \"Ignore Names\" if you are certain the sequences are in the same order in both alignments";
			}
		}
	}
	
	
	//Check both alignments have the same number of sequences
	if( alignmentA.length != alignmentB.length){
			throw "Both alignments must contain the same number of sequences";
	}
	else {sequenceNumber = alignmentA.length;}
		
	//Check if sequences are consistent between alignments (check their length ignoring gaps)
	
	var suspects;
	for(var i =0; i<sequenceNumber;i++){
		origSeqA[i]=alignmentA[i].content.replace(/-/g,"");
		origSeqB[i]=alignmentB[i].content.replace(/-/g,"");
		
		origLengthA = origSeqA[i].length;
		origLengthB = origSeqB[i].length;
		
		if(origLengthA != origLengthB){
			if(G.ignoreNamesFlag){
				suspects= i+1;
			}
			else{
				
				suspects="\""+alignmentA[i].name+"\""
			}
			throw "Sequences "+suspects+ " in each alignment are not mutually consistent due to different lengths";
		
		}else{origLengths[i]=origLengthA;}
		
		/*if(origSeqA[i].toUpperCase() != origSeqB[i].toUpperCase()){
			for(var j=0; j<origLengths[i];j++){
				var charA = origSeqA[i][j].toUpperCase();
				var charB = origSeqB[i][j].toUpperCase();
				if(charA!=charB){ break; }
			}
			
			if(G.ignoreNamesFlag){
				suspects= i+1;
			}
			else{
				suspects="\""+alignmentA[i].name+"\""
			}
			throw "Sequences "+suspects+ " in each alignment are not mutually consistent. Character number "+j+" is "+charA+" in first alignment but "+charB+" in the second.";
		} else {*/
		origSeqs[i] = origSeqA[i];
		//}
	}
	
	return [sequenceNumber,origLengths,origSeqs];
}