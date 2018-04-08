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

	get selectionString() {
	    if (this.atoms.length > 0) {
            var sel = "@";
            for (var i=0; i < this.atoms.length; i++) {
                if (sel != '@') {
                    sel = sel + ',';
                }
                sel = sel + this.atoms[i].index;
            }
            return sel;
        }
        return "not all";
    }
}


function main() {
    // Create NGL Stage object
    //var stage = new NGL.Stage( "viewport" );
    stage = new NGL.Stage( "viewport" );

    // Handle window resizing
    window.addEventListener( "resize", function( event ){
        stage.handleResize();
    }, false );


    //var currentBead = new Bead()
    currentBead = new Bead()

    // Load PDB entry 1CRN
    //stage.loadFile( "rcsb://1crn", { defaultRepresentation: true } );
	stage.loadFile("data/benzene_atb.pdb").then(function (component) {
	    component.addRepresentation("ball+stick");
	    component.addRepresentation(
	        "ball+stick",
	        {
	            sele: "not all",
	            radiusScale: 1.5,
	            color: "#f4b642",
	            opacity: 0.5
	        },
	    );
        currentRepresentation = stage.compList[0].reprList[1];
	});
	// Remove preset action on atom pick.
	// As of NGL v2.0.0-dev.11, the left click atom pick is binded to the
	// centering of the view on the selected atom. In previous versions, this
	// behavior was linked on shift-click, instead.
	stage.mouseControls.remove("clickPick-left");
	// Bind our own selection beheviour.
    stage.signals.clicked.add(function (pickingProxy) {
    	// pickingProxy is only defined if the click is on an atom.
    	//We do not want to do anything if tere is no atom selected.
    	if (pickingProxy && pickingProxy.atom) {
			currentBead.toggleAtom(pickingProxy.atom);
			currentRepresentation.setSelection(currentBead.selectionString);
		}
    });
}

window.onload = main;
