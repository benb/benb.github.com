//COLOUREDSEQUENCEMAKER
//Takes the character distance array, an alignment, and an ID for the alignment (basically "alnA" or "alnB").
//Returns a <div/> for each homology type, containing the sequences where each non-gap character
//belongs to a CSS class specifying its distance value between 0 and 255.

function sequenceMaker(alignment,alignmentID){
	
		
		$sequenceDiv = $("<div/>").attr("id",alignmentID+"_seqs").addClass("seqs");
		
		//array of jquery <div/>s for each sequence
		for(var i=0;i<G.sequenceNumber;i++){
	
			$colouredSeqDivs = $("<div/>").addClass("seq_"+i);
					
			//index for non-gap characters
			var k=0;
			
			for(var j = 0;j<alignment[i].content.length;j++){
				
				var $character = $("<span/>").text(alignment[i].content[j]).addClass(alignment[i].content[j]).addClass("clickable");
							
				//only non-gap characters have an identity
				if (alignment[i].content[j] != "-") {
					$character.attr("id",alignmentID+"_"+i+"_"+k);
					k++;
				}
				$colouredSeqDivs.append($character);
			}
		
			$sequenceDiv.append($colouredSeqDivs);
		}
	
		

	return $sequenceDiv;
}

function colouredCSSMaker(charDist,alignment,alignmentID){
	
	var $sequenceDiv = [];
	for(var homType = 0; homType<charDist.length;homType++){
		
		$sequenceDiv[homType] = [];
		
		var $colourF = [];
		//character distances converted to a value between 0 and 255, for use in CSS styling
		var eightBitDistances = [];
		for(var i=0;i<G.sequenceNumber;i++){
			eightBitDistances[i]=[];		
                        for(var k=0;k<charDist[homType][i].length;k++){
                                eightBitDistances[i][k] = Math.round(255*charDist[homType][i][k]);
                        }
		}
		
		//array of jquery <div/>s for each sequence
		for(var i=0;i<G.sequenceNumber;i++){
	
			$colourF[i] = [];
					
			//index for non-gap characters
			var k=0;
			
			for(var j = 0;j<alignment[i].content.length;j++){
                                        if (alignment[i].content[j] != "-"){
                                                $character = [ eightBitDistances[i][k], Math.round(charDist[homType][i][k]*1000000)/1000000];
                                                k++;
                                        }else {
                                                $character=null;
                                        }
				$colourF[i].push($character);
			}
		
			$sequenceDiv[homType].push($colourF[i]);
		}
	
		
	}

	return $sequenceDiv;
}
function applyCSS(alignment,cssData){
        var i=0; 
        _.each($(alignment).children("div"),function(x){
                var j=0;
                _.each($(x).contents(".clickable"),function(y){
                        if (cssData[i][j]){
                                var target = $(y);
                                //remove old dist classes
                                _.chain(target.attr("class").split(' ')).filter(function(x){return (x.substring(0,4)=="dist")}).each(function(x){ target.removeClass(x)});
                                target.addClass("dist"+cssData[i][j][0]);
                                target.attr("title",cssData[i][j][1]);
                        }
                        j++;
                });
                i++;
        });
        return alignment;
}

function colouredSequenceMaker(charDist,alignment,alignmentID){
	
        var aln = sequenceMaker(alignment,alignmentID);
        var colourFs = colouredCSSMaker(charDist,alignment,alignmentID);
        //var colourFs = [1,2,3,4]; 
        return [aln,colourFs];

}



function makeVisualiser($alnASequences,$alnBSequences,alnA,alnB){
	
	//the whole visualiser <div/>
	var $visualiserDiv = $("<div/>").attr("id","visualiser");
	
	//containers for alnA and alnB names
	var $alnA_NamesDiv = $("<div/>").attr("id","alnA_names").addClass("names");
	var $alnB_NamesDiv = $("<div/>").attr("id","alnB_names").addClass("names");
	
	for(i=0;i< G.sequenceNumber;i++){
		//populate name
                if (i%2==0){
                        $alnA_NamesDiv.append("<div class='name0'>"+alnA[i].name+"</div>");
                        $alnB_NamesDiv.append("<div class='name0'>"+alnB[i].name+"</div>");
                }else {
                        $alnA_NamesDiv.append("<div class='name1'>"+alnA[i].name+"</div>");
                        $alnB_NamesDiv.append("<div class='name1'>"+alnB[i].name+"</div>");
                }
	}
	
	$alnA_NamesDiv.append($("<div>&nbsp;</div>").css("height", scrollbarWidth()));
	$alnB_NamesDiv.append($("<div>&nbsp;</div>").css("height", scrollbarWidth()));
	
	//scrollGroup <div/>s serve to allow syncronized vertical scrolling
	var $alnA_scrollGroup=$("<div/>").append($alnA_NamesDiv,$alnASequences).attr("id","alnA_scroll");
	var $alnB_scrollGroup=$("<div/>").append($alnB_NamesDiv,$alnBSequences).attr("id","alnB_scroll");
        var $between=$("<span />").attr("id","alnA_sparkline").css("height","40px").css("width",$alnASequences.width()).css("float","right");
        $between = $("<div />").css("width","100%").css("overflow","hidden").css("display","block").append($between);

        var $end=$("<span />").attr("id","alnB_sparkline").css("height","40px").css("width",$alnASequences.width()).css("float","right");
        $end = $("<div />").css("width","100%").css("overflow","hidden").css("display","block").append($end);
	
	$visualiserDiv.append($alnA_scrollGroup,$between,$alnB_scrollGroup,$end);
	
	return $visualiserDiv;
	
}
/*
function makeOutput(distances,homType,alnA){
	var $outputDiv=$("<div/>").attr("id","output");
	
	if(G.visualize){
		var $charDistP=$("<p/>").append("Distance for focused character :");
		var $charDistValue=$("<span/>").attr("id","charDist").css("font-weight","bold");
		$charDistP.append($charDistValue);
		$outputDiv.append($charDistP);
	}
	
	var $alnDistP=$("<p/>").append("Alignment distance: ");
	var roundedAlnDistance=Math.round((distances.alignment[homType]*1000000))/1000000;
	var $alnDistValue=$("<span/>").attr("id","alnDist").text(roundedAlnDistance);
	$alnDistP.append($alnDistValue);
	for(var i=0;i<G.sequenceNumber;i++){
		var roundedSeqDistance=Math.round((distances.sequence[homType][i]*1000000))/1000000;
		var $seqDistP = $("<p/>").append("Distance for sequence "+alnA[i].name+": ");
		var $seqDistValue=$("<span/>").attr("id",alnA[i].name+"_dist").text(roundedSeqDistance);
		$seqDistP.append($seqDistValue);
		$outputDiv.append($seqDistP);
	}
	$outputDiv.append($alnDistP);
	return $outputDiv;
}*/
////////////////////////////////////
function makeOutput(distances,homType,alnA){
	var $outputTable1=$("<table/>").attr("id","output");
	var $outputTable2=$("<table/>").attr("id","output");

	var roundedAlnDistance=Math.round((distances.alignment[homType]*1000000))/1000000;
	
	if(G.visualize){
                var $charDistTR=$("<tr />");
		$charDistTR.append($("<td />").append("Alignment distance:"));
                $charDistTR.append($("<td />").attr("id","alnDist").text(roundedAlnDistance));

		$charDistTR.append($("<td />").append("Distance for focused character:"));
                $charDistTR.append($("<td />").attr("id","charDist").css("font-weight","bold"));

		$outputTable1.append($charDistTR);
	}
	
	var $alnDistTR=$("<tr/>");

        var $alnDistValue=$("<td />").attr("id","alnDist").text(roundedAlnDistance);
        var $alnDistText=$("<td />").append("Alignment distance");
	$alnDistTR.append($alnDistText);
	$alnDistTR.append($alnDistValue);

	for(var i=0;i<G.sequenceNumber;i++){
		var roundedSeqDistance=Math.round((distances.sequence[homType][i]*1000000))/1000000;
		var $seqDistTR=$("<tr/>");
		var $seqDistText = $("<td/>").append("Distance for sequence "+alnA[i].name);
		var $seqDistValue=$("<td/>").attr("id",alnA[i].name+"_dist").text(roundedSeqDistance);
		$seqDistTR.append($seqDistText);
		$seqDistTR.append($seqDistValue);
		$outputTable2.append($seqDistTR);
	}
	$outputTable2.append($alnDistTR);
	return [$outputTable1,$outputTable2];
}
////////////////////////////////////



function makeCharDist(distances,homType,alnA){
	var $charDistDiv=$("<div/>").attr("id","chardists");
	var $charDistParagraphs = [];
	for(var i=0;i<G.sequenceNumber;i++){
		var charDistString=[];
		charDistString.push(alnA[i].name);
		for(var j = 0;j<G.origLengths[i];j++){
			charDistString.push(distances.character[homType][i][j]);
		}
		$charDistParagraphs[i]=$("<p/>").attr("id","chardists_"+alnA[i].name).html(charDistString.toString());
		$charDistDiv.append($charDistParagraphs[i]);
	}
	return $charDistDiv;
}
function makeRawCharDist(distances,homType,alnA){
	var $charDist=[];
	for(var i=0;i<G.sequenceNumber;i++){
		var charDistString=[];
		charDistString.push(alnA[i].name);
		for(var j = 0;j<G.origLengths[i];j++){
			charDistString.push(distances.character[homType][i][j]);
		}
		$charDist.push(charDistString);
	}
	return $charDist;
}
function makeRawColumnDist(distances,homType,alnA){
        var $colDist=[];
        for (var i=0; i < alnA[0].content.length; i++){
                $colDist[i]=0.0;
        }
        for (var j=0; j < alnA.length; j++){
                var id=0;
                var seq=alnA[j].content
                for (var i=0; i < seq.length; i++){
                        if (seq[i]!="-"){
                                $colDist[i]+=distances.character[homType][j][id]/alnA.length;
                                id++;
                        }
                }
        }

        
        return $colDist;
}
function makeVisualColumnDist(distance,homType,alnA,alnAView,target,width){
        var colDist = makeRawColumnDist(distance,homType,alnA);
        applyColumnDist(colDist,alnAView,target,width);
}
function applyColumnDist(colDist,alnAView,target,width,clickReceiver){
        var left = alnAView.scrollLeft();
        var totalWidth = alnAView[0].scrollWidth;
        var visibleWidth = alnAView.width();
        totalChars = colDist.length + padChars*2;
        var fractionStart = Math.floor(((left/totalWidth)*totalChars));
        fractionStart=fractionStart-padChars;
        if (fractionStart<0){fractionStart=0};
        var fractionEnd = Math.floor(((left+visibleWidth)/totalWidth * totalChars));
        fractionEnd=fractionEnd-padChars;
        if (fractionEnd>colDist){fractionEnd=colDist};
        var map=[];
        for (var i=0; i < fractionStart; i++){
                map.push("blue");
        }
        for (var i=fractionStart; i<fractionEnd; i++){
                map.push("red");
        }
        for (var i=fractionEnd; i<colDist.length; i++){
                map.push("blue");
        }
        target.css("width",width+"px");
        barWidth=(width / colDist.length) - 2;
        //console.log(barWidth);
        target.sparkline(colDist,{type:'bar',height:"30px",chartRangeMax:1.0,barWidth:barWidth,barSpacing:2,colorMap:map});
}


	
$(window).resize(function() {
	//google chrome gets tired and emotional if we don't tell it to calculate divWidth here
	divWidth= $("#alnA_Seqs").width();
});




function getPositions(alignment){
	
	var positionOf = [];
	var characterAt = []
	
	
	for(var i=0;i<G.sequenceNumber;i++){
		positionOf[i]=[];
		
		characterAt[i]=[];
		
		var k=0;
		for(var j=0;j<alignment[i].content.length;j++){
			characterAt[i][j]=k;
			positionOf[i][k]=j;
			if (alignment[i].content[j] != "-") {
				k++;
			}
	
		}
	}
	return [positionOf,characterAt];
}


function scanCentralChar(start){
	startingPoint=Math.round(start);
	//divCentre = startingPoint; //GLOBALISE
	// IMPORTANT TODO: reshuffle variables to make it easy to get proper seqIndex!!!
	while(characterAt[0][0][startingPoint] == undefined){
		startingPoint--;
	}
	return  characterAt[0][0][startingPoint]; 
}

function charPadding(num) {
	str="<span class=\"padding\">&nbsp;</span>";
	if (!num) return "";
	var	orig = str,
		soFar = [str],
		added = 1,
		left, i;
	while (added < num) {
		left = num - added;
		str = orig;
		for (i = 2; i < left; i *= 2) {
			str += str;
		}
		soFar.push(str);
		added += (i / 2);
	}
	var $paddingSpan = soFar.join("");
	return $paddingSpan;
}

function transparentAminoCSS(charDist,type){
	$(".clickable").css("background-color","");
	var transparentCSS=[];
	for(var i=0;i<G.sequenceNumber;i++){
		transparentCSS[i]=[];
		for(var k=0;k<G.origLengths[i];k++){
			if(type==1){
				opacity=charDist[i][k];				
			}else if(type==2){
				opacity=1;
			}else{
				opacity=1-charDist[i][k];
			}
			transparentCSS[i].push($("#alnA_"+i+"_"+k).css("background-color").replace("rgb","rgba").replace(")",", "+opacity+")"));
			}
		}
	
	return transparentCSS;
}



function 	changeDistanceVisualization(newCSS){
	if(!newCSS){
		$(".clickable").css("background-color","");		
	}else{
			for(var i=0;i<G.sequenceNumber;i++){
				for(var k=0;k<G.origLengths[i];k++){
					$("#alnA_"+i+"_"+k).css("background-color",newCSS[i][k]);
					$("#alnB_"+i+"_"+k).css("background-color",newCSS[i][k]);
				}
			}
		}
	}
				
			

function getCharWidth(){
	//get font width in boxes:
	var width;
	var o = $("<div/>").addClass("seqs")
	o.append($("<span id='widthTest'>A</span>"));
	o.appendTo($("body"));
	width = parseInt($("#widthTest").css("padding-left")) + parseInt($("#widthTest").css("padding-right")) + $("#widthTest").width(); 	
	o.remove();
	return width-1;
}

function scrollbarWidth() {
    var $inner = jQuery('<div style="width: 100%; height:200px;">test</div>'),
        $outer = jQuery('<div style="width:200px;height:150px; position: absolute; top: 0; left: 0; visibility: hidden; overflow:hidden;"></div>').append($inner),
        inner = $inner[0],
        outer = $outer[0];
 
    jQuery('body').append(outer);
    var width1 = inner.offsetWidth;
    $outer.css('overflow', 'scroll');
    var width2 = outer.clientWidth;
    $outer.remove();
 
    return (width1 - width2);
}
