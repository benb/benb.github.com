//CONSTANTS - to use arrays instead of objects

var SSP = 0;
var SIM = 1;
var POS = 2;
var EVO = 3;

//make these global to support web workers
var alnBresults=[];
var alnAresults=[];

var alnAF;
var alnBF;//functions for rewriting the CSS on the alignments

var padChars = 20;
var colDistA;
var colDistB;
var sparkLineClickA;
var sparkLineClickB;
var homType;

//Global object (container for a few general features and options that should be easily available)
var G = {};

$(function(){
        draganddrop("#alignment1");
        draganddrop("#alignment2");
        draganddrop("#newick");
        //$("#alignment1File").bind('change',[],["#alignment1"],handleFileSelect); //.addEventListener('change', handleFileSelect, false);
        $("#alignment2File").bind('change',getHandleFileSelect($("#alignment2"))); 
        $("#alignment1File").bind('change',getHandleFileSelect($("#alignment1"))); 
        $("#newickFile").bind('change',getHandleFileSelect($("#newick"))); 
});

function getHandleFileSelect(target){
        return function(e){
                handleFileSelect(target,e);
        }
        function handleFileSelect(target,e){
                console.log("HANDLING FILE");
                e = e.originalEvent || e;
                var file = e.target.files[0];
                console.log(e);
                getFile(file,target);
        }


}
        

function getFile(file,target){
        console.log("Attempting to get " + file);
        var reader = new FileReader();
        reader.onload=function(theFile){
                console.log(theFile);
                target.val(theFile.target.result);
        };
        reader.readAsText(file);
}


//drag-and-drop handlers
function draganddrop(id){
        var $dropArea = $(id);

$dropArea.bind({
    dragover: function () {
        $(this).addClass('hover');
        return false;
    },
    dragend: function () {
        $(this).removeClass('hover');
        return false;
    },
    drop: function (e) {
        e = e || window.event;
        e.preventDefault();

        // jQuery wraps the originalEvent, so we try to detect that here...
        e = e.originalEvent || e;
        console.log(e);
        // Using e.files with fallback because e.dataTransfer is immutable and can't be overridden in Polyfills (http://sandbox.knarly.com/js/dropfiles/).            
        var files = (e.files || e.dataTransfer.files);
        getFile(files[0],$dropArea);
        return false;
    }
});

        
}
function example1(){
        $.ajax(location.protocol + "//" + location.host + "/" + location.pathname.split('/').slice(0,-1).join("/") +  "/examples/example1a.fa").done(function(data){
                $("#alignment1").val(data);
        });
        $.ajax(location.protocol + "//" + location.host + "/" + location.pathname.split('/').slice(0,-1).join("/") +  "/examples/example1b.fa").done(function(data){
                $("#alignment2").val(data);
        });
        $.ajax(location.protocol + "//" + location.host + "/" + location.pathname.split('/').slice(0,-1).join("/") +  "/examples/example1.tre").done(function(data){
                $("#newick").val(data);
        });

}
function example2(){
        $.ajax(location.protocol + "//" + location.host + "/" + location.pathname.split('/').slice(0,-1).join("/") +  "/examples/example2a.fa").done(function(data){
                $("#alignment1").val(data);
        });
        $.ajax(location.protocol + "//" + location.host + "/" + location.pathname.split('/').slice(0,-1).join("/") +  "/examples/example2b.fa").done(function(data){
                $("#alignment2").val(data);
        });
        $.ajax(location.protocol + "//" + location.host + "/" + location.pathname.split('/').slice(0,-1).join("/") +  "/examples/example2.tre").done(function(data){
                $("#newick").val(data);
        });
}
	
function process() {
	START = new Date();
	//hide error box if it was present
	$("#errorBox").css("display","none");
	
        $("#dialogtext").html("Calculation of homology sets");
        $("#dialog").dialog("open");
	G.doEvo = 0;
	
		//var newick_string=$("#newick").val().replace(/\s/g, "");
                //tree = makeTree(parseNewickString(newick_string));
                //enforceBi(tree);

                //console.log(tree);
                //console.log(tree.descendents());
	
	
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
		G.names=nameLookup(alnA,G.sequenceNumber);
		
		
		//remove whitespace from newick string input
		newick_string=$("#newick").val().replace(/\s/g, "");
		
		//if there's anything left, it had better be newick tree or we will be very upset.
	
		END=new Date();
		console.log(END-START);
			}

	catch(e)
	{
		$("#errorBox").html("<b>ERROR: "+e+"</b>");
		$("#errorBox").fadeIn();
		return;
	}
	
		var homSetsA=[];
		var homSetsB=[];

	        
                var alnAWorker = new Worker("script/homologySets.js");
                var alnBWorker = new Worker("script/homologySets.js");

                
                alnAWorker.onmessage = function(e){
                        var ans = JSON.parse(e.data);
                        console.log(ans);
                        if (ans.type=="error"){
                                throw(ans.msg);
                                $("#errorBox").html("<b>ERROR: "+ans.msg+"</b>");
                                $("#errorBox").fadeIn();
                                return;
                        }else {
                                console.log("OK");
                                alnAresults=ans.ans;
                                console.log(ans.doEvo);
                                G.doEvo=ans.doEvo;
                                if (G.doEvo){
                                        $("#evol").removeAttr("disabled");
                                        $("#evol").html("evol (recommended)");
                                        $("#pos").html("pos");
                                }
                        }
                        if (alnBresults.length>0){
                                _.defer(process2);
                        }
                }
                alnAWorker.postMessage(JSON.stringify({'aln':alnA,'tree':newick_string,'doEvo':G.doEvo,'seqNum':G.sequenceNumber}));
                alnBWorker.onmessage = function(e){
                        var ans = JSON.parse(e.data);
                        console.log(ans);
                        if (ans.type=="error"){
                                throw(ans.msg);
                                $("#errorBox").html("<b>ERROR: "+ans.msg+"</b>");
                                $("#errorBox").fadeIn();
                                return;
                        }else {
                                alnBresults=ans.ans;
                        }
                        if (alnAresults.length>0){
                                _.defer(process2);
                        }
                }
                alnBWorker.postMessage(JSON.stringify({'aln':alnB,'tree':newick_string,'doEvo':G.doEvo,'seqNum':G.sequenceNumber}));
}
function process2(){

        $("#dialogtext").html("Calculation of distances");
		var homSetsA = alnAresults[0];
		var gapsA = alnAresults[1];
		var homSetsB = alnBresults[0];
		var gapsB = alnBresults[1];	
		
		var gapsHere=[];
		
		var sharedLength= gapsA.length > gapsB.length ? gapsA.length : gapsB.length
		for(var j=0; j < sharedLength;j++){
			gapsHere[j]=(gapsA[j] && gapsB[j]);
		}

                var distWorker = new Worker("script/distances.js");
                distWorker.onmessage = function(e){
                        var ans = JSON.parse(e.data);
                        switch(ans.type){
                                case "error":
                                        throw(ans.msg);
                                        error(ans.msg);
                                        return;
                                case "intermediate":
                                        //console.log(ans.msg);
                                        $("#dialogtext").html(ans.msg);
                                        break;
                                case "success":
                                        $("#dialogtext").html("Performing visualisation");
                                        distances=ans.distances;
                                        _.defer(process3);
                        }
                }
                distWorker.postMessage(JSON.stringify({'A':homSetsA,'B':homSetsB,'gapsHere':gapsHere,'G':G}));
		//distances=getDistances(homSetsA,homSetsB,G.doEvo,gapsHere);
}
function process3(){
		


	G.visualize=$("#visualize:checked").val();
	
		
	$("#controlPanel").css("display","");
        if (G.sequenceType=="amino acid"){
                $("#sameOpacity").html("Taylor (Fade distant)");
                $("#diffOpacity").html("Taylor (Fade close)");
        }else {
                $("#sameOpacity").html("Fade distant "+G.sequenceType+"s");
                $("#diffOpacity").html("Fade close "+G.sequenceType+"s");
        }
	
	$("#input").remove();
	$("#instructions").remove();
	homType=parseInt($('#homologyType option:selected').val());
	if(G.visualize){
		$("#distanceVisualizationPanel").css("display","inline");
		var cssCache=[[],[],[],[]];
		
		//create coloured sequences for all homology types
		var $alnASeqDivX = colouredSequenceMaker(distances.character,alnA,"alnA");
		var $alnBSeqDivX = colouredSequenceMaker(distances.character,alnB,"alnB");
                alnAF = $alnASeqDivX;
                alnBF = $alnBSeqDivX;
                var $alnASeqDiv = alnAF[0];
                var $alnBSeqDiv = alnBF[0];

                
		
		
		var visType=parseInt($('#distanceVisualizationType option:selected').val());
		
		//create and append visualiser with initial default homology type
		var $visualiser = makeVisualiser($alnASeqDiv,$alnBSeqDiv,alnA,alnB);
		
		$("body").append($visualiser);
		
                applyCSS(alnAF[0],alnAF[1][homType]);
                applyCSS(alnBF[0],alnBF[1][homType]);

		//get width of sequence display and characters
		var divWidth = $("#alnA_seqs").outerWidth();
		var charWidth =  getCharWidth();
		
		//add padding to each end of sequences such that both first and last characters can be displayed in centre of  visualiser
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
                var cGapsA=cumulativeGaps(alnA);
                var cGapsB=cumulativeGaps(alnB);
		
                sparkLineClickA = function(event){
                        central = event.sparklines[0].getCurrentRegionFields()[0].offset;
                        central = central-cGapsA[focusSeq][central];
                        clickChar();
                        focusCentral();
                }
                sparkLineClickB = function(event){
                        central = event.sparklines[0].getCurrentRegionFields()[0].offset;
                        central = central-cGapsB[focusSeq][central];
                        clickChar();
                        focusCentral();
                }
                recalculateSparklines();
                redisplaySparklines();

                $("#alnB_sparkline").bind('sparklineClick',sparkLineClickB);
                $("#alnA_sparkline").bind('sparklineClick',sparkLineClickA);
                var clickChar=function(){
                        console.log("clickChar");
                        $("#alnA"+"_"+oldFocusSeq+"_"+oldCentral).removeClass("centralChar");
                        $("#alnB"+"_"+oldFocusSeq+"_"+oldCentral).removeClass("centralChar");

                        oldFocusSeq=focusSeq;


                        oldCentral=central;

                        $("#charDist").text(distances.character[homType][focusSeq][central]);
                        $("#alnA"+"_"+focusSeq+"_"+central).addClass("centralChar");
                        $("#alnB"+"_"+focusSeq+"_"+central).addClass("centralChar");
                        redisplaySparklines();
                }
                var focusCentral=function(){
                        $("#alnA_seqs").scrollLeft(alnAPositionOf[focusSeq][central]*charWidth);
                        $("#alnB_seqs").scrollLeft(alnBPositionOf[focusSeq][central]*charWidth);
                        redisplaySparklines();
                }
		$("#alnA_seqs").bind('click', function(event) {
			focusSeq = $(event.target).closest("div").index();
			central = alnACharacterAt[focusSeq][$(event.target).closest("span").index() - padChars];
                        clickChar();
                        focusCentral();
		});
	
		$("#alnB_seqs").bind('click', function(event) {
			focusSeq = $(event.target).closest("div").index();
			central = alnBCharacterAt[focusSeq][$(event.target).closest("span").index() - padChars];
                        clickChar();
                        focusCentral();
		});
	
		$("#alnA_seqs").scroll(function() { 
			$("#alnA_names").scrollTop($("#alnA_seqs").scrollTop());
			$("#alnB_seqs").scrollTop($("#alnA_seqs").scrollTop());
			
			central=alnACharacterAt[focusSeq][Math.round($("#alnA_seqs").scrollLeft()/charWidth)];
                        clickChar();
		       
			$("#alnB_seqs").scrollLeft(alnBPositionOf[focusSeq][central]*charWidth);
		});
		
		$("#alnB_seqs").scroll(function() { 
			$("#alnB_names").scrollTop($("#alnB_seqs").scrollTop());
			$("#alnA_seqs").scrollTop($("#alnB_seqs").scrollTop());
			
			central=alnBCharacterAt[focusSeq][Math.round($("#alnB_seqs").scrollLeft()/charWidth)];
			
			
			$("#alnA"+"_"+focusSeq+"_"+oldCentral).removeClass("centralChar");
			$("#alnB"+"_"+focusSeq+"_"+oldCentral).removeClass("centralChar");

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
                _.defer(function(){
                        $("#distanceVisualizationType").change();
                });

	}
       	
        _.defer(function(){$("#dialog").dialog("close");});
	$("#homologyType").change(function () {
			
			homType=parseInt($(this).val());
			
                        /*
			for(var i=0;i<G.sequenceNumber;i++){
				var roundedSeqDistance=Math.round((distances.sequence[homType][i]*1000000))/1000000;
				
				$("#"+alnA[i].name+"_dist").text(roundedSeqDistance);
				
			}*/
			var roundedAlnDistance=Math.round((distances.alignment[homType]*1000000))/1000000;
			$("#alnDist").text(roundedAlnDistance);
			
			if(G.visualize){
                                console.log("Applying");		
                                applyCSS(alnAF[0],alnAF[1][homType]);
                                applyCSS(alnBF[0],alnBF[1][homType]);
				if(cssCache[homType][visType] == undefined){
					cssCache[homType][visType] = [];
					cssCache[homType][visType]=transparentAminoCSS(distances.character[homType],visType);
				}
				changeDistanceVisualization(cssCache[homType][visType]);
                                recalculateSparklines();
                                redisplaySparklines();
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
                var targetHeight = height/2-120;
                $("#alnA_seqs").css("height",targetHeight);
                $("#alnA_names").css("height",targetHeight);
                $("#alnB_seqs").css("height",targetHeight);
                $("#alnB_names").css("height",targetHeight);
                redisplaySparklines();
        };

        resizeBoxes();

        $(window).resize(resizeBoxes);

}

function cumulativeGaps(aln){
        var ans = [];
        for (var i=0; i < aln.length; i++){
                ans[i]=[];
                if (aln[i].content[0]=="-"){
                        ans[i][0]=1;
                }else {
                        ans[i][0]=0;
                }
                for (var j=1; j < aln[i].content.length; j++){
                        if (aln[i].content[j]=="-"){
                                ans[i][j]=ans[i][j-1]+1;
                        }else {
                                ans[i][j]=ans[i][j-1];
                        }
                }
        }
        return ans;
}

function recalculateSparklines(){
                colDistA = makeRawColumnDist(distances,homType,alnA);
                colDistB = makeRawColumnDist(distances,homType,alnB);
                redisplaySparklines = _.throttle(doRedisplaySparklines,100);
}
function doRedisplaySparklines(){
                applyColumnDist(colDistA,$("#alnA_seqs"),$("#alnA_sparkline"),$("#alnA_seqs").width(),sparkLineClickA);
                applyColumnDist(colDistB,$("#alnB_seqs"),$("#alnB_sparkline"),$("#alnB_seqs").width(),sparkLineClickB);
}
