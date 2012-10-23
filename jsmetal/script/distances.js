// CONTENTS
// function getCharacterDistance(homSetsA, homSetsB)
// function getSequenceDistance(homSetsA,homSetsB)
// function getAlignmentDistance(homSetsA,homSetsB)
// function getSSPDistance(homSetsA,homSetsB)
// function getIntersection(setA, setB)
// function getUnion(setA, setB)
// function tempListMaker(setA,setB)

var SSP = 0;
var SIM = 1;
var POS = 2;
var EVO = 3;

// GETCHARACTERDISTANCE
onmessage = function(e){
        var dat = JSON.parse(e.data);
        var g = dat.G
        dist = getDistances(dat.A,dat.B,g.doEvo,dat.gapsHere,g);
        postMessage(JSON.stringify({"type":"success","distances":dist}));
}
function getDistances(homSetsA, homSetsB, doEvo, gapsHere,G){
	
	var setSize= G.sequenceNumber - 1;
	
	var distances = new Object();
	var charDist = [];
	var seqDist = [];
	var alnDist = [];
	
	
	var hom=POS+doEvo;
	var i=0;
	var j=0;
	var k=0;
	//Do related homology types backwards starting from POS or EVO (doEvo is a 1 or 0 flag)
	//This way, distances of zero can "drop through" from EVO to POS and SIM and we hopefully
	//save some processing time.
	//Note SSP is excluded.
	
	for(var hom=POS+doEvo; hom>SSP; hom--){
	var allChars = 0;
		charDist[hom]=[];
		seqDist[hom]=[];
		alnDist[hom]=0;
		
		for(var i=0;i<G.sequenceNumber;i++){
			
			charDist[hom][i] = [];
			seqDist[hom][i]=0;
			allChars += G.origLengths[i];			
			
			
			for(var j=0;j<homSetsA[hom][i].length;j++){
				//if there are gaps here we probably need to calculate the distance
				if(hom == POS+doEvo || gapsHere[j]){
					
					//initialise distance to zero...
					charDist[hom][i][j] = 0;
					//...and only bother increasing it if it wasn't zero in the previous homology type
					if(hom == POS+doEvo || charDist[hom+1][i][j] != 0){
						
						for(var k=0;k<setSize;k++){
							
							if(homSetsA[hom][i][j][k]!=homSetsB[hom][i][j][k]){
								charDist[hom][i][j]++;
							}
						}
						charDist[hom][i][j]/=setSize;
					}
				//if there are no gaps, this distance is the same as the previous distance	
				}else{
					
					charDist[hom][i][j]=charDist[hom+1][i][j];
				}
			
	
					seqDist[hom][i]+=charDist[hom][i][j];

			}
			
			
			seqDist[hom][i]/= G.origLengths[i];
			alnDist[hom]+=seqDist[hom][i]*G.origLengths[i];
			
                               var message = " metric " + (POS+doEvo-hom+1) + " / " + (POS+doEvo+1)
                               var message = message  + " :: sequence " + (i+1) + " / " + G.sequenceNumber 
                               postMessage(JSON.stringify({"type":"intermediate","msg":message}));
		}
		
		alnDist[hom]/=allChars;
		
	}
	
	

	
	//Do SSP distances
	var alnUnion = 0;
	var alnIntersection = 0;
	charDist[SSP]=[];
	seqDist[SSP]=[];
	
	for(var i=0;i<G.sequenceNumber;i++){
		charDist[SSP][i]=[];
		seqDist[SSP][i]=0;
		var seqUnion =0;
		var seqIntersection =0;
		for(var j=0;j<homSetsA[SSP][i].length;j++){
				var charUnion = getUnion(homSetsA[SSP][i][j],homSetsB[SSP][i][j]);
				var charIntersection = getIntersection(homSetsA[SSP][i][j],homSetsB[SSP][i][j]);
				
				seqUnion+=charUnion;
				seqIntersection += charIntersection;
				if (charUnion==0){
					//special case: 0/0=0 distance rather than NaN
					charDist[SSP][i][j] = 0.0;
				}else
				{
					charDist[SSP][i][j] = 1-(charIntersection/charUnion);
				}
				
		}
		
		alnUnion+=seqUnion;
		alnIntersection+=seqIntersection;
		
		seqDist[SSP][i]=1-(seqIntersection/seqUnion);
		
                var message = " metric " + (POS+doEvo+1) + " / " + (POS+doEvo+1)
                var message = message  + " :: sequence " + (i+1) + " / " + G.sequenceNumber 
                postMessage(JSON.stringify({"type":"intermediate","msg":message}));
	}
        postMessage(JSON.stringify({"type":"intermediate","msg":"Finishing distances"}));
	alnDist[SSP] = 1-(alnIntersection/alnUnion);

		
	distances.character=charDist;
	distances.sequence=seqDist;
	distances.alignment = alnDist;
		
	return distances;
	
}



//GETINTERSECTION - ignores gaps
function getIntersection(setA, setB){
	var intersection=0;
	for(var i=0;i<setA.length;i++){
		
		//if there is a gap, there cannot be an intersection
		if(setA[i] !="-" && setB[i] != "-")
		{
			if(setA[i] == setB[i]){intersection++;}
			
		}
	}
	return intersection;
}

//GET UNION - ignores gaps
function getUnion(setA, setB){
	var union = 0;
	for(var i=0;i<setA.length;i++){
		
		//if neither is a gap...
		if(setA[i] !="-" && setB[i] != "-")
		{	
			//...there is at least one new character for the union...
			union++;
			
			//...and two if they are different
			if(setA[i] != setB[i]){
				union++;
			}
			
			
		}
		//if there is at least one gap...
		else{
			//...but not two...
			if(setA[i] !="-" || setB[i] != "-"){
				//...add one to the union
				union++;
			}
		}
	}
	
	return union;
}
