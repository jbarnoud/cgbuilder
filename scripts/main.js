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

	isAtomIn(atom) {
		return this.indexOf(atom) >= 0;
	}
}


class BeadCollection {
    constructor () {
        this._beads = [];
        this._current = null;
        this.newBead();
    }

    newBead () {
        var bead = new Bead();
        this._beads.push(bead);
        this._current = bead;
        return bead;
    }

    get currentBead() {
        return this._current;
    }
}


class Vizualization {
    constructor(collection) {
        this.collection = collection;
        this.representation = null;
    }

	get currentBead() {
	    return this.collection.currentBead;
	}

    attachRepresentation(component) {
        this.representation = component.addRepresentation(
	        "ball+stick",
	        {
	            sele: "not all",
	            radiusScale: 1.5,
	            color: "#f4b642",
	            opacity: 0.5
	        },
	    );
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

    updateSelection() {
        var selString = this.selectionString(this.currentBead);
        this.representation.setSelection(selString);
    }
}


function main() {
    var collection = new BeadCollection();
    var vizu = new Vizualization(collection);

    // Create NGL Stage object
    var stage = new NGL.Stage( "viewport" );

    // Handle window resizing
    window.addEventListener( "resize", function( event ){
        stage.handleResize();
    }, false );

    // Load PDB
	stage.loadFile("data/benzene_atb.pdb").then(function (component) {
	    component.addRepresentation("ball+stick");
	    vizu.attachRepresentation(component);
	});
	
	// Remove preset action on atom pick.
	// As of NGL v2.0.0-dev.11, the left click atom pick is binded to the
	// centering of the view on the selected atom. In previous versions, this
	// behavior was linked on shift-click, instead.
	stage.mouseControls.remove("clickPick-left");
	// Bind our own selection beheviour.
    // We need to use the "arrow" function so that `this` is defined and refer
    // to the right object in the `onClick` method. See
    // <https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback>.
    stage.signals.clicked.add((pickingProxy) => vizu.onClick(pickingProxy));

    // Bing the new bead buttons.
    var buttons = document.getElementsByClassName("new-bead");
    for (button of buttons) {
        button.onclick = (event) => vizu.onNewBead(event);
    }
}

window.onload = main;
