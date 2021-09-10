class Bead {
	constructor () {
		this._name = null;
		this.atoms = [];
	}

	indexOf(atom) {
	    if (this.atoms.length > 0) {
            for (let i=0; i < this.atoms.length; i++) {
                if (this.atoms[i].index === atom.index) {
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
	    let atomIndex = this.indexOf(atom);
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
	    let mass = 0;
	    let position = new NGL.Vector3(0, 0, 0);
	    for (const atom of this.atoms) {
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
        let bead = new Bead();
        this._largestIndex += 1;
        bead.name = 'B' + this._largestIndex;
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


class Visualization {
    constructor(collection, stage) {
        this.collection = collection;
        this.representation = null;
        this.stage = stage;
        this.shapeComp = null;
        this.showCG = false;
        let toggleCG = document.getElementById('toggle-cg');
        toggleCG.onclick = (event) => this.onToggleCG(event);
        toggleCG.disabled = false;
        document.getElementById('dl-ndx').onclick = (event) => {
            download('cgbuilder.ndx', generateNDX(this.collection))}
        document.getElementById('dl-map').onclick = (event) => {
            download('cgbuilder.map', generateMap(this.collection))}
        document.getElementById('dl-gro').onclick = (event) => {
            download('cgbuilder.gro', generateGRO(this.collection))}
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

        let buttons = document.getElementsByClassName("toggle-aa-labels");
        for (const button of buttons) {
            button.disabled = false;
            button.onclick = (event) => this.onToggleAALabels(event);
        }
    }

    onToggleCG(event) {
        this.showCG = (! this.showCG);
        this.drawCG();
    }

    onToggleAALabels(event) {
        let visible = ! this.aa_labels.visible;
        this.aa_labels.setVisibility(visible);
        let text;
        if (visible) {
            text = 'Hide labels';
        } else {
            text = 'Show labels';
        }
        let buttons = document.getElementsByClassName("toggle-aa-labels");
        for (const button of buttons) {
            button.textContent = text;
        }
    }

    onClick(pickingProxy) {
        // pickingProxy is only defined if the click is on an atom.
        // We do not want to do anything if there is no atom selected.
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
            let realTarget = findParentWithClass(event.target, "bead-view");
            let nodes = document.getElementById("bead-list").childNodes;
            let index = 0;
            for (const child of nodes) {
                if (child === realTarget) {
                    this.collection.selectBead(index);
                }
                index += 1;
            }
            this.updateSelection();
        }
	}

	onBeadRemove(event) {
        let realTarget = findParentWithClass(event.target, "bead-view");
        let nodes = document.getElementById("bead-list").childNodes;
        let index = 0;
        let selected = -1;
        for (const child of nodes) {
            if (child === realTarget) {
                selected = index;
                break;
            }
            index += 1;
        }
        if (selected >= 0) {
            this.collection.removeBead(selected);
            if (this.collection.beads.length === 0) {
                this.collection.newBead();
            }
            if (realTarget.classList.contains('selected-bead')) {
                this.collection.selectBead(0);
            }
        }

        this.updateSelection();
    }

    onNameChange(event) {
        let realTarget = findParentWithClass(event.target, "bead-view");
        let nodes = document.getElementById("bead-list").childNodes;
        let index = 0;
        for (const child of nodes) {
            if (child === realTarget) {
                this.collection.beads[index].name = event.target.value;
            }
            index += 1;
        }
        this.updateName();
    }

	selectionString(bead) {
        if (bead.atoms.length > 0) {
            let sel = "@";
            for (let i=0; i < bead.atoms.length; i++) {
                if (sel !== '@') {
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
        let selString = this.selectionString(this.currentBead);
        this.representation.setSelection(selString);
        this.clearBeadList();
        this.createBeadList();
        this.updateName();
    }

    createBeadListItem(bead) {
        let textNode;
        let list = document.getElementById("bead-list");
        let item = document.createElement("li");

        // Remove button
        let removeNode = document.createElement("button");
        textNode = document.createTextNode("X");
        removeNode.appendChild(textNode);
        removeNode.onclick = (event) => this.onBeadRemove(event);
        item.appendChild(removeNode);

        // Name entry
        let formNode = document.createElement("form");
        formNode.onsubmit = function() {return false};  // Prevent reload on "submission"
        let nameNode = document.createElement("input");
        nameNode.setAttribute("type", "text");
        nameNode.setAttribute("value", bead.name);
        nameNode.classList.add("bead-name");
        nameNode.oninput = (event) => this.onNameChange(event);
        formNode.appendChild(nameNode);
        item.appendChild(formNode);

        // Atom list
        let nameList = document.createElement("ul");
        let subitem;
        if (bead.atoms.length > 0) {
            for (let i=0; i < bead.atoms.length; i++) {
                subitem = document.createElement("li");
                textNode = document.createTextNode(bead.atoms[i].atomname);
                subitem.appendChild(textNode);
                nameList.appendChild(subitem);
            }
        }
        item.appendChild(nameList);

        item.onclick = (event) => this.onBeadSelected(event);
        item.classList.add("bead-view");
        list.appendChild(item);
        if (bead === this.currentBead) {
            item.classList.add("selected-bead");
            item.scrollIntoView(false);
        }
    }

    createBeadList() {
        for (let bead of this.collection.beads) {
            this.createBeadListItem(bead);
        }
    }

    clearBeadList() {
        let list = document.getElementById('bead-list');
        while (list.lastChild) {
            list.removeChild(list.lastChild);
        }
    }

    updateNDX() {
        let displayNode = document.getElementById('ndx-output');
        displayNode.textContent = generateNDX(this.collection);
    }

    updateMap() {
        let displayNode = document.getElementById('map-output');
        displayNode.textContent = generateMap(this.collection);
    }

    updateGRO() {
        let displayNode = document.getElementById('gro-output');
        displayNode.textContent = generateGRO(this.collection);
    }

    drawCG() {
        let normalColor = [0.58, 0.79, 0.66];
        let selectedColor = [0.25, 0.84, 0.96];
        let color = normalColor;
        let opacity = 0.2;
        if (this.showCG) {
            opacity = 1;
        }
        if (this.shapeComp != null) {
            this.stage.removeComponent(this.shapeComp);
        }
        let shape = new NGL.Shape("shape");
        for (let bead of this.collection.beads) {
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
    let node = element;
    while (node) {
        if (node.classList.contains(className)) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}


function generateNDX(collection) {
    let ndx = "";
    for (const bead of collection.beads) {
        ndx += "[ " + bead.name + " ]\n";
        for (const atom of bead.atoms) {
            ndx += (atom.index + 1) + " ";
        }
        ndx += "\n\n";
    }
    return ndx;
}


function generateMap(collection) {
    let output = "[ to ]\nmartini\n\n[ martini ]\n";
    let atomToBeads = {};
    let atoms = [];
    let atomname;
    let index;
    for (const bead of collection.beads) {
        output += bead.name + " ";
        for (const atom of bead.atoms) {
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
    for (const atom of atoms) {
        index += 1;
        output += index + "\t" + atom.atomname;
        for (const bead of atomToBeads[atom.atomname]) {
            output += "\t" + bead;
        }
        output += "\n";
    }

    return output;
}


function generateGRO(collection) {
    let resid = "    0";
    let resname = "";
    let atomname = "    0";
    let atomid = 0;
    let x;
    let y;
    let z;
    let center;
    let output = "Generated with cgbuilder\n" + collection.beads.length + "\n";
    let counter = 0;
    for (const bead of collection.beads) {
        counter += 1;
        resid = String(bead.resid).padStart(5);
        atomid = String(counter).padStart(5);
        resname = bead.resname.padEnd(5).substring(0, 5);
        atomname = bead.name.padStart(5).substring(0, 5);
        center = bead.center;
        x = (center.x / 10).toFixed(3).padStart(8);
        y = (center.y / 10).toFixed(3).padStart(8);
        z = (center.z / 10).toFixed(3).padStart(8);
        output += resid + resname + atomname + atomid + x + y + z + '\n';
    }
    output += "10 10 10\n";
    return output;
}

/* Taken from <https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server> */
function download(filename, text) {
  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}


function loadMolecule(event, stage) {
    // Clear the stage if needed
    stage.removeAllComponents();
    stage.signals.clicked.removeAll();
    // Setup the model
    let collection = new BeadCollection();
    // Setup the interface
    let vizu = new Visualization(collection, stage);
    // Load the molecule
    let input = event.target.files[0]
	stage.loadFile(input).then(function (component) {
	    component.addRepresentation("ball+stick");
	    component.autoView();
	    vizu.attachAALabels(component);
	    vizu.attachRepresentation(component);
	    vizu.updateSelection();
	});
    // Bing the new bead buttons.
    let buttons = document.getElementsByClassName("new-bead");
    for (const button of buttons) {
        button.onclick = (event) => vizu.onNewBead(event);
        button.disabled = false;
    }
	// Bind our own selection behaviour.
    // We need to use the "arrow" function so that `this` is defined and refer
    // to the right object in the `onClick` method. See
    // <https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback>.
    stage.signals.clicked.add((pickingProxy) => vizu.onClick(pickingProxy));
}

function main() {
    // Capture the wheel events within the viewer so the page does not scroll when we zoom in or out.
    // <https://github.com/nglviewer/ngl/issues/878#issuecomment-913504711>
    const stageContainer = document.getElementById('viewport');
    function maybeScroll(event) {
        if (stageContainer.contains(event.target)) {     // If wheel event occurred within the viewer
            event.preventDefault();                      // prevent the default (scrolling the page)
        }
    }
    window.addEventListener('wheel', maybeScroll, {passive: false});

    // Create NGL Stage object
    let stage = new NGL.Stage( "viewport" );

    // Handle window resizing
    window.addEventListener( "resize", function( event ){
        stage.handleResize();
    }, false );

	let mol_select = document.getElementById("mol-select");
	mol_select.onchange = (event) => loadMolecule(event, stage);
	
	// Remove preset action on atom pick.
	// As of NGL v2.0.0-dev.11, the left click atom pick is bind to the
	// centering of the view on the selected atom. In previous versions, this
	// behavior was linked on shift-click, instead.
	stage.mouseControls.remove("clickPick-left");

    let buttons = document.getElementsByClassName("new-bead");
    for (const button of buttons) {
        button.disabled = true;
    }
}

window.onload = main;