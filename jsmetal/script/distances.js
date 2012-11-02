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

function dssp(dist,c,l,r){
        if (l==r && l>0){
                //match
                return [dist,c+1];
        }
        if (l>0 && r>0){//neither gaps and different
                return [dist+2,c+2];
        }else if (l>0 || r>0){// one is gap
                return [dist+1,c+1];
        }else {
                return [dist,c];
        }
}
function dseq(dist,c,l,r){
        if (l<0){l=0}
        if (r<0){r=0}
        return dgen(dist,c,l,r);
}
function dgen(dist,c,l,r){
        if (l!=r){
                return[dist+1,c+1];
        }else {
                return[dist,c+1];
        }
}
var dpos=dgen;
var devol=dgen;

function quickDistNew(alnA,alnB,hom){
        console.log("quickDistNew " + hom);
        var dists=[];
        var seqDists=[];
        var totalLen=0;
        var alnDist=0;
        var distF;
        var myhom=2;
        switch(hom){
                case 0: 
                  distF=dssp;
                  break;
                case 1:
                  distF=dseq;
                  break;
                case 2:
                  distF=dpos;
                  break;
                case 3:
                  distF=devol;
                  myhom=3;
                  break;
        }
                        
        for (var i=0; i < alnA.length; i++){
                dists[i]=[];
                seqDists[i]=0.0;
                var p1=0;
                var p2=0;

                var alnLen=0;
                while (p1<alnA[i].content.length && p2<alnB[i].content.length){
                        //fast forward to non-gaps
                        if(alnA[i].content[p1]=="-"){
                                p1++;
                                continue;
                        }
                        if(alnB[i].content[p2]=="-"){
                                p2++;
                                continue;
                        }
                        var dist=0.0;
                        var c=0;
                        for (var k=0; k < alnA.length; k++){
                                if (k==i){continue;}
                                var ans = distF(dist,c,alnA[k].labeledContent[myhom][p1],alnB[k].labeledContent[myhom][p2]);
                                dist=ans[0];
                                c=ans[1];
                        }
                        seqDists[i]+=dist;
                        alnDist+=dist;
                        dist/=c;
                        dists[i].push(dist);
                        alnLen+=c;
                        p1++;
                        p2++;
                }
                totalLen+=alnLen;
                seqDists[i]/=alnLen;
        }
        var ans = {};
        ans.character=dists;
        ans.alignment=alnDist/totalLen;
        ans.sequence=seqDists;
        return ans;
}
function quickDistOther(homSetsA, homSetsB,label){
        var different = function(a1,a2){
                return (a1!=a2);
                if (a1.length!=a2.length){
                        return true;
                }
                for (var i=0; i < a1.length; i++){
                        if (a1[i]!=a2[i]){
                                return true;
                        }
                }
                return false;
        }
        console.log("HOMOLOGY " + label);
        character=[];
        sequence=[];
        alignment=0;
        totLength=0;
        var inc=1.0/homSetsA[0][0].length
        for (var i=0; i < G.sequenceNumber; i++){ //each sequence
                character[i]=[];
                sequence[i]=0;
                for(var j=0;j<homSetsA[i].length;j++){
                        character[i][j]=0;
                        var a = homSetsA[i][j];
                        var b = homSetsB[i][j];
                        for (k=0; k < a.length; k++){
                                if (different(a[k],b[k])){
                                        character[i][j]+=inc
                                }
                        }
                        sequence[i]+=character[i][j];
                        
                }
                alignment+=sequence[i];
                sequence[i]/=character[i].length;
                totLength+=character[i].length;
        }
        alignment/=totLength;
        var ans = {};
        ans.character = character;
        ans.sequence = sequence;
        console.log(ans.sequence);
        ans.alignment = alignment;
        return ans;
}

function calcDistances(alnA,alnB){
        console.log("calcDistances");
        var fn=[];
        console.log("HUH");
        console.log(alnA);
        console.log(alnA[0].labeledContent);
        console.log(alnA[0].labeledContent.length);
        var len = alnA[0].labeledContent.length;
        console.log(len);
        fn.push(_.memoize(
                        function() { return quickDistNew(alnA,alnB,0); }
                        )
        );
        for (var i=1; i < len; i++){
                var f = _.bind(quickDistNew,{},alnA,alnB,i);
                fn.push(_.memoize(f));
        }
        return fn;

}

function getDistances(homSetsA,homSetsB,doEvo,gapsHere,G){
        var distance=new Object();
        distance.character = [];
        distance.sequence = [];
        distance.alignment = [];
        for (var i=1; i < 3+doEvo;i++){
                var ans = quickDistOther(homSetsA[i],homSetsB[i]);
                distance.character.push(ans.charDist);
                distance.sequence.push(ans.seqDist);
                distance.alignment.push(ans.alnDist);
        }
        //dummy
        distance.character.unshift(distance.character[0]);
        distance.sequence.unshift(distance.sequence[0]);
        distance.alignment.unshift(distance.alignment[0]);
        return distance;
}

function getDistancesX(homSetsA, homSetsB, doEvo, gapsHere,G){
	
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
                               try{
                                       postMessage(JSON.stringify({"type":"intermediate","msg":message}));
                               }catch(e){
                               }
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
                try{
                        postMessage(JSON.stringify({"type":"intermediate","msg":message}));
                }catch(e){
                }
	}
        try{
                postMessage(JSON.stringify({"type":"intermediate","msg":"Finishing distances"}));
        }catch(e){
        }
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
