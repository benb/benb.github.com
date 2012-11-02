try{
        importScripts('http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.3.3/underscore-min.js');                                                              
}catch(e){
}
//methods on Nodes
function Node(){
}

Node.prototype.isRoot=function(){
        return ((typeof this.nodeparent) === 'undefined');
}
Node.prototype.isLeaf=function(){
        return ((typeof this.children) === 'undefined' || this.children.length==0);
}
Node.prototype.descendents=function(){
        try{
                var stack;
                stack = nodeList(this);
                var desc=[];
                for (i=0; i < stack.length; i++){
                        if (stack[i].isLeaf()){
                                desc.push(stack[i].name);
                        }
                }
                return desc;
        }catch (e){
                throw("WTF!");
        }

        //    var desc= _.filter(stack,function(x){return x.isLeaf()});
        //        return _.map(desc,function(x){return x.name});
}
Node.prototype.allSplits=function(){
        var allLeaves = this.descendents().sort();
        var stack;
        stack=nodeList(this);
        var splits=[];
        for (var i=0; i < stack.length; i++){
                if (stack[i].isLeaf()){
                        splits.push([[stack[i].name],_.without(allLeaves,stack[i].name).sort()]);
                }else{
                        var d = stack[i].descendents().sort();
                        splits.push([d,_.difference(allLeaves,d).sort()]);
                }
        }
        return splits.sort();
}
Node.prototype.splitsIDs=_.memoize(function(){
        var splits = this.allSplits();
        var splitId={};
        var i=0;
        _.each(splits,function(spl){
                splitId[spl[0]]=i;
                splitId[spl[1]]=i;
                i++;
        });
        return splitId;
});

Node.prototype.splitsFor=function(gap_leaves){
        var splitID=this.splitsIDs();
        if (this.isRoot()){
                var list = splitsForRoot(this,gap_leaves);
                _.chain(list).keys().each(function(x){
                       list[x]=splitID[list[x].sort()];
                });
                return list;
        }else {
                throw new Error("Only call Node#splitsFor on the root!");
        }
}
var c=0;
Node.prototype.findNodeWithNoneDesc=function(desc){
        if (_.difference(this.descendents(),desc).length==this.descendents().length){
                return this;
        }else if (this.children){
                for (var i=0; i < this.children.length; i++){
                        var potential=this.children[i].findNodeWithNoneDesc(desc);
                        if (potential){
                                return potential;
                        }
                }
        }
        return null;
}
//copy this and attach as child of node
Node.prototype.downCopy=function(node){
        var stack=nodeList(this);
        var stackH=[];
        _.each(stack,function(x){
                var copy=new Node();
                if (x.name){
                        copy.name=x.name;
                }
                copy.id=x.id;
                stackH[copy.id]=copy;
        });

        _.each(stack,function(x){
                var copy=stackH[x.id];
                if (x.nodeparent){
                        copy.nodeparent=stackH[x.nodeparent.id];
                }
                if (x.children){
                        copy.children=[];
                        _.each(x.children,function(y){
                                copy.children.push(stackH[y.id]);
                        });
                }
        });
        stackH[this.id].nodeparent=node;
        node.children.push(stackH[this.id]);
}
var c=0;
Node.prototype.upCopy=function(newX,oldX){
       var newY = new Node();
       newY.name=this.name;
       newY.id=this.id;
       newY.children=[];
       newY.nodeparent=newX;
       newX.children.push(newY);
       _.chain(this.children).filter(function(x){return !(x===oldX)}).each(function(x){x.downCopy(newY)});
       if (this.nodeparent){
               this.nodeparent.upCopy(newY,this);
       }
}
Node.prototype.rootedCopy=function(){
        var copy = new Node();
        copy.name=this.nodeparent.name;
        copy.id=this.nodeparent.id;
        copy.children=[];
        _.each(this.nodeparent.children,function(x){x.downCopy(copy)});
        if(this.nodeparent.nodeparent){
                this.nodeparent.nodeparent.upCopy(copy,this.nodeparent);
        }
        //now copy is trifucated but with one branch at root to specified node
        //this is enough for our purposes
        return copy;
}



var c =0;
var throwit= function(gap_leaves,ans){
    //    if (gap_leaves.length==2){
        if(false){
                throw(gap_leaves.join(":") + " \n " + ans.join(" - "));
        }
}

//Dollo parsimony
//returns an object that maps from a leaf node name
//to a node that represents the split where the 1<->0 transition responsible for
//the leaf node state, iff the leaf node is in the 0 state.
function splitsForRoot(root,gap_leaves){
        var ans=splitsForX(root,gap_leaves);
        throwit(gap_leaves,ans);
        return _.reduce(ans,function(h,kv){h[kv[0]]=kv[1]; return h;},new Object()) 
}
//returns an array of format [[leaf_name,node],[leaf_name,node]..]
//where leaf_name is one of the names specified in gap_leaves
//and node is the ancestral location of the 1<->0 transition that 
//left this node in state 0 inferred by Dollo parsimony.


function splitsForX(root,gap_leaves){
        var newRootLoc=root.findNodeWithNoneDesc(gap_leaves);
        var newRoot=newRootLoc.rootedCopy();
        root=newRoot;
        var goodNodes = new Object();
        var gapL = new Object();
        var descNames = new Object();
        var stack = nodeList(root).reverse();
        _.each(stack,function(x){
                var a;
                        a = x.descendents();
                try{
                        descNames[x.id]=a;
                }catch(e){
                        throw(a);
                }
        });
        _.each(gap_leaves,function(x){
                gapL[x]=1;
        });

        for (var i=0; i < stack.length; i++){ 
                var node = stack[i];
                if (!node.children || node.children.length==0){
                        if (gapL[node.name]==1){
                                goodNodes[node.id]=1;
                        }
                }else {
                        var good=true;
                        
                        _.each(node.children,function(x){
                                if (!goodNodes[x.id]){
                                        good=false;
                                }
                        });
                        if (good){
                                _.each(node.children,function(x){
                                        delete goodNodes[x.id];
                                });
                                goodNodes[node.id]=1;
                        }

                }
        }
        var ans = [];
        var finNodes = _.filter(stack,function(x){
                return goodNodes[x.id];
        });

        var skipparent=false;
        _.each(finNodes,function(x){
                var desc = descNames[x.id];
                if (x.nodeparent===root){
                        //special handling for root
                        if (!skipparent){
                                skipparent=true;
                                firstLevel =  _.chain(finNodes).filter(function(y){return (y.nodeparent===root && !(x===y))}).value();
                                while (firstLevel.length>0){
                                        desc=desc.concat(descNames[firstLevel.pop().id]);
                                }
                                _.each(desc,function(x){
                                        ans.push([x,desc]);
                                });
                        }
                }else {
                        //make the list
                        _.each(desc,function(x){
                                ans.push([x,desc]);
                        });
                }
        });
        return ans;
}



Array.prototype.difference=function(other){
        return this.filter(function(x){return other.indexOf(x)>-1})
}
//convert to newick string
Node.prototype.toString=function(){
        if (this.children){
                childstr=("(" + this.children.map(function(s){return s.toString()}).join() + ")");
                if (this.isRoot()){
                        return childstr + ";";
                }else {
                        return childstr;
                }
        }else {
                return this.name;
        }
}


// PARSENEWICKSTRING
// Actually a wrapper for the true parser, to set up the environment and clear up afterwards
function parseNewickString(newick_string){
	
	//remove node names and distances if present;
	newick_string=newick_string.replace(/:[^),;]*/g, ""); //remove colons and everything following them until we reach a ")", a "," or a ";".
	newick_string=newick_string.replace(/\)[^),;]*/g, ")"); //remove anything following a ")" until we reach another ")",a "," or a ";".
	
	//Sanity check
	if(newick_string[0]!="("){throw "Error: newick trees must start with an opening nodeparenthesis: \"(\"";}
	if(newick_string[newick_string.length-1]!=";"){throw "Error: newick trees must end with a semi-colon: \";\"";}
	unmatched =0;
	for(var i=0;i<newick_string.length;i++){
		if(newick_string[i]=="("){ unmatched++;}
		if(newick_string[i]==")"){ unmatched--;}
	}	
	if( unmatched !=0){
		throw "Error: newick tree contains different number of opening and closing nodeparentheses. ";
	}
	
	
	
	//the 'temp' object holds the parser's working memory so we don't have to pass it around while doing recursion and calling other functions
	temp = new Object();		
	temp.index = 0;			//the index of each node
	temp.cursor = 0;			//the position of the cursor
	temp.nodeparents = new Array();	//a FILO stack to remeber the nodeparent nodes
	
	//calling the function that decides what to do for each character.
	var nodesArray = basicParse(newick_string);
	delete temp;
	return nodesArray;
}
		
// The true parser. Takes the string to parse.

function basicParse(newick_string){
	//check if this is the first call, if so declare 'nodes'
	if(nodes == null) {
		var nodes = new Array();	
	}
	
	//look at the current character, decide what to do
        while(newick_string[temp.cursor]!=";"){
	switch(newick_string[temp.cursor])
	   {
		
		case "(":
			temp.cursor++;
			newNode(null,nodes,newick_string); //create a new internal node (null name)
			break;		
		case ",":
			temp.cursor++; 
			break;		
		case ")":
			temp.nodeparents.pop(); //forget latest nodeparent
			temp.cursor++;
			break;
		case ";":
			//we're done here
			break;
		
		default:
			//get the name.
			var name = newick_string.substring(temp.cursor).match("^[0-9A-Za-z_|/\\.-]+");
			// some browsers return an array of 1 string instead of a string; this line fixes it.
			name = name instanceof Array ? name[0] : name;
			
			temp.cursor += name.length; 
			newNode(name,nodes,newick_string); //create a new leaf node
			break;
           }
        }
	return nodes;
}

// NEWNODE
// Creates a new node, which will be a leaf node if we pass a name or an internal node if name is null.
function newNode(name,nodes,newick_string){
	
	nodes[temp.index] = new Node(); //create a new node
	
	//we do things differently if this is a leaf (i.e. named) node or a nodeparent node.
	if(name == null) {
		nodes[temp.index].children = new Array(); //this node will have children
		nodeLinker(nodes,newick_string); //link this node to its nodeparent
		temp.nodeparents.push(temp.index); //add this node to the nodeparent stack
		
	}else{
		nodes[temp.index].name = name;
		nodeLinker(nodes,newick_string); //link
	}

	temp.index++;
	
}

// NODELINKER
// Links the current node (temp.index) to its nodeparent.
function nodeLinker(nodes,newick_string){
	if(temp.nodeparents.length){
		nodes[temp.index].nodeparent = temp.nodeparents[temp.nodeparents.length-1]; //tell this node about its nodeparents
		nodes[nodes[temp.index].nodeparent].children.push(temp.index); //tell its nodeparent about its new child.
	}
}


//ADDITIONS

//Link up a tree's parent and children to actual nodes rather than numeric refs
function fixNode(nodes,n){
        if (n.children){
                n.children=n.children.map(function(x){return nodes[x]});
        }
        if(n.nodeparent || n.nodeparent==0){
                n.nodeparent=nodes[n.nodeparent];
        }
        return n;
}

//return the first node in an array that matches isRoot()
function getRoot(nodes){
        for (var i=0; i < nodes.length; i++){
                var node=nodes[i];
                if(node.isRoot()){
                        return node;
                }
        }
}

function nodeList(node){
        var stack=[];
        stack.push(node);
        var pos=0;
        while (pos < stack.length){
                if (stack[pos].children){
                        var children = stack[pos].children;
                        for (var i=0; i < children.length; i++){
                                stack.push(children[i]);
                        }
                }
                pos=pos+1;
        }
        return stack;
}
//enforce a bifurcating tree
function enforceBi(node){
        stack=nodeList(node)[0];
        for (var i=stack.length-1; i >= 0; i--){
                doEnforceBi(stack[i]);
        }
}
function doEnforceBi(node){
        if (node.children){
                if (node.children.length==2){
                        return;
                }else if(node.children.length==3 && node.isRoot()){
                        return;
                }else if (node.children.length==1){
                        //remove ourself
                        par = node.nodeparent
                        node.children[0].nodeparent=par;
                        for (var i=0; i < par.children.length; i++){
                                if (par.children[i]==this){
                                        par.children[i]=node.children[0];
                                }
                        }
                        return;
                }else {
                        while(node.children.length>2){
                                var newnode=new Node();
                                newnode.children=node.children.slice(0,2);
                                newnode.nodeparent = node;
                                node.children[1]=newnode; //overwrite child 1 and...
                                node.children.shift(); // drop child 0
                        }
                        return;
                }
        }
}

//unroot a bifurcating tree 
function unroot(root){
        if (root.children.length==3){
                return root;
        }
        if (root.children.length!=2){
                throw new Error("Tree is neither already rooted or bifurcating");
        }
        if (root.children[0].isLeaf){
                newroot = root.children[1];
                newchild = root.children[0];
        }else {
                newroot = root.children[0];
                newchild = root.children[1];
        }
        newroot.children.push(newchild);
        newchild.nodeparent=newroot;
        newroot.nodeparent=undefined;
        return newroot;
}

//convert array of nodes into tree structure
function makeTree(nodes){
        var n = getRoot(nodes.map(function(x){return fixNode(nodes,x)}));
        enforceBi(n);
        n=unroot(n);
        return numberNodes(n);
}

function numberNodes(n){
        stack = nodeList(n);
        var id=0;
        _.each(stack,function(x){
                x.id=id;
                id++;
        });
        return n;
}

