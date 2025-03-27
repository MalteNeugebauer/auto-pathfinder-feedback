/* USE WEBPACK TO COMPILE */

var ed = require('edit-distance');

// Following functions define the compare process.
var insert, remove, update;
insert = remove = function(node) { return 1; };
update = function(nodeA, nodeB) { return nodeA.id !== nodeB.id ? 1 : 0; };
var children = function(node) { return node.children; };

// This is the way how two trees have to be defined to be comparable:
/*var rootA = {id: 1, children: [{id: 2}, {id: 3}]};
var rootB = {id: 1, children: [{id: 4}, {id: 3}, {id: 5}]};*/

//After fetching the data, "sqrt" etc. have to be converted to to strings with regex. In Python: trees_text=re.sub("\n","",trees_text0); converted= re.sub(r'(?<!")\b([a-zA-Z]+)\b(?!")', r'"\1"', trees_text);

//This is how inputs are defined by Saburo Higuchi, Yasuyuki Nakamura and team.
var input_list = [
    ["/",["+",["c"],["1"]],["c"]],
    ["/",["+",["c"],["-3"]],["c"]],
    ["-",["/",["+",["c"],["1"]],["c"]]],
    ["/",["+",["c"],["3"]],["c"]],
    ["/",["+",["c"],["-3"]],["c"]],
    ["/",["+",["c"],["-3"]],["c"]],
    ["1"],
    ["/",["+",["c"],["-3"]],["c"]],
    ["/",["+",["c"],["-3"]],["c"]]
]

//For the edit-distance js library, we have to adapt these trees as follows.
function adapt(orig_node) {
    if(Array.isArray(orig_node[0])) {
        return false;
    }
    let temp_node = {id: orig_node[0]};
    let remaining_nodes = orig_node.slice(1);
    if(remaining_nodes.length > 0) {
        temp_node.children = [];
        for(let i in remaining_nodes) {
            temp_node.children.push(adapt(remaining_nodes[i]));
        }
    }
    return temp_node;
}

//let adapted_list = input_list.map(adapt)

function string_to_tree(tree_as_string) {
    let tree = {};
    try {
        tree = JSON.parse(tree_as_string)
    }
    catch(error) {
        console.log(error);
        console.log("An error occured. The distance is probably wrong as at least one tree is empty due to error detection.");

        /* Don't show error in production mode */
        /*
        let errorNode = document.createElement("div");
        errorNode.innerHTML = "An error occured. The distance is probably wrong.";
        tans_tree_as_string.parentNode.appendChild(errorNode);
        */
    }
    return tree;    
}

function getTEDFeedback() {
    let tans_tree_elems = document.querySelectorAll(".maxima-code-output.mco-teacher");
    let sans_tree_as_string = document.querySelector(".maxima-code-output.mco-student");

    let tans_trees_as_string = [];
    for(let i=0;i<tans_tree_elems.length;i++) {
        tans_trees_as_string.push(tans_tree_elems[i].innerHTML);
    }
    //let tans_trees_as_string = tans_tree_elems.map(function(elem) {return elem.innerHTML; });
    console.log(tans_trees_as_string);
    let tans_trees = tans_trees_as_string.map(string_to_tree);
    console.log(tans_trees);
    let sans_tree = string_to_tree(sans_tree_as_string.innerHTML);
    console.log(sans_tree);

    let tans_trees_adapted = tans_trees.map(adapt);
    let sans_tree_adapted = adapt(sans_tree);
    let one_tree_adapted = adapt(["1"]);

    let teds = [];
    let relteds = [];
    let onlyOneInput = false;
    for(let i=0;i<tans_trees_adapted.length;i++) {
        let tedObject = ed.ted(sans_tree_adapted, tans_trees_adapted[i], children, insert, remove, update);
        if(tedObject == undefined || tedObject.distance == undefined) {
            continue;
        }
        let tedObjectOne = ed.ted(one_tree_adapted, tans_trees_adapted[i], children, insert, remove, update);
        if(tedObjectOne == undefined || tedObjectOne.distance == undefined || tedObjectOne.distance <= 0) {
            continue;
        }

        if(tedObjectOne.distance == 1) {
            onlyOneInput = true;
            break;
        }
        
        teds.push(tedObject.distance);
        relteds.push(tedObject.distance / tedObjectOne.distance);
    }


    // Don't give TED feedback, if no distances could be computed or a single number is a possible answer.
    if(teds.length > 0 && onlyOneInput == false) {
        let feedbackType = "abs";
        let distFeedbackTypeNode = document.querySelector(".maxima-code-output.mco-ted-feedback");
        if(distFeedbackTypeNode != undefined && distFeedbackTypeNode.classList.contains("mco-ted-rel")) {
            feedbackType = "rel";
        }

        let distFeedbackNode = document.querySelector(".maxima-code-output.mco-ted-feedback");
        if(distFeedbackNode == undefined) {
            distFeedbackNode = document.createElement("div");
            sans_tree_as_string.parentNode.appendChild(distFeedbackNode);
        }
        let text = "";

        if(feedbackType == "abs") {
            // Choose the smallest distance for the feedback
            let ted = Math.min(...teds);
            if(ted > 0) {
                
                //distFeedbackNode.innerHTML = "Distance: "+ted.distance;
                text = "To solve this, "+ted+" thing"+(ted == 1 ? "" : "s")+" need"+(ted == 1 ? "s" : "")+" to be changed.";
                //text = "Zur L&ouml;sung "+(ted == 1 ? "muss" : "m&uuml;ssen")+" noch "+(ted == 1 ? "eine" : ted)+" &Auml;nderung"+(ted == 1 ? "" : "en")+" ge&auml;ndert werden.";

            }
            //console.log(ted.distance);
            console.log(ted);
            //console.log(ted.alignment());
            /*for(let i in adapted_list) {
                var ted = ed.ted(adapted_list[i], adapted_list[0], children, insert, remove, update);
                console.log(ted.distance);
            }*/
        }
        else {
            let ted = Math.min(...relteds);
            let tedAsRevertedPercentNum = Math.round((1-ted)*100);
            console.log(tedAsRevertedPercentNum);
            if(tedAsRevertedPercentNum > 0) {
                text = "Your input matches the solution by "+tedAsRevertedPercentNum+"%.";
                //text = "Deine Eingabe stimmt zu "+tedAsRevertedPercentNum+"% mit der L&ouml;sung &uuml;berein."
            }
        }
        distFeedbackNode.innerHTML = text;
    }
}


document.addEventListener("DOMContentLoaded", function() {
    getTEDFeedback();
});


//Fetch the trees as JSON string from the feedback block.


// Compute edit distance, mapping, and alignment.
/*for(let i in adapted_list) {
    var ted = ed.ted(adapted_list[i], adapted_list[0], children, insert, remove, update);
    console.log(ted.distance);
}*/
//console.log('Tree Edit Distance', ted.distance, ted.pairs(), ted.alignment());