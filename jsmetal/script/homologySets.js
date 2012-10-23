// GETHOMOLOGYSETS
var SSP = 0;
var SIM = 1;
var POS = 2;
var EVO = 3;
importScripts('newick_parser.js','sequence.js');
importScripts('http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.3.3/underscore-min.js');

onmessage = function(e){
        var o = JSON.parse(e.data);
        var newick_string = o.tree;

        var tree;
        var doEvo=0;
        var alnA = o.aln;

        try{
                if(newick_string){
                        root=parseNewickString(newick_string);
                        //check if names match those of the sequences
                        treeNames = [];
                        for(var i=0;i<root.length;i++){
                                treeNames.push(root[i].name);
                        }

                        treeNames.sort();
                        for(var i=0;i<alnA.length;i++){
                                if(treeNames[i] != alnA[i].name) {
                                        throw "Names differ in Newick tree and alignments";
                                }
                        }
                        if(treeNames[alnA.length] != undefined){
                                throw "There are more sequences in the Newick tree than in the alignments";
                        }

                        doEvo=1;
                        tree=makeTree(root);
                }
                getHomologySets(alnA,tree,doEvo,o.seqNum);
        }catch(e){
                if (e.message){

                        var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
                                .replace(/^\s+at\s+/gm, '')
                                .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
                                .split('\n');

                        postMessage(JSON.stringify({'type':'error','msg':e + '\n' + stack}));
                }else {
                        postMessage(JSON.stringify({'type':'error','msg':e}));
                }
                return;
        }

}

function getHomologySets(aln,tree,doEvo,seqNum){	
	
	var aln=resortNonOverlapping(aln,seqNum);
	labeller(aln,tree,doEvo,seqNum);
	var gapsHere=[];
	var homologySets = [];
		
	for(var hom=0;hom<=POS+doEvo;hom++){
		
		homologySets[hom]=[];
		for (var i=0;i<aln.length;i++){
			homologySets[hom][i]=[];
			jNoGap=0;
			
			for ( var j=0;j<aln[i].content.length;j++){
				
				if(aln[i].content[j]  != "-"){
					
					homologySets[hom][i][jNoGap]=[];
					for(var k=0;k<aln.length;k++){
						if(aln[k].content[j]  == "-"){
							gapsHere[jNoGap]=true;
						}
						
						if(k!=i && aln[k].content[j]){
							
							homologySets[hom][i][jNoGap].push(aln[k].labeledContent[hom][j]);
							
						}
					
					
					}
					jNoGap++;
				}
					
					
			}
		}
	}
		
	postMessage(JSON.stringify({'type':'success','ans':[homologySets,gapsHere],'doEvo':doEvo}));
}



// GLOBALBUBBLESORT

function resortNonOverlapping(alignment,seqNum) {
		var START=new Date();
	
	var repeat;
	var temp;
	do{
		repeat = false;
		
		for (var j = 0; j < (alignment[0].content.length - 1); j++){
			
			if( areNonOverlapping( j,alignment,seqNum) ){
				
				if( shouldBeFlipped( j,alignment,seqNum) ){
					
					for(var i=0;i<seqNum;i++){
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
function areNonOverlapping(j,aln,seqNum){
	
	var nonOverlapping = true;
	
	for (var i =0; i<seqNum;i++){
		
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
function shouldBeFlipped(j,aln,seqNum){
	
	var flipThem = false;
	
	for(var i=0; i<seqNum;i++){
		
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


