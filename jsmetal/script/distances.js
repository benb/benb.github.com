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
                        if (c==0){
                                dist=0;//dSSP can produce empty homology sets - call this distance 0 by convention
                        }else {
                                dist/=c;
                        }
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
