// CONTENTS:
// function sequence(name,content)
// function parser(alignment) 
// function labeller(alignment,methodFlag)
// function nameSorter(a,b)


// SEQUENCE
//Constructor for sequence objects.

function sequence(name,content){
	this.name=name;
	this.content=content;
}


var nextNodeID=0;
var nodeIDs={}
function nodeID(s){
        return s.toString() + "---";
}

// PARSER
// Takes a FASTA formatted alignment and returns an array of "sequence" objects. 
// Each alignment arrives as a single string, which is 'regexed' into identifier lines  (^>.+)
// and sequences (^[^>]+) separated by a non-captured newline (?:\n).
// TODO: replace \w-\n with a proper selectable alphabet for each kind of sequence.

function parser(alignmentString,alnName) {

	//return array, name of each sequence (identifier) and content (actual sequence)
	var parsedSequences = new Array(); 
	var name;
	var content;
	
	var seqparser = new RegExp("(^>.+)(?:\n)(^[^>]+)","mg");
	G.sequenceType = "nucleotide";
	var invalidCharacters = new RegExp("[^ABCDEFGHIKLMNOPQRSTUVWYZXabcdefghiklmnopqrstuvwyzx*-]");
	var peptideOnlyCharacters = new RegExp("[EFILOPQZefilopqz*]");
										
	
	//to check all sequences are the same length 
	var sequenceLength;  
	
	var i=0;
	//fills the names and content arrays removing unnecesary symbols (> and \n)
	while((parsing = seqparser.exec(alignmentString))){

		name = parsing[1].trim().replace(/^>/,"").replace(/\s/g,"_");
		content = parsing[2].trim().replace(/\n/g,"");
				
		var badChar = content.search(invalidCharacters);
		if(badChar != -1){
			throw "Invalid character in sequence "+name+": \""+content[badChar]+"\"";
		}
		
		var isPeptide= content.search(peptideOnlyCharacters);
		if(isPeptide != -1){
			G.sequenceType="amino acid";
		}
		
		parsedSequences[i] = new sequence(name,content);
		
		if(sequenceLength && sequenceLength != parsedSequences[i].content.length){
			throw "Sequences of differing lengths in "+alnName;
		}
		
		sequenceLength = parsedSequences[i].content.length;
		i++;
	}
	return parsedSequences;
}

// LABELLER
// Label characters and gaps depending on flag value. Characters are indexed consecutively,
// while gaps are indexed according to the last indexed character. The first non-gap character 
// in a sequence is indexed as "1" if the first character is a gap it's indexed as "0".
// Labelling format is "iXindex", where i is the sequence number and X is the character or gap.

function labeller(alignment,tree,doEvo,seqNum){	
	var index;
	var gapsHere=[];
	for(var i =0; i<seqNum;i++){
		alignment[i].labeledContent=[];
	}
	
	if(doEvo){
		evoLabeller(alignment,tree,seqNum);
	
	}
	
	for(var i =0; i<seqNum;i++){
		alignment[i].labeledContent[SSP] = [];
		alignment[i].labeledContent[SIM] = [];
		alignment[i].labeledContent[POS] = [];
		
		
		index=0;
			
		
                var nextLabel=0;
                var offset=10000;
		for(var j=0;j<alignment[i].content.length;j++){
			
			if(alignment[i].content[j] != "-"){
				// Label character and increase index. Using pre-increment on index to start at 1 and thus allow gaps
				// that appear before any character to be labelled as 0.
				nextLabel = ++index;
				
				alignment[i].labeledContent[POS].push(nextLabel);
				
				if(doEvo){
				
					alignment[i].labeledContent[EVO][j]=nextLabel;
				}
				
				
			
			}
		
			else{
				//gapsHere[j]=true;
				// Do not label gaps
				// Label gaps by sequence
				// Label gaps by position
				alignment[i].labeledContent[POS].push(-nextLabel);
				// Add position information to evo-labelled gaps.
				if(doEvo){
					alignment[i].labeledContent[EVO][j]=-(alignment[i].labeledContent[EVO][j] * offset + nextLabel) ;
                                }
				
			}
		}
	}
}
function nameLookup(alignment,seqNum){
	names=new Object();
	for(var i =0;i<seqNum;i++){
		names[alignment[i].name]=i;
		
	}
	return names;
}

function evoLabeller(alignment,tree,seqNum){

        var names = nameLookup(alignment,seqNum);
	
	for(var i=0;i<seqNum;i++){
	
		alignment[i].labeledContent[EVO]=[];

	}
	
	for(var j=0;j<alignment[0].content.length;j++){
		gapMemory = [];
		
		for(var i=0;i<seqNum;i++){
			
			if(alignment[i].content[j] == "-"){
				gapMemory.push(alignment[i].name);
				
			}
			
		}

		
		if(gapMemory.length>0){
			splits=tree.splitsFor(gapMemory);
			for(var k=0;k<gapMemory.length;k++){
				alignment[names[gapMemory[k]]].labeledContent[EVO][j]=splits[gapMemory[k]];
			}
					
		}
		
	}
}

function nameSorter(a,b){
	if (a.name == undefined && b.name != undefined){return 1;}
	if (b.name == undefined && a.name != undefined){return -1;}
	if (a.name < b.name) {return -1;}
	if (a.name > b.name) {return 1;}
	return 0;
}
