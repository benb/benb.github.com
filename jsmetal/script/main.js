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
var charWidth;
var colDistA;
var colDistB;
var sparkLineClickA;
var sparkLineClickB;
var homType=2;
var sparklineDistanceType=true;


//Global object (container for a few general features and options that should be easily available)
var G = {};

//var pack = function(x){return msgpack.pack(x,true)};
//var unpack = function(x){return msgpack.unpack(x)};

var pack = function(x){return JSON.stringify(x)};
var unpack = function(x){return JSON.parse(x)};

//Internet exploder

   var alertFallback = false;
   if (typeof console === "undefined" || typeof console.log === "undefined") {
     console = {};
     if (alertFallback) {
         console.log = function(msg) {
              alert(msg);
         };
     } else {
         console.log = function() {};
     }
   }


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
                //console.log("HANDLING FILE");
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
function example(i){
        $.ajax(location.protocol + "//" + location.host + "/" + location.pathname.split('/').slice(0,-1).join("/") +  "/examples/example"+i+"a.fa").done(function(data){
                $("#alignment1").val(data);
        });
        $.ajax(location.protocol + "//" + location.host + "/" + location.pathname.split('/').slice(0,-1).join("/") +  "/examples/example"+i+"b.fa").done(function(data){
                $("#alignment2").val(data);
        });
        $.ajax(location.protocol + "//" + location.host + "/" + location.pathname.split('/').slice(0,-1).join("/") +  "/examples/example"+i+".tre").done(function(data){
                $("#newick").val(data);
        });

}
function supports_web_workers() {
        return !!window.Worker;
}
var useWorkers=supports_web_workers();
var START = new Date();

function dateStamp(string){
        var t=new Date();
        console.log((t-START) + " : " + string);
        START=t;
}
function process() {

        

	//hide error box if it was present
	$("#errorBox").css("display","none");
	
        $("#dialogtext").html("Calculation of homology sets");
        dialogBox.center();
        dialogBox.open();
      //  $("#dialog").dialog("open");
        
        dateStamp("end process()")
        _.defer(process1);

}
function process1(){
        console.log("process1");
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
                if (G.sequenceType=='nucleotide'){
                        $("#distanceVisualizationType").html($("#nuc-distanceVisualizationType").html());
                }
                $("#nuc-distanceVisualizationType").remove();
	        $("#distanceVisualizationType").kendoDropDownList({autoBind:true});	
                //hack:
                $("#distanceVisualizationType").data("kendoDropDownList").toggle();
                $("#distanceVisualizationType").data("kendoDropDownList").toggle();
		alnA.sort(nameSorter);
		alnB.sort(nameSorter);
		
                alnADensity=calcDensity(alnA);
                alnBDensity=calcDensity(alnB);

		//Check the mutual consistency of both alignments and gather a few global characteristics
		var seqDetails = checkConsistency(alnA,alnB);
		
		G.sequenceNumber = seqDetails[0];
		G.origLengths = seqDetails[1];
		//G.origSeqs = seqDetails[2];
		G.names=nameLookup(alnA,G.sequenceNumber);
		
		
		//remove whitespace from newick string input
		newick_string=$("#newick").val().replace(/\s/g, "");
		
		//if there's anything left, it had better be newick tree or we will be very upset.
	
                dateStamp("");
			}

	catch(e)
	{
		$("#errorBox").html("<b>ERROR: "+e+"</b>");
		$("#errorBox").fadeIn();
                //$("#dialog").dialog("close");
                dialogBox.close();
		return;
	}
	
		var homSetsA=[];
		var homSetsB=[];
                alnAresults=[];
                alnBresults=[];
                alnAresults[0]=[];
                alnBresults[0]=[];

                var ans;
                var end = _.after(2,process2);
                _.defer(function(){doHomology(newick_string,alnA,G.sequenceNumber,end)}); 
                _.defer(function(){doHomology(newick_string,alnB,G.sequenceNumber,end)}); 

                dateStamp("end process1()")
}

function doHomology(newick_string,aln,seqNum,end){
        var gotAns=function(ans){
                if (alnA===aln){
                        alnA=ans.ans;
                        G.doEvo=ans.doEvo;
                        console.log("doEvo? " + ans.doEvo);
                        homType=2+G.doEvo;
                }else if (alnB===aln){
                        alnB=ans.ans;
                }
                end();
        }
        if (useWorkers){
                var worker = new Worker('script/homologySets.js');
                worker.onmessage = function(event){
                        var ans = unpack(event.data);
                        if (ans.type=='error'){
                                throw ("ERROR: " + ans.msg);
                        }else if (ans.type=='status'){
                                dateStamp(ans.msg);
                        }else if (ans.type=='success') {
                                dateStamp("Got MSG");
                                gotAns(ans);
                        }
                }
                worker.postMessage(pack({tree:newick_string,aln:aln,seqNum:seqNum,set:3}));
                dateStamp("Sent MSG");
        } else {
                performHomologyWork(newick_string,aln,seqNum,3);
                if (aln[0].labeledContent[EVO]){
                        G.doEvo=1;
                        homType=3;
                }
                end();
        }
        
}
function process2(){
        _.defer(function(){$("#dialogtext").html("Calculation of distances")});
        console.log("PROCESS 2");
                distanceFs=calcDistances(alnA,alnB);
                console.log(distanceFs.length);
                distances={};
                distances.character=[];
                distances.alignment=[];
                distances.sequence=[];
                _.defer(process3);
		//distances=getDistances(homSetsA,homSetsB,G.doEvo,gapsHere);
                dateStamp("end process2()")
}
function updateCurrentHomType(){
        console.log(distanceFs);
        console.log(distanceFs.length);
        console.log("UPDATE HOM");
        var raw=distanceFs[homType]();
        distances.character[homType]=raw.character;
        distances.alignment[homType]=raw.alignment;
        distances.sequence[homType]=raw.sequence;
}
function process3(){
		


	G.visualize=$("#doviz:checked").val();
	
		
	$("#controlPanel").css("display","");
	$("#input").remove();
	$("#instructions").remove();

        _.defer(updateCurrentHomType);
        _.defer(vis);
        
        dateStamp("end process3()")
}
function vis(){
        console.log("VIS");
	if(G.visualize){
                if (G.doEvo){
                        $("#evol").removeAttr("disabled");
                        $("#evol").html("evol (recommended)");
                        $("#pos").html("pos");                                                                                                                      
                        $("#homologyType").val(homType);
                }else {
                        $("#evol").remove();
                }
                $("#homologyType").kendoDropDownList({autoBind:true});

                $("#homologyType").data("kendoDropDownList").toggle();
                $("#homologyType").data("kendoDropDownList").toggle();
		$("#distanceVisualizationPanel").css("display","inline");
		cssCache=[[],[],[],[]];
		
		//create coloured sequences for all homology types
		var $alnASeqDivX = colouredSequenceMaker(distanceFs,alnA,"alnA");
		var $alnBSeqDivX = colouredSequenceMaker(distanceFs,alnB,"alnB");
                alnAF = $alnASeqDivX;
                alnBF = $alnBSeqDivX;
                var $alnASeqDiv = alnAF[0];
                var $alnBSeqDiv = alnBF[0];

                
		
		
		var visType=parseInt($('#distanceVisualizationType option:selected').val());
		
		//create and append visualiser with initial default homology type
		var $visualiser = makeVisualiser($alnASeqDiv,$alnBSeqDiv,alnA,alnB);
		
		$("body").append($visualiser);

                $("#distanceToggle").click(function(){
                        console.log("CLICK");
                        sparklineDistanceType=!sparklineDistanceType;
                        if (sparklineDistanceType){
                                $(this).html("similarity");
                        }else{
                                $(this).html("distance");
                        }
                        doRedisplaySparklines();
                });
                if (sparklineDistanceType){
                        $("#distanceToggle").html("similarity");
                }else {
                        $("#distanceToggle").html("distance");
                }
                applyCSS(alnAF[0],alnAF[1][homType]());
                applyCSS(alnBF[0],alnBF[1][homType]());

		//get width of sequence display and characters
		var divWidth = $("#alnA_seqs").outerWidth();
		charWidth =  getCharWidth();
		
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
                var focusCentral=function(){
                        $("#alnA_seqs").scrollLeft(alnAPositionOf[focusSeq][central]*charWidth);
                        $("#alnB_seqs").scrollLeft(alnBPositionOf[focusSeq][central]*charWidth);
                        redisplaySparklines();
                }
	
                sparkLineClickA = function(event){
                        console.log("GOT CLICK");
                        console.log(event.sparklines);
                        console.log(event.sparklines[0].getCurrentRegionFields());
                        central = event.sparklines[0].getCurrentRegionFields().offset;
                        central = central-cGapsA[focusSeq][central];
                        clickChar();
                        focusCentral();
                }
                sparkLineClickB = function(event){
                        central = event.sparklines[0].getCurrentRegionFields().offset;
                        central = central-cGapsB[focusSeq][central];
                        clickChar();
                        focusCentral();
                }
                recalculateSparklines();
                redisplaySparklines();

                recalculateMinilines();
                $("#alnB_sparkline").bind('sparklineClick',sparkLineClickB);
                $("#alnA_sparkline").bind('sparklineClick',sparkLineClickA);
                var clickChar=function(){
                        //this sets the focused character to [focusSeq][central]
                        $("#alnA"+"_"+oldFocusSeq+"_"+oldCentral).removeClass("centralChar");
                        $("#alnB"+"_"+oldFocusSeq+"_"+oldCentral).removeClass("centralChar");

                        oldFocusSeq=focusSeq;


                        oldCentral=central;

                        $("#charDist").text(Math.round(distances.character[homType][focusSeq][central]*1000)/1000);
                        $("#alnA"+"_"+focusSeq+"_"+central).addClass("centralChar");
                        $("#alnB"+"_"+focusSeq+"_"+central).addClass("centralChar");
                }
	$("#alnA_seqs").bind('click', function(event) {
			focusSeq = $(event.target).closest("div").index();
			central = alnACharacterAt[focusSeq][$(event.target).closest("span").index() - padChars];
                        clickChar();
		});
	
		$("#alnB_seqs").bind('click', function(event) {
			focusSeq = $(event.target).closest("div").index();
			central = alnBCharacterAt[focusSeq][$(event.target).closest("span").index() - padChars];
                        clickChar();
		});
                var throttleSpeed=200;
	
                scrollA=_.debounce(function(ev){
                    //    console.log("SCROLL A");
                                var range = visibleRange($("#alnA_seqs"),alnA[0].content.length);

                                central=alnACharacterAt[focusSeq][Math.round($("#alnA_seqs").scrollLeft()/charWidth)];
                                clickChar();
		       
                                $("#alnB_seqs").off('scroll');
                                $("#alnB_seqs").scrollLeft(alnBPositionOf[focusSeq][central]*charWidth);
                                $("#alnB_seqs").scrollTop($("#alnA_seqs").scrollTop());
                                $("#alnA_names").scrollTop($("#alnA_seqs").scrollTop());
                                $("#alnB_names").scrollTop($("#alnA_seqs").scrollTop());
                                redisplaySparklines();
                                _.defer(function(){ $("#alnB_seqs").on('scroll',scrollB);});

                },throttleSpeed);
		
                scrollB=_.debounce(function(ev) { 
                     //   console.log("SCROLL B");
			
                                central=alnBCharacterAt[focusSeq][Math.round($("#alnB_seqs").scrollLeft()/charWidth)];
                                clickChar();
			
                                $("#alnA_seqs").off('scroll');
                                $("#alnA_seqs").scrollLeft(alnAPositionOf[focusSeq][central]*charWidth);
                                $("#alnA_seqs").scrollTop($("#alnB_seqs").scrollTop());
                                $("#alnA_names").scrollTop($("#alnB_seqs").scrollTop());
                                $("#alnB_names").scrollTop($("#alnB_seqs").scrollTop());
                                redisplaySparklines();
                                _.defer(function(){ $("#alnA_seqs").on('scroll',scrollA);});
		},throttleSpeed);
	
		$("#alnA_seqs").on('scroll',scrollA);
		$("#alnB_seqs").on('scroll',scrollB);
		
                var distVisHandler = function () {
			$("#distanceVisualizationType option:selected").each(function () {
				var visType=$(this).val();
                                //console.log(visType);
                                $("#seqColour").attr('href','css/'+visType+'.css');
				
				});
			};
                distVisHandler();
		$("#distanceVisualizationType").change(distVisHandler);

	}
        _.defer(function(){dialogBox.close(); });
        _.defer(bindings);
        dateStamp("end vis()")
       	
}
function bindings(){

	$("#homologyType").change(function () {
			
			homType=parseInt($(this).val());
                        //console.log("homType " + homType);
                        updateCurrentHomType();
			
                        /*
			for(var i=0;i<G.sequenceNumber;i++){
				var roundedSeqDistance=Math.round((distances.sequence[homType][i]*1000000))/1000000;
				
				$("#"+alnA[i].name+"_dist").text(roundedSeqDistance);
				
			}*/
			var roundedAlnDistance=Math.round((distances.alignment[homType]*1000000))/1000000;
			$("#alnDist").text(roundedAlnDistance);
			
                        var visType=parseInt($('#distanceVisualizationType option:selected').val());
			if(G.visualize){
                                applyCSS(alnAF[0],alnAF[1][homType]());
                                applyCSS(alnBF[0],alnBF[1][homType]());
                                recalculateSparklines();
                                redisplaySparklines();
                                recalculateMinilines();
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
                //distance to top of visualiser
                var otherHeight=$("#visualiser").offset().top 
                //padding on visualiser
                otherHeight+=$("#visualiser").outerHeight(true);                                                                                                
                otherHeight-=$("#alnA_seqs").outerHeight(true);                                                                                                
                otherHeight-=$("#alnB_seqs").outerHeight(true);                                                                                                
               
                //output at bottom
                otherHeight+=$("#output table").outerHeight(true);

                var targetHeight = (height-otherHeight)/2;
                $("#alnA_seqs").css("height",targetHeight);
                $("#alnA_names").css("height",targetHeight);
                $("#alnB_seqs").css("height",targetHeight);
                $("#alnB_names").css("height",targetHeight);
                redisplaySparklines();
        };

        resizeBoxes();

        $(window).resize(resizeBoxes);
        $("#consensus").on("click",function(){
                var newwindow=window.open('','consensus','height=400,width=400');
                newwindow.document.write("<html><head>")
                newwindow.document.write("</head><body><pre>");
                for (var i=0; i < alnA.length; i++){
                       newwindow.document.write(">"+alnA[i].name+"\n"); 
                       var str=[];
                       for (var j=0; j < alnA[i].content.length; j++){
                              if (colDistA[j]==0.0){
                                      str.push(alnA[i].content[j]);
                              }
                       }
                       newwindow.document.write(str.join("")+"\n");
                }
                newwindow.document.write("</pre></body></html>");
        });
        dateStamp("end bindings()")
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
                redisplaySparklines = _.throttle(doRedisplaySparklines,1000);
}
function doRedisplaySparklines(){
        console.log("distance " + sparklineDistanceType);
                applyColumnDist(colDistA,alnADensity,$("#alnA_seqs"),$("#alnA_sparkline"),$("#alnA_seqs").width(),sparklineDistanceType);
                applyColumnDist(colDistB,alnBDensity,$("#alnB_seqs"),$("#alnB_sparkline"),$("#alnB_seqs").width(),sparklineDistanceType);
}


function recalculateMinilines(){
       var t1 = new Date();
       for (var i=0; i < distances.sequence[homType].length; i++){
               var target = $(".miniline_"+i);
               target.css("width","30%");
               target.html("<img src='png/"+Math.floor(distances.sequence[homType][i]*100)+".png' title='"+distances.sequence[homType][i]+"' height='10px' style='max-width:100%'/>")
       }
       var t2 = new Date();
       console.log(t2-t1);
}

function calcDensity(aln){
        var ans = [];
        for (var i=0; i < aln.length; i++){
                for (var j=0; j < aln[i].content.length; j++){
                        if (aln[i].content[j]!="-"){
                                if (!ans[j]){
                                        ans[j]=0;
                                }
                                ans[j]++;
                        }
                }
        }
        for (var i=0; i < ans.length; i++){
                ans[i]/=aln.length;
        }
        return ans;
}
