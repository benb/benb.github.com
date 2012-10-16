// GETHOMOLOGYSETS
function getHomologySets(aln,tree,doEvo){	
	
	var aln=resortNonOverlapping(aln);
	labeller(aln,tree,doEvo);
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
		
	return [homologySets,gapsHere];
}


