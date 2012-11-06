//WARN IE USERS
function warn(){
        if (navigator.userAgent.indexOf('MSIE') != -1){
                $("#errorBox").html("<b>WARNING: webMetAl is known to perform poorly in Internet Explorer.</b>");
                $("#errorBox").fadeIn();
        }
}

//CONSTANTS - to use arrays instead of objects

var SSP = 0;
var SIM = 1;
var POS = 2;
var EVO = 3;

//make these global to support web workers
var alnBresults=[];
var alnAresults=[];

var homTypes=[0,1,2];
var alnAF=[];
var alnBF=[];//functions for rewriting the CSS on the alignments

var padChars = 20;
var charWidth;
var colDistA;
var colDistB;
var homType=2;
var sparklineDistanceType=true;
var distances={};
var lock=[];
var def=[];


//Global object (container for a few general features and options that should be easily available)
var G = {};
G.ignoreNamesFlag=false;

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
function errorBox(e){
        $("#errorBox").html("<b>ERROR: "+e+"</b>");
        $("#errorBox").fadeIn();
        //$("#dialog").dialog("close");
        dialogBox.close();
}

function process() {

        

	//hide error box if it was present
	$("#errorBox").css("display","none");
	
        $("#dialogtext").html("Calculation of homology sets");
        dialogBox.center();
        dialogBox.open();
      //  $("#dialog").dialog("open");
        
        //dateStamp("end process()")
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
		alnA.sort(nameSorter);
		alnB.sort(nameSorter);
		newick_string=$("#newick").val().replace(/\s/g, "");
                var seqDetails;
                if (newick_string!=""){
                        seqDetails = checkConsistency(alnA,alnB,newick_string);
                }else {
                        seqDetails = checkConsistency(alnA,alnB);
                }
                if (G.sequenceType=='nucleotide'){
                        $("#distanceVisualizationType").html($("#nuc-distanceVisualizationType").html());
                }
                $("#nuc-distanceVisualizationType").remove();
	        $("#distanceVisualizationType").kendoDropDownList({autoBind:true});	
                //hack:
                $("#distanceVisualizationType").data("kendoDropDownList").toggle();
                $("#distanceVisualizationType").data("kendoDropDownList").toggle();

		
                alnADensity=calcDensity(alnA);
                alnBDensity=calcDensity(alnB);

		//Check the mutual consistency of both alignments and gather a few global characteristics
		
		G.sequenceNumber = seqDetails[0];
		G.origLengths = seqDetails[1];
		//G.origSeqs = seqDetails[2];
		G.names=nameLookup(alnA,G.sequenceNumber);
		
		
		//remove whitespace from newick string input
		
		//if there's anything left, it had better be newick tree or we will be very upset.
	
                //dateStamp("");
			}

	catch(e)
	{
                errorBox(e);
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

                //dateStamp("end process1()")
}

function doHomology(newick_string,aln,seqNum,end){
        try{
                var gotAns=function(ans){
                        if (alnA===aln){
                                alnA=ans.ans;
                                G.doEvo=ans.doEvo;
                                if (G.doEvo){
                                        homTypes.push(3);
                                }
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
                                        errorBox(ans.msg);
                                }else if (ans.type=='status'){
                                        //dateStamp(ans.msg);
                                }else if (ans.type=='success') {
                                        //dateStamp("Got MSG");
                                        gotAns(ans);
                                }
                        }
                        worker.postMessage(pack({tree:newick_string,aln:aln,seqNum:seqNum}));
                        //dateStamp("Sent MSG");
                } else {
                        performHomologyWork(newick_string,aln,seqNum);
                        if (aln[0].labeledContent[EVO]){
                                G.doEvo=1;
                                homType=3;
                                homTypes.push(3);
                        }
                        end();
                }
        }
        catch(e){
                console.log(e);
                errorBox(e);
        }
}
function process2(){
        _.defer(function(){$("#dialogtext").html("Calculation of distances")});
        console.log("PROCESS 2");

        distances.character=Array(3+G.doEvo);
        distances.alignment=Array(3+G.doEvo);
        distances.sequence=Array(3+G.doEvo);
        if (useWorkers){
                var distSet=[2,1,0];
                if (G.doEvo){distSet.unshift(3)}
                lock=_.map(distSet,function(x){return true;});
                def=_.map(distSet,function(x){return $.Deferred()});
                var postF=function(myDist){
                        if (myDist<0){return;}
                        var worker = new Worker("script/distances.js");
                        var deferred=def[myDist];
                        worker.onmessage= function (e) { 
                                        var raw = unpack(e.data).distances;
                                        distances.character[myDist]=raw.character;
                                        distances.alignment[myDist]=raw.alignment;
                                        distances.sequence[myDist]=raw.sequence;
                                        console.log("WRITTEN " + myDist);
                                        deferred.resolve();
                                }
                        worker.postMessage(pack({A:alnA,B:alnB,dist:myDist}));
                        console.log("Sent one!");
                }
                postF(homType);
                _.each(distSet,function(x){
                        def[x].done(function(){lock[x]=false;postF(x-1)});
                       });
                _.defer(function(){alnAF[0] = sequenceMaker(alnA,"alnA",padChars)});                                                                                                  
                _.defer(function(){alnBF[0] = sequenceMaker(alnB,"alnB",padChars)});                                                                                                  
                def[homType].done(function(){_.defer(process3)});
        }else{
                distanceFs=calcDistances(alnA,alnB);
                _.each(homTypes,function(i){
                        var raw = distanceFs[i]();
                        distances.character[i]=raw.character;
                        distances.alignment[i]=raw.alignment;
                        distances.sequence[i]=raw.sequence;

                });
                _.defer(function(){alnAF[0] = sequenceMaker(alnA,"alnA",padChars)});                                                                                                  
                _.defer(function(){alnBF[0] = sequenceMaker(alnB,"alnB",padChars)});                                                                                                  
                _.defer(function(){ console.log(alnAF[0])});
                _.defer(process3);
        }
        //distances=getDistances(homSetsA,homSetsB,G.doEvo,gapsHere);
}
function updateCurrentHomType(){
        console.log("UPDATE HOM");
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
var prog=0;
        var progress=function(){
                dateStamp(prog++);
        }

function vis(){
        console.log("VIS");
        if(G.visualize){
                progress();
                if (G.doEvo){
                        $("#evol").removeAttr("disabled");
                        $("#evol").html("evol (recommended)");
                        $("#pos").html("pos");                                                                                                                      
                        $("#homologyType").val(homType);
                }else {
                        $("#evol").remove();
                }
                progress();
                $("#homologyType").kendoDropDownList({autoBind:true});
                progress();

                $("#homologyType").data("kendoDropDownList").toggle();
                progress();
                $("#homologyType").data("kendoDropDownList").toggle();
                progress();
		$("#distanceVisualizationPanel").css("display","inline");
                progress();
		cssCache=[[],[],[],[]];
		
		//create coloured sequences for all homology types
                alnAF[1] = _.map(homTypes,function(x){return _.memoize(function(){return colouredCSSMaker(distances.character[x],alnA,"alnA")});});                                                                         
                progress();
                alnBF[1] = _.map(homTypes,function(x){return _.memoize(function(){return colouredCSSMaker(distances.character[x],alnB,"alnB")});});                                                                         
                progress();
                var $alnASeqDiv = alnAF[0];
                progress();
                var $alnBSeqDiv = alnBF[0];
                progress();

                
		
		
		var visType=parseInt($('#distanceVisualizationType option:selected').val());
		
                progress();
		//create and append visualiser with initial default homology type
		var $visualiser = makeVisualiser($alnASeqDiv,$alnBSeqDiv,alnA,alnB);
                progress();
		
		$("body").append($visualiser);
                progress();

               progress();
                if (sparklineDistanceType){
                        $("#distanceToggle").html("similarity");
                }else {
                        $("#distanceToggle").html("distance");
                }
                progress();
                applyCSS(alnAF[0],alnAF[1][homType]());
                progress();
                applyCSS(alnBF[0],alnBF[1][homType]());
                progress();

		//get width of sequence display and characters
	//	var divWidth = $("#alnA_seqs").outerWidth();
                progress();
		charWidth =  getCharWidth();
                progress();
		
		//add padding to each end of sequences such that both first and last characters can be displayed in centre of  visualiser
		
                progress();

		
		//make initial scroll position feel natural by showing start of alignment on the left of the display
		var startScroll=250;
                progress();
		$("#alnA_seqs").scrollLeft(startScroll);
                progress();
		$("#alnB_seqs").scrollLeft(startScroll);
                progress();
                		
                progress();
                recalculateSparklines();
                progress();
                redisplaySparklines();
                progress();

                recalculateMinilines();
                progress();
	}
        _.defer(function(){dialogBox.close(); });
        _.defer(bindings);
        dateStamp("end vis()")
}
function bindings(){
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
                alnA_seqs=$("#alnA_seqs");
                alnB_seqs=$("#alnB_seqs");
                alnA_names=$("#alnA_names");
                alnB_names=$("#alnB_names");
                var focusCentral=function(){
                        alnA_seqs.scrollLeft(alnAPositionOf[focusSeq][central]*charWidth);
                        alnB_seqs.scrollLeft(alnBPositionOf[focusSeq][central]*charWidth);
                        redisplaySparklines();
                }
	
                sparkLineClickA = function(event){
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
                verticalClick=function(event){
                        var posY = $(this).offset().top;
                        var posY=event.pageY-posY;
                        console.log("GOT CLICK " + posY);
                        var height = $("#alnA_seqs").height();
                        var fullheight = $("#alnA_seqs")[0].scrollHeight;
                        var sTop = Math.max(0,posY/height-(height/fullheight/2))*fullheight;
                        
                        console.log("scrollTop " + $(this).offset().top + " " + event.pageY + " " + posY + " " + fullheight + " " + height + " " + (height / 2) + " " + sTop);
                        $("#alnA_seqs").scrollTop(sTop);
                }
                $("#alnA_Y").on("click",verticalClick);
                $("#alnB_Y").on("click",verticalClick);

                $("#alnB_sparkline").bind('sparklineClick',sparkLineClickB);
                $("#alnA_sparkline").bind('sparklineClick',sparkLineClickA);
                alnA_seqs.bind('click', function(event) {
			focusSeq = $(event.target).closest("div").index();
			central = alnACharacterAt[focusSeq][$(event.target).closest("span").index() - padChars];
                        clickChar();
		});
	
		alnB_seqs.bind('click', function(event) {
			focusSeq = $(event.target).closest("div").index();
			central = alnBCharacterAt[focusSeq][$(event.target).closest("span").index() - padChars];
                        clickChar();
		});
                var throttleSpeed=100;
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
 

                scrollA=_.debounce(function(ev){
                    //    console.log("SCROLL A");

                                central=alnACharacterAt[focusSeq][Math.round(alnA_seqs.scrollLeft()/charWidth)];
                                clickChar();
		       
                                alnB_seqs.off('scroll');
                                alnB_seqs.scrollLeft(alnBPositionOf[focusSeq][central]*charWidth);
                                alnB_seqs.scrollTop(alnA_seqs.scrollTop());
                                alnA_names.scrollTop(alnA_seqs.scrollTop());
                                alnB_names.scrollTop(alnA_seqs.scrollTop());
                                redisplaySparklines();
                                _.defer(function(){ alnB_seqs.on('scroll',scrollB);});

                },throttleSpeed);
		
                scrollB=_.debounce(function(ev) { 
                     //   console.log("SCROLL B");
			
                                central=alnBCharacterAt[focusSeq][Math.round(alnB_seqs.scrollLeft()/charWidth)];
                                clickChar();
			
                                alnA_seqs.off('scroll');
                                alnA_seqs.scrollLeft(alnAPositionOf[focusSeq][central]*charWidth);
                                alnA_seqs.scrollTop(alnB_seqs.scrollTop());
                                alnA_names.scrollTop(alnB_seqs.scrollTop());
                                alnB_names.scrollTop(alnB_seqs.scrollTop());
                                redisplaySparklines();
                                _.defer(function(){ alnA_seqs.on('scroll',scrollA);});
		},throttleSpeed);
	
		alnA_seqs.on('scroll',scrollA);
		alnB_seqs.on('scroll',scrollB);
		
                progress();
                var distVisHandler = function () {
			$("#distanceVisualizationType option:selected").each(function () {
				var visType=$(this).val();
                                //console.log(visType);
                                $("#seqColour").attr('href','css/'+visType+'.css');
				
				});
			};
                distVisHandler();
		$("#distanceVisualizationType").change(distVisHandler);
                progress();

	$("#homologyType").change(function () {
			
			homType=parseInt($(this).val());
                        var deferred=function(){
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
                        }
			
                        if (useWorkers && (def[homType].state()!="resolved")){
                                $("#dialogtext").html("Calculating distances...");
                                dialogBox.open();
                                def[homType].done(function(){
                                        console.log(distances.character);
                                        dialogBox.close();
                                        deferred();
                                });
                        }else {
                                deferred();
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
                otherHeight-=alnA_seqs.outerHeight(true);                                                                                                
                otherHeight-=alnB_seqs.outerHeight(true);                                                                                                
               
                //output at bottom
                otherHeight+=$("#output table").outerHeight(true);

                var targetHeight = (height-otherHeight)/2;
                alnA_seqs.css("height",targetHeight);
                alnA_names.css("height",targetHeight);
                alnB_seqs.css("height",targetHeight);
                alnB_names.css("height",targetHeight);
                /*
                var height=$("#alnA_Y").height();
                var scale=targetHeight/height;
                var transform="scale(1,"+scale+")";
                $("#alnA_Y").css("margin-top",((targetHeight-height)/2)+"px");
                $("#alnA_Y").css("-webkit-transform-style","flat");
                $("#alnA_Y").css("transform",transform);
                $("#alnB_Y").css("margin-top",((targetHeight-height)/2)+"px");
                $("#alnB_Y").css("-webkit-transform",transform);
                $("#alnB_Y").css("transform",transform);
                */
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
}
redisplaySparklines = _.throttle(doRedisplaySparklines,1000);
function doRedisplaySparklines(){
        console.log("distance " + sparklineDistanceType);
        applyColumnDist(colDistA,alnADensity,$("#alnA_seqs"),$("#alnA_sparkline"),$("#alnA_seqs").width(),sparklineDistanceType);
        console.log("foo");
        applyColumnDist(colDistB,alnBDensity,$("#alnB_seqs"),$("#alnB_sparkline"),$("#alnB_seqs").width(),sparklineDistanceType);
        console.log("foo");
        /*

        var range = visibleRange($("#alnA_seqs"),alnA[0].content.length,alnA.length);                                                              
        console.log(range);
        var alnAY=$("#alnA_Y");
        var alnBY=$("#alnB_Y");
        alnAY.empty();
        alnBY.empty();
        alnAY.css("height",distances.sequence[homType].length+"px");
        alnBY.css("height",distances.sequence[homType].length+"px");
        for (var i=0; i < distances.sequence[homType].length; i++){
                var h = "1px";//100/distances.sequence[homType].length + "%";
                if (i>=range[3] && i<=range[5]){
                        alnAY.append($("<div class='bar-selected'/>").css("width",distances.sequence[homType][i]*100+"%").css("height",h));
                        alnBY.append($("<div class='bar-selected'/>").css("width",distances.sequence[homType][i]*100+"%").css("height",h));
                }else {
                        alnAY.append($("<div class='bar'/>").css("width",distances.sequence[homType][i]*100+"%").css("height",h));
                        alnBY.append($("<div class='bar'/>").css("width",distances.sequence[homType][i]*100+"%").css("height",h));
                }
        }
        */
}


function recalculateMinilines(){
       var t1 = new Date();
       var tags=$("div#visualiser").find("div.miniline").each(function(x,elem){
               var i = elem.id.replace("miniline_","");
               var target=$(elem);
               target.css("width","30%");
               target.html("<img src='png/"+Math.floor(distances.sequence[homType][i]*100)+".png' title='"+distances.sequence[homType][i]+"' height='10px' style='max-width:100%'/>")
       });
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
