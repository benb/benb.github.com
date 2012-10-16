//CONSTANTS - to use arrays instead of objects

var SSP = 0;
var SIM = 1;
var POS = 2;
var EVO = 3;


//Global object (container for a few general features and options that should be easily available)
var G = {};

	
function process() {
	START = new Date();
	//hide error box if it was present
	$("#errorBox").css("display","none");
	
	G.doEvo = 0;
	var tree = null;
	
	
	
	try{
		//parse and check syntax of alignments
		alnA = parser( $("#alignment1").val(),"alignment 1" );
		alnB = parser( $("#alignment2").val(),"alignment 2" );
		//switch character colouring to appropriate scheme
		$("#seqColour").attr('href','./'+G.sequenceType+'.css');
		
		alnA.sort(nameSorter);
		alnB.sort(nameSorter);
		
		//Check the mutual consistency of both alignments and gather a few global characteristics
		var seqDetails = checkConsistency(alnA,alnB);
		
		G.sequenceNumber = seqDetails[0];
		G.origLengths = seqDetails[1];
		//G.origSeqs = seqDetails[2];
		G.names=nameLookup(alnA);
		
		
		//remove whitespace from newick string input
		newick_string=$("#newick").val().replace(/\s/g, "");
		
		//if there's anything left, it had better be newick tree or we will be very upset.
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
			
			G.doEvo=1;
			$("#evol").removeAttr("disabled");
			$("#evol").html("Homology distance with tree-labelled gaps");
			tree=makeTree(root);
		
			}
	
	
		var homSetsA=[];
		var homSetsB=[];
			
		var alnAresults=getHomologySets(alnA,tree,G.doEvo);
		var alnBresults=getHomologySets(alnB,tree,G.doEvo);
		
		var homSetsA = alnAresults[0];
		var gapsA = alnAresults[1];
		var homSetsB = alnBresults[0];
		var gapsB = alnBresults[1];	
		
		var gapsHere=[];
		
		var sharedLength= gapsA.length > gapsB.length ? gapsA.length : gapsB.length
		for(var j=0; j < sharedLength;j++){
			gapsHere[j]=(gapsA[j] && gapsB[j]);
		}
		
		distances=getDistances(homSetsA,homSetsB,G.doEvo,gapsHere);
		END=new Date();
		console.log(END-START);
			}

	catch(e)
	{
		$("#errorBox").html("<b>ERROR: "+e+"</b>");
		$("#errorBox").fadeIn();
		return;
	}
	
	G.visualize=$("#visualize:checked").val();
	
		
	$("#controlPanel").css("display","");
	$("#sameOpacity").html("Fade distant "+G.sequenceType+"s");
	$("#diffOpacity").html("Fade close "+G.sequenceType+"s");
	
	$("#input").remove();
	$("#instructions").remove();
	var homType=parseInt($('#homologyType option:selected').val());
	if(G.visualize){
		$("#distanceVisualizationPanel").css("display","inline");
		var cssCache=[[],[],[],[]];
		
		//create coloured sequences for all homology types
		var $alnASeqDiv = colouredSequenceMaker(distances.character,alnA,"alnA");
		var $alnBSeqDiv = colouredSequenceMaker(distances.character,alnB,"alnB");
		
		
		var visType=parseInt($('#distanceVisualizationType option:selected').val());
		
		//create and append visualiser with initial default homology type
		var $visualiser = makeVisualiser($alnASeqDiv[homType],$alnBSeqDiv[homType],alnA,alnB);
		
		$("body").append($visualiser);
		
		//get width of sequence display and characters
		var divWidth = $("#alnA_seqs").outerWidth();
		var charWidth =  getCharWidth();
		
		//add padding to each end of sequences such that both first and last characters can be displayed in centre of  visualiser
		var padChars=parseInt(0.5*divWidth/charWidth)
		var padding = charPadding(padChars);
		for(var i=0;i<G.sequenceNumber;i++){
			$(".seq_"+i).prepend(padding);
			$(".seq_"+i).append(padding);
		}
		
		//make initial scroll position feel natural by showing start of alignment on the left of the display
		var startScroll=(parseInt(0.5*divWidth/charWidth))*charWidth;
		$("#alnA_seqs").scrollLeft(startScroll);
		$("#alnB_seqs").scrollLeft(startScroll);
		
		// alnXPositionOf array indicates the position j of character number i in the true sequence in alignment X
		// alnXCharacterAt array indicates what character i of the true sequence is at position number j in alignment X
		// yes, each pair of arrays is complementary
		var alnAPositionOf, alnACharacterAt, alnBPositionOf, alnBCharacterAt;
		var alnACharPos = getPositions(alnA);
		var alnBCharPos = getPositions(alnB);
		
		var alnAPositionOf = alnACharPos[0];
		var alnACharacterAt = alnACharPos[1];
		
		var alnBPositionOf = alnBCharPos[0];
		var alnBCharacterAt = alnBCharPos[1];
		
		//"Central" is the character
		var oldCentral="";
		var focusSeq=0;
		var oldFocusSeq=focusSeq;
		
		$("#alnA_seqs").bind('click', function(event) {
		
			focusSeq = $(event.target).closest("div").index();
			central = alnACharacterAt[focusSeq][$(event.target).closest("span").index() - padChars];
			$("#alnA"+"_"+oldFocusSeq+"_"+oldCentral).removeClass("centralChar");
			$("#alnB"+"_"+oldFocusSeq+"_"+oldCentral).removeClass("centralChar");
			
			oldFocusSeq=focusSeq;
			
			$("#alnA_seqs").scrollLeft(alnAPositionOf[focusSeq][central]*charWidth);
			$("#alnB_seqs").scrollLeft(alnBPositionOf[focusSeq][central]*charWidth);
	
			oldCentral=central;
			
			$("#charDist").text(distances.character[homType][focusSeq][central]);
			$("#alnA"+"_"+focusSeq+"_"+central).addClass("centralChar");
			$("#alnB"+"_"+focusSeq+"_"+central).addClass("centralChar");
		});
	
		$("#alnB_seqs").bind('click', function(event) {
			
			focusSeq = $(event.target).closest("div").index();
			central = alnBCharacterAt[focusSeq][$(event.target).closest("span").index() - padChars];
			$("#alnA"+"_"+oldFocusSeq+"_"+oldCentral).removeClass("centralChar");
			$("#alnB"+"_"+oldFocusSeq+"_"+oldCentral).removeClass("centralChar");
			
			oldFocusSeq=focusSeq;
			
			$("#alnA_seqs").scrollLeft(alnAPositionOf[focusSeq][central]*charWidth);
			$("#alnB_seqs").scrollLeft(alnBPositionOf[focusSeq][central]*charWidth);
	
			oldCentral=central;
			
			$("#charDist").text(distances.character[homType][focusSeq][central]);
			$("#alnA"+"_"+focusSeq+"_"+central).addClass("centralChar");
			$("#alnB"+"_"+focusSeq+"_"+central).addClass("centralChar");
		});
	
		$("#alnA_seqs").scroll(function() { 
			$("#alnA_names").scrollTop($("#alnA_seqs").scrollTop());
			$("#alnB_seqs").scrollTop($("#alnA_seqs").scrollTop());
		
			$("#alnA"+"_"+focusSeq+"_"+oldCentral).removeClass("centralChar");
			$("#alnB"+"_"+focusSeq+"_"+oldCentral).removeClass("centralChar");
			
			central=alnACharacterAt[focusSeq][Math.round($("#alnA_seqs").scrollLeft()/charWidth)];
			
			oldCentral=central;
			
			$("#charDist").text(distances.character[homType][focusSeq][central]);
			$("#alnA"+"_"+focusSeq+"_"+central).addClass("centralChar");
			$("#alnB_seqs").scrollLeft(alnBPositionOf[focusSeq][central]*charWidth);
			$("#alnB"+"_"+focusSeq+"_"+central).addClass("centralChar");
		});
		
		$("#alnB_seqs").scroll(function() { 
			$("#alnB_names").scrollTop($("#alnB_seqs").scrollTop());
			$("#alnA_seqs").scrollTop($("#alnB_seqs").scrollTop());
			
			
			$("#alnA"+"_"+focusSeq+"_"+oldCentral).removeClass("centralChar");
			$("#alnB"+"_"+focusSeq+"_"+oldCentral).removeClass("centralChar");
			
			central=alnBCharacterAt[focusSeq][Math.round($("#alnB_seqs").scrollLeft()/charWidth)];
			
			oldCentral=central;
			
			$("#charDist").text(distances.character[homType][focusSeq][central]);
			$("#alnB"+"_"+focusSeq+"_"+central).addClass("centralChar");
			$("#alnA_seqs").scrollLeft(alnAPositionOf[focusSeq][central]*charWidth);
			$("#alnA"+"_"+focusSeq+"_"+central).addClass("centralChar");
		});
	
		
		$("#distanceVisualizationType").change(function () {
			$("#distanceVisualizationType option:selected").each(function () {
				
				visType=parseInt($(this).val());
				switch (visType){
				case 2:
					$("#seqColour").attr('href','./'+G.sequenceType+'.css');
					changeDistanceVisualization();
					break;
				case 3:
					$("#seqColour").attr('href','./redfade.css');
					changeDistanceVisualization();
					//$("#visual").attr('href','./redfade.css');
					
					break;
				default:
					$("#seqColour").attr('href','./'+G.sequenceType+'.css');
					if(cssCache[homType][visType] == undefined){
						cssCache[homType][visType] = [];
						cssCache[homType][visType]=transparentAminoCSS(distances.character[homType],visType);
					}
					changeDistanceVisualization(cssCache[homType][visType]);
					
					break;
				}
				
				});
			})
	}
	
	$("#homologyType").change(function () {
			
			homType=parseInt($(this).val());
			
			for(var i=0;i<G.sequenceNumber;i++){
				var roundedSeqDistance=Math.round((distances.sequence[homType][i]*1000000))/1000000;
				
				$("#"+alnA[i].name+"_dist").text(roundedSeqDistance);
				
			}
			var roundedAlnDistance=Math.round((distances.alignment[homType]*1000000))/1000000;
			$("#alnDist").text(roundedAlnDistance);
			
			if(G.visualize){
		
				if(cssCache[homType][visType] == undefined){
					cssCache[homType][visType] = [];
					cssCache[homType][visType]=transparentAminoCSS(distances.character[homType],visType);
				}
				changeDistanceVisualization(cssCache[homType][visType]);
			}
			
			if(G.charDists){
				var newCharDists=makeCharDist(distances,homType,alnA);
				$("#chardists").replaceWith(newCharDists);
			}
			
			
		});
	
	var $output = makeOutput(distances,homType,alnA);
	$("body").append($output[0]);
	
	$("#showCharDists").click(function() {
                var newwindow=window.open('','charDists','height=400,width=400');
                newwindow.document.write("<html><head>")
                newwindow.document.write("</head><body><pre>");
                newwindow.document.write(makeRawCharDist(distances,homType,alnA).join('\n'));
                newwindow.document.write("</pre></body></html>");
                newwindow.document.close();
        });
        $("#showSeqDists").click(function(){
                var newwindow=window.open('','seqdists','height=600,width=400');
                var $output = makeOutput(distances,homType,alnA);
                newwindow.document.write("<html><head></head><body>" + $('<div/>').append($output[1]).html() + "</body></html>");
                newwindow.document.close();
        });
        

        var resizeBoxes = function(){
                var height = $(window).height();
                var targetHeight = height/2-80;
                $("#alnA_seqs").css("height",targetHeight);
                $("#alnA_names").css("height",targetHeight);
                $("#alnB_seqs").css("height",targetHeight);
                $("#alnB_names").css("height",targetHeight);
        };

        resizeBoxes();

        $(window).resize(resizeBoxes);

	
	
	


	
	
}
