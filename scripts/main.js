class Bead {
	constructor () {
		this._name = null;
		this.atoms = [];
	}

	indexOf(atom) {
	    if (this.atoms.length > 0) {
            for (var i=0; i < this.atoms.length; i++) {
                if (this.atoms[i].index == atom.index) {
                    return i;
                }
            }
        }
		return -1;
	}

	addAtom(atom) {
		if (!this.isAtomIn(atom)) {
			this.atoms.push(atom);
		}
	}

	removeAtom(atom) {
	    var atomIndex = this.indexOf(atom);
	    if (atomIndex >= 0) {
	        this.atoms.splice(atomIndex, 1);
	    }
	}

	toggleAtom(atom) {
	    if (this.isAtomIn(atom)) {
	        this.removeAtom(atom);
	    } else {
	        this.addAtom(atom);
	    }
	}

	set name(name) {
		this._name = name;
	}

	get name() {
		return this._name;
	}

	get resname() {
	    if (this.atoms.length < 1) {
	        return 'UNK';
        }
	    return this.atoms[0].resname;
    }

	get resid() {
	    if (this.atoms.length < 1) {
	        return 0;
        }
	    return this.atoms[0].resno;
    }

	isAtomIn(atom) {
		return this.indexOf(atom) >= 0;
	}

	get center() {
	    var mass = 0;
	    var position = new NGL.Vector3(0, 0, 0);
	    for (atom of this.atoms) {
	        mass += 1;
	        position.add(atom.positionToVector3());
	    }
	    position.divideScalar(mass);
	    return position;
	}
}


class BeadCollection {
    constructor () {
        this._beads = [];
        this._current = null;
        this._largestIndex = -1;
        this.newBead();
    }

    newBead () {
        var bead = new Bead();
        this._largestIndex += 1;
        bead.name = 'BEAD' + this._largestIndex;
        this._beads.push(bead);
        this._current = bead;
        return bead;
    }

    removeBead(index) {
        this._beads.splice(index, 1);
    }

    get currentBead() {
        return this._current;
    }

    get beads() {
        return this._beads;
    }

    selectBead(index) {
        this._current = this._beads[index];
    }
}


class Vizualization {
    constructor(collection, stage) {
        this.collection = collection;
        this.representation = null;
        this.stage = stage;
        this.shapeComp = null;
        this.showCG = false;
        var toggleCG = document.getElementById('toggle-cg');
        toggleCG.onclick = (event) => this.onToggleCG(event);
        toggleCG.disabled = false;
    }

	get currentBead() {
	    return this.collection.currentBead;
	}

    attachRepresentation(component) {
        this.representation = component.addRepresentation(
	        "ball+stick",
	        {
	            sele: "not all",
	            radiusScale: 1.6,
	            color: "#f4b642",
	            opacity: 0.6
	        },
	    );
    }

    attachAALabels(component) {
        this.aa_labels = component.addRepresentation(
            "label",
            {
                labelType: "atomname",
            },
        );

        var buttons = document.getElementsByClassName("toggle-aa-labels");
        for (button of buttons) {
            button.disabled = false;
            button.onclick = (event) => this.onToggleAALabels(event);
        }
    }

    onToggleCG(event) {
        this.showCG = (! this.showCG);
        this.drawCG();
    }

    onToggleAALabels(event) {
        var visible = ! this.aa_labels.visible;
        this.aa_labels.setVisibility(visible);
        if (visible) {
            var text = 'Hide labels';
        } else {
            var text = 'Show labels';
        }
        var buttons = document.getElementsByClassName("toggle-aa-labels");
        for (button of buttons) {
            button.textContent = text;
        }
    }

    onClick(pickingProxy) {
    	// pickingProxy is only defined if the click is on an atom.
    	//We do not want to do anything if tere is no atom selected.
    	if (pickingProxy && pickingProxy.atom) {
			this.currentBead.toggleAtom(pickingProxy.atom);
            this.updateSelection();
		}
	}

	onNewBead(event) {
	    this.collection.newBead();
	    this.updateSelection();
	}

	onBeadSelected(event) {
	    if (! event.target.classList.contains('bead-name')) {
            var realTarget = findParentWithClass(event.target, "bead-view");
            var nodes = document.getElementById("bead-list").childNodes;
            var index = 0;
            var child;
            for (child of nodes) {
                if (child === realTarget) {
                    this.collection.selectBead(index);
                }
                index += 1;
            }
            this.updateSelection();
        }
	}

	onBeadRemove(event) {
        var realTarget = findParentWithClass(event.target, "bead-view");
        var nodes = document.getElementById("bead-list").childNodes;
        var index = 0;
        var child;
        var selected = -1;
        for (child of nodes) {
            if (child === realTarget) {
                selected = index;
                break;
            }
            index += 1;
        }
        if (selected >= 0) {
            this.collection.removeBead(selected);
            if (this.collection.beads.length == 0) {
                this.collection.newBead();
            }
            if (realTarget.classList.contains('selected-bead')) {
                this.collection.selectBead(0);
            }
        }

        this.updateSelection();
    }

    onNameChange(event) {
        var realTarget = findParentWithClass(event.target, "bead-view");
        var nodes = document.getElementById("bead-list").childNodes;
        var index = 0;
        var child;
        for (child of nodes) {
            if (child === realTarget) {
                this.collection.beads[index].name = event.target.value;
            }
            index += 1;
        }
        this.updateName();
    }

	selectionString(bead) {
        if (bead.atoms.length > 0) {
            var sel = "@";
            for (var i=0; i < bead.atoms.length; i++) {
                if (sel != '@') {
                    sel = sel + ',';
                }
                sel = sel + bead.atoms[i].index;
            }
            return sel;
        }
        return "not all";
    }

    updateName() {
        this.updateNDX();
        this.updateMap();
        this.updateGRO();
        this.drawCG();
    }

    updateSelection() {
        var selString = this.selectionString(this.currentBead);
        this.representation.setSelection(selString);
        this.clearBeadList();
        this.createBeadList();
        this.updateName();
    }

    createBeadListItem(bead) {
        var textNode;
        var list = document.getElementById("bead-list");
        var item = document.createElement("li");

        // Remove button
        var removeNode = document.createElement("button");
        textNode = document.createTextNode("X");
        removeNode.appendChild(textNode);
        removeNode.onclick = (event) => this.onBeadRemove(event);
        item.appendChild(removeNode);

        // Name entry
        var formNode = document.createElement("form");
        formNode.onsubmit = function() {return false};  // Prevent reload on "submission"
        var nameNode = document.createElement("input");
        nameNode.setAttribute("type", "text");
        nameNode.setAttribute("value", bead.name);
        nameNode.classList.add("bead-name");
        nameNode.oninput = (event) => this.onNameChange(event);
        formNode.appendChild(nameNode);
        item.appendChild(formNode);

        // Atom list
        var nameList = document.createElement("ul");
        var subitem;
        if (bead.atoms.length > 0) {
            for (var i=0; i < bead.atoms.length; i++) {
                subitem = document.createElement("li");
                textNode = document.createTextNode(bead.atoms[i].atomname);
                subitem.appendChild(textNode);
                nameList.appendChild(subitem);
            }
        }
        item.appendChild(nameList);

        item.onclick = (event) => this.onBeadSelected(event);
        item.classList.add("bead-view");
        if (bead === this.currentBead) {
            item.classList.add("selected-bead");
        }
        list.appendChild(item);
    }

    createBeadList() {
        for (var bead of this.collection.beads) {
            this.createBeadListItem(bead);
        }
    }

    clearBeadList() {
        var list = document.getElementById('bead-list');
        while (list.lastChild) {
            list.removeChild(list.lastChild);
        }
    }

    updateNDX() {
        var displayNode = document.getElementById('ndx-output');
        displayNode.textContent = generateNDX(this.collection);
    }

    updateMap() {
        var displayNode = document.getElementById('map-output');
        displayNode.textContent = generateMap(this.collection);
    }

    updateGRO() {
        var displayNode = document.getElementById('gro-output');
        displayNode.textContent = generateGRO(this.collection);
    }

    drawCG() {
        var normalColor = [0.58, 0.79, 0.66];
        var selectedColor = [0.25, 0.84, 0.96];
        var color = normalColor;
        var opacity = 0.2;
        if (this.showCG) {
            opacity = 1;
        }
        if (this.shapeComp != null) {
            this.stage.removeComponent(this.shapeComp);
        }
        var shape = new NGL.Shape("shape");
        for (var bead of this.collection.beads) {
            color = normalColor;
            if (bead === this.currentBead) {
                color = selectedColor;
            }
            if (bead.atoms.length > 0) {
                shape.addSphere(bead.center, color, 1.12, bead.name);
            }
        }
        this.shapeComp = this.stage.addComponentFromObject(shape);
        this.shapeComp.addRepresentation("buffer", {opacity: opacity});
    }
}


function findParentWithClass(element, className) {
    var node = element;
    while (node) {
        if (node.classList.contains(className)) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}


function generateNDX(collection) {
    var ndx = "";
    for (bead of collection.beads) {
        ndx += "[ " + bead.name + " ]\n";
        for (atom of bead.atoms) {
            ndx += (atom.index + 1) + " ";
        }
        ndx += "\n\n";
    }
    return ndx;
}


function generateMap(collection) {
    var output = "[ to ]\nmartini\n\n[ martini ]\n";
    var atomToBeads = {};
    var atoms = [];
    var atomname;
    var index;
    for (bead of collection.beads) {
        output += bead.name + " ";
        for (atom of bead.atoms) {
            atomname = atom.atomname;
            if (!atomToBeads[atomname]) {
                atomToBeads[atomname] = [];
                atoms.push(atom);
            }
            atomToBeads[atomname].push(bead.name);
        }
    }
    output += "\n\n";

    output += "[ atoms ]\n";
    index = 0;
    atoms.sort(function(a, b) {return a.index - b.index});
    for (atom of atoms) {
        index += 1;
        output += index + "\t" + atom.atomname;
        for (bead of atomToBeads[atom.atomname]) {
            output += "\t" + bead;
        }
        output += "\n";
    }

    return output;
}


function generateGRO(collection) {
    var resid = "    0";
    var resname = "";
    var atomname = "    0";
    var atomid = 0;
    var x;
    var y;
    var z;
    var center;
    var output = "Generated with cgbuilder\n" + collection.beads.length + "\n";
    var counter = 0;
    for (bead of collection.beads) {
        counter += 1;
        resid = new String(bead.resid).padStart(5);
        atomid = new String(counter).padStart(5);
        resname = bead.resname.padEnd(5);
        atomname = bead.name.padStart(5);
        center = bead.center;
        x = (center.x / 10).toFixed(3).padStart(8);
        y = (center.y / 10).toFixed(3).padStart(8);
        z = (center.z / 10).toFixed(3).padStart(8);
        output += resid + resname + atomname + atomid + x + y + z + '\n';
    }
    output += "10 10 10";
    return output;
}


function loadMolecule(event, stage) {
    // Clear the stage if needed
    stage.removeAllComponents();
    stage.signals.clicked.removeAll();
    // Setup the model
    var collection = new BeadCollection();
    // Setup the interface
    var vizu = new Vizualization(collection, stage);
    // Load the molecule
    var input = event.target.files[0]
	stage.loadFile(input).then(function (component) {
	    component.addRepresentation("ball+stick");
	    component.autoView();
	    vizu.attachAALabels(component);
	    vizu.attachRepresentation(component);
	    vizu.updateSelection();
	});
    // Bing the new bead buttons.
    var buttons = document.getElementsByClassName("new-bead");
    for (button of buttons) {
        button.onclick = (event) => vizu.onNewBead(event);
        button.disabled = false;
    }
	// Bind our own selection beheviour.
    // We need to use the "arrow" function so that `this` is defined and refer
    // to the right object in the `onClick` method. See
    // <https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback>.
    stage.signals.clicked.add((pickingProxy) => vizu.onClick(pickingProxy));
}

function main() {
    // Create NGL Stage object
    var stage = new NGL.Stage( "viewport" );

    // Handle window resizing
    window.addEventListener( "resize", function( event ){
        stage.handleResize();
    }, false );

	var mol_select = document.getElementById("mol-select");
	mol_select.onchange = (event) => loadMolecule(event, stage);
	
	// Remove preset action on atom pick.
	// As of NGL v2.0.0-dev.11, the left click atom pick is binded to the
	// centering of the view on the selected atom. In previous versions, this
	// behavior was linked on shift-click, instead.
	stage.mouseControls.remove("clickPick-left");

    var buttons = document.getElementsByClassName("new-bead");
    for (button of buttons) {
        button.disabled = true;
    }
}

window.onload = main;
