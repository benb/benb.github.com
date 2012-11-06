//COLOUREDSEQUENCEMAKER
//Takes the character distance array, an alignment, and an ID for the alignment (basically "alnA" or "alnB").
//Returns a <div/> for each homology type, containing the sequences where each non-gap character
//belongs to a CSS class specifying its distance value between 0 and 255.

function sequenceMaker(alignment,alignmentID){
	

        var padding = charPadding(padChars);                                                                                                     
		$sequenceDiv = $("<div/>").attr("id",alignmentID+"_seqs").addClass("seqs");
		
		//array of jquery <div/>s for each sequence
		for(var i=0;i<G.sequenceNumber;i++){
	
			$colouredSeqDivs = $("<div/>").addClass("seq_"+i).append(padding);
					
			//index for non-gap characters
			var k=0;
			
			for(var j = 0;j<alignment[i].content.length;j++){
				
				var $character = $("<span/>").text(alignment[i].content[j]).addClass(alignment[i].content[j].toUpperCase()).addClass("clickable");
							
				//only non-gap characters have an identity
				if (alignment[i].content[j] != "-") {
					$character.attr("id",alignmentID+"_"+i+"_"+k);
					k++;
				}
				$colouredSeqDivs.append($character);
			}
		
			$sequenceDiv.append($colouredSeqDivs.append(padding));
		}
	
		

	return $sequenceDiv;
}

function colouredCSSMaker(charDist,alignment,alignmentID){
	var $sequenceDiv = [];
		
		var $sDiv = [];
		
		var $colourF = [];
		//character distances converted to a value between 0 and 255, for use in CSS styling
		//array of jquery <div/>s for each sequence
		for(var i=0;i<G.sequenceNumber;i++){
	
			$colourF[i] = [];
					
			//index for non-gap characters
			var k=0;
			
			for(var j = 0;j<alignment[i].content.length;j++){
                                        if (alignment[i].content[j] != "-"){
                                                $character = [ Math.round(255*charDist[i][k]), Math.round(charDist[i][k]*1000000)/1000000];
                                                k++;
                                        }else {
                                                $character=null;
                                        }
				$colourF[i].push($character);
			}
		
			$sDiv.push($colourF[i]);
		}
                return $sDiv;
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

function makeVisualiser($alnASequences,$alnBSequences,alnA,alnB){
	
	//the whole visualiser <div/>
	var $visualiserDiv = $("<div/>").attr("id","visualiser");
	
	//containers for alnA and alnB names
	var $alnA_NamesDiv = $("<div/>").attr("id","alnA_names").addClass("names");
	var $alnB_NamesDiv = $("<div/>").attr("id","alnB_names").addClass("names");
	
	for(i=0;i< G.sequenceNumber;i++){
		//populate name
                if (i%2==0){
                        $alnA_NamesDiv.append("<div class='row0'><div class='name' title='"+alnA[i].name+"'>"+alnA[i].name+ "</div><div class='miniline' id='miniline_"+i+ "'></div></div>");
                        $alnB_NamesDiv.append("<div class='row0'><div class='name' title='"+alnB[i].name+"'>"+alnB[i].name+ "</div><div class='miniline' id='miniline_"+i+ "'></div></div>");
                }else {
                        $alnA_NamesDiv.append("<div class='row1'><div class='name' title='"+alnA[i].name+"'>"+alnA[i].name+ "</div><div class='miniline' id='miniline_"+i+ "'></div></div>");
                        $alnB_NamesDiv.append("<div class='row1'><div class='name' title='"+alnB[i].name+"'>"+alnB[i].name+ "</div><div class='miniline' id='miniline_"+i+ "'></div></div>");
                }
	}

	
	$alnA_NamesDiv.append($("<div>&nbsp;</div>").css("height", scrollbarWidth()));
	$alnB_NamesDiv.append($("<div>&nbsp;</div>").css("height", scrollbarWidth()));
     //   $alnADistPlot=$("<div class='aln_y'/>").attr("id","alnA_Y");
     //   $alnBDistPlot=$("<div class='aln_y'/>").attr("id","alnB_Y");
	
	//scrollGroup <div/>s serve to allow syncronized vertical scrolling
        /*
	var $alnA_scrollGroup=$("<div/>").append($alnA_NamesDiv,$alnADistPlot,$alnASequences).attr("id","alnA_scroll").addClass("scrollbox");
	var $alnB_scrollGroup=$("<div/>").append($alnB_NamesDiv,$alnBDistPlot,$alnBSequences).attr("id","alnB_scroll").addClass("scrollbox");
        */
	var $alnA_scrollGroup=$("<div/>").append($alnA_NamesDiv,$alnASequences).attr("id","alnA_scroll").addClass("scrollbox");
	var $alnB_scrollGroup=$("<div/>").append($alnB_NamesDiv,$alnBSequences).attr("id","alnB_scroll").addClass("scrollbox");
        var $between1=$("<button class='k-button' id='distanceToggle' />");
        $between1.css("height","30px").css("font-size","14px").css("margin-top","7px").css("float","left");
        var $between2=$("<span />").attr("id","alnA_sparkline").css("height","40px").css("width",$alnASequences.width()).css("float","right").css("padding-top","5px");
        var $between = $("<div />").css("width","100%").css("overflow","hidden").css("display","block").append($between1).append($between2);

        $between1.html("distance");

        var $end=$("<span />").attr("id","alnB_sparkline").css("height","40px").css("width",$alnASequences.width()).css("float","right").css("padding-top","5px");
        $end = $("<div />").css("width","100%").css("overflow","hidden").css("display","block").append($end);
	
	$visualiserDiv.append($alnA_scrollGroup,$between,$alnB_scrollGroup,$end);
	
	return $visualiserDiv;
	
}
function makeOutput(distances,homType,alnA){
	var $outputTable1=$("<div/>").attr("id","output");
	var $outputTable2=$("<table/>").attr("id","output");

	var roundedAlnDistance=Math.round((distances.alignment[homType]*1000000))/1000000;
	
	if(G.visualize){
                var $charDistTR=$("<table/>").css("display","inline").css("float","left").append($("<tr />"));
		$charDistTR.append($("<td />").append("Total alignment distance:"));
                $charDistTR.append($("<td />").attr("id","alnDist").css("width","8em").css("font-weight","bold").text(roundedAlnDistance));
		$outputTable1.append($charDistTR);

                var $charDistTR=$("<table/>").css("display","inline").css("float","right").append($("<tr />"));
		$charDistTR.append($("<td />").append("Focused character distance:"));
                $charDistTR.append($("<td />").attr("id","charDist").css("font-weight","bold").css("width","5em"));
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
function visibleRange(alnAView,columns,rows){

        var left = alnAView.scrollLeft();
        var totalWidth = alnAView[0].scrollWidth;
        var visibleWidth = alnAView.width();
        var totalChars = columns + padChars *2;
        var fractionStart = Math.floor(((left/totalWidth)*totalChars));
        fractionStart=fractionStart-padChars;
        var fractionEnd = Math.floor(((left+visibleWidth)/totalWidth * totalChars));
        fractionEnd=fractionEnd-padChars;
        if (fractionEnd>columns){fractionEnd=columns};
        if (fractionStart<0){fractionStart=0};

        if(rows){
        var topS = alnAView.scrollTop();
        var totalHeight = alnAView[0].scrollHeight;
        var visibleHeight = alnAView.height();
        var fractionTop=Math.floor((topS/totalHeight)*rows);
        var fractionBottom = Math.floor((topS+visibleHeight)/totalHeight*rows);


        return [fractionStart,Math.floor((fractionStart+fractionEnd)/2),fractionEnd,
                fractionTop,Math.floor((fractionTop+fractionBottom)/2),fractionBottom ];
        }else {
                return [fractionStart,Math.floor((fractionStart+fractionEnd)/2),fractionEnd];
        }
}
function applyColumnDist(colDist,density,alnAView,target,width,invert){
        var range = visibleRange(alnAView,colDist.length)
        var fractionStart=range[0];
        var fractionEnd=range[2];
        var normal=[];
        var highlight=[];

        var normalD=[];
        var highD=[];
        for (var i=0; i < fractionStart; i++){
                normal.push(colDist[i]);
                highlight.push(null);
                normalD.push(density[i]);
                highD.push(null);
        }
                normal.push(colDist[fractionStart]);
                highlight.push(colDist[fractionStart]);
                normalD.push(density[fractionStart]);
                highD.push(density[fractionStart]);
        for (var i=fractionStart+1; i<fractionEnd-1; i++){
                highlight.push(colDist[i]);
                normal.push(null);
                highD.push(density[i]);
                normalD.push(null);
        }
                normal.push(colDist[fractionEnd-1]);
                highlight.push(colDist[fractionEnd-1]);
                highD.push(density[fractionEnd-1]);
                normalD.push(density[fractionEnd-1]);

        for (var i=fractionEnd; i<colDist.length; i++){
                normal.push(colDist[i]);
                highlight.push(null);
                normalD.push(density[i]);
                highD.push(null);
        }
        target.css("width",width+"px");
        barWidth=Math.max((width / colDist.length),1);
        console.log("INVERT? " + invert);
        if (invert){
                for (var i=0; i < colDist.length; i++){
                        if (normal[i]!=null){normal[i]=density[i]-normal[i];}
                        if (highlight[i]!=null){highlight[i]=density[i]-highlight[i];}
                }
        }
        target.sparkline(normalD,{width:width,chartRangeMax:1.0,chartRangeMin:0.0,height:"30px",lineColor: '#444444',fillColor:'#444444',disableTooltips:true,disableHighlight:true,spotColor:false,minSpotColor:false,maxSpotColor:false});
        target.sparkline(highD,{composite:true,width:width,chartRangeMax:1.0,chartRangeMin:0.0,height:"30px",lineColor: 'black',fillColor:'black',disableTooltips:true,disableHighlight:true,spotColor:false,minSpotColor:false,maxSpotColor:false});
        target.sparkline(normal,{composite:true,chartRangeMax:1.0,chartRangeMin:0.0,height:"30px",chartRangeMax:1.0,width:width,fillColor:'#6c8be9',lineColor:false,disableTooltips:true,disableHighlight:true,spotColor:false,minSpotColor:false,maxSpotColor:false});
        target.sparkline(highlight,{width:width,chartRangeMax:1.0,chartRangeMin:0.0,height:"30px",composite:true,lineColor: false, fillColor:'blue',disableTooltips:true,disableHighlight:true,spotColor:false,minSpotColor:false,maxSpotColor:false});
}


	
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

function 	changeDistanceVisualization(newCSS){
	if(!newCSS){
                for(var i=0;i<G.sequenceNumber;i++){
                        for(var k=0;k<G.origLengths[i];k++){
                                $("#alnA_"+i+"_"+k).css("background-color","");
                        }
                }
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
