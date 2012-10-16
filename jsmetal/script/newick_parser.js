//methods on Nodes
function Node(){
}

Node.prototype.isRoot=function(){
        return ((typeof this.parent) === 'undefined');
}
Node.prototype.isLeaf=function(){
        return ((typeof this.children) === 'undefined' || this.children.length==0);
}
Node.prototype.descendents=function(){
        if (this.isLeaf()){
                return [this.name];
        }else {
                return this.children.map(function(x){return x.descendents()}).reduce(function(x,y,a,b){return x.concat(y)})
        }
}
Node.prototype.splitsFor=function(gap_leaves){
        if (this.isRoot()){
                return splitsForRoot(this,gap_leaves);
        }else {
                throw new Error("Only call Node#splitsFor on the root!");
        }
}

//Dollo parsimony
//returns an object that maps from a leaf node name
//to a node that represents the split where the 1<->0 transition responsible for
//the leaf node state, iff the leaf node is in the 0 state.
function splitsForRoot(root,gap_leaves){
        var ans=splitsFor(root,gap_leaves);
        return _.reduce(ans,function(h,kv){h[kv[0]]=kv[1]; return h;},new Object()) 
}
//returns an array of format [[leaf_name,node],[leaf_name,node]..]
//where leaf_name is one of the names specified in gap_leaves
//and node is the ancestral location of the 1<->0 transition that 
//left this node in state 0 inferred by Dollo parsimony.
function splitsFor(node,gap_leaves){
        if (node.isRoot()){
                var allgappedchildren = _.filter(node.children,function(x){return _.isEmpty(_.difference(x.descendents(),gap_leaves))});
                if (allgappedchildren.length==2){
                        //handle special case of root
                        alldesc = _.chain(allgappedchildren).map(function(x){return x.descendents()}).flatten(true).value();
                        left = _.chain(allgappedchildren).map(function(x){return x.descendents()}).flatten(true).map(function(x){return [x,alldesc]}).value();
                        remaining = _.difference(node.children,allgappedchildren)[0];
                        return left.concat(splitsFor(remaining,gap_leaves));
                }

        }
        var desc=node.descendents();
        if (node.isLeaf()){
                if (_.include(gap_leaves,desc[0])){
                        return [[desc[0],desc]];
                }else {
                        return [];
                }
        }else {
                if (_.isEmpty(_.difference(desc,gap_leaves))){
                        //all my descendents are gaps
                        return _.map(desc,function(x){return [x,desc]});
                }else {
                        //I have non-gap descendents, so go down the tree
                        return _.chain(node.children).map(function(x){return splitsFor(x,gap_leaves)}).flatten(true).value();
                }
        }

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
	if(newick_string[0]!="("){throw "Error: newick trees must start with an opening parenthesis: \"(\"";}
	if(newick_string[newick_string.length-1]!=";"){throw "Error: newick trees must end with a semi-colon: \";\"";}
	unmatched =0;
	for(var i=0;i<newick_string.length;i++){
		if(newick_string[i]=="("){ unmatched++;}
		if(newick_string[i]==")"){ unmatched--;}
	}	
	if( unmatched !=0){
		throw "Error: newick tree contains different number of opening and closing parentheses. ";
	}
	
	
	
	//the 'temp' object holds the parser's working memory so we don't have to pass it around while doing recursion and calling other functions
	temp = new Object();		
	temp.index = 0;			//the index of each node
	temp.cursor = 0;			//the position of the cursor
	temp.parents = new Array();	//a FILO stack to remeber the parent nodes
	
	//calling the function that decides what to do for each character.
	var nodesArray = recursiveParse(null,newick_string);
	delete temp;
	return nodesArray;
}
		
// recursiveParse
// The true parser. It's called recursively and takes the array of nodes (except the first time it's called) and the string to parse.

function recursiveParse(nodes,newick_string){
	//check if this is the first call, if so declare 'nodes'
	if(nodes == null) {
		var nodes = new Array();	
	}
	
	//look at the current character, decide what to do
	switch(newick_string[temp.cursor])
	{
		
		case "(":
			temp.cursor++;
			newNode(null,nodes,newick_string); //create a new internal node (null name)
			break;		
		case ",":
			temp.cursor++; 
			recursiveParse(nodes,newick_string); //recursion	
			break;		
		case ")":
			temp.parents.pop(); //forget latest parent
			
			temp.cursor++;
			recursiveParse(nodes,newick_string); //recursion	
			break;
		case ";":
			//we're done here
			break;
		
		default:
			//get the name.
			var name = newick_string.substring(temp.cursor).match("^[0-9A-Za-z_|]+");
			// some browsers return an array of 1 string instead of a string; this line fixes it.
			name = name instanceof Array ? name[0] : name;
			
			temp.cursor += name.length; 
			newNode(name,nodes,newick_string); //create a new leaf node
			break;
	}
	return nodes;
}

// NEWNODE
// Creates a new node, which will be a leaf node if we pass a name or an internal node if name is null.
function newNode(name,nodes,newick_string){
	
	nodes[temp.index] = new Node(); //create a new node
	
	//we do things differently if this is a leaf (i.e. named) node or a parent node.
	if(name == null) {
		nodes[temp.index].children = new Array(); //this node will have children
		nodeLinker(nodes,newick_string); //link this node to its parent
		temp.parents.push(temp.index); //add this node to the parent stack
		
	}else{
		nodes[temp.index].name = name;
		nodeLinker(nodes,newick_string); //link
	}

	temp.index++;
	recursiveParse(nodes,newick_string); //recursion
	
}

// NODELINKER
// Links the current node (temp.index) to its parent.
function nodeLinker(nodes,newick_string){
	if(temp.parents.length){
		nodes[temp.index].parent = temp.parents[temp.parents.length-1]; //tell this node about its parents
		nodes[nodes[temp.index].parent].children.push(temp.index); //tell its parent about its new child.
	}
}


//ADDITIONS

//Link up a tree's parent and children to actual nodes rather than numeric refs
function fixNode(nodes,n){
        if (n.children){
                n.children=n.children.map(function(x){return nodes[x]});
        }
        if(n.parent){
                n.parent=nodes[n.parent];
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

//enforce a bifurcating tree
function enforceBi(node){
        if (node.children){
                node.children.map(enforceBi);
        }
        if (node.children){
                if (node.children.length==2){
                        return;
                }else if(node.children.length==3 && node.isRoot()){
                        return;
                }else if (node.children.length==1){
                        //remove ourself
                        par = node.parent
                        node.children[0].parent=par;
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
                                newnode.parent = node;
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
        newchild.parent=newroot;
        newroot.parent=undefined;
        return newroot;
}

//convert array of nodes into tree structure
function makeTree(nodes){
        var n = getRoot(nodes.map(function(x){return fixNode(nodes,x)}));
        enforceBi(n);
        return unroot(n);
}

