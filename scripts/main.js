class Bead {
	constructor () {
		this._name = null;
		this.atoms = [];
	}

	addAtom(atom) {
		if (!this.isAtomIn(atom)) {
			this.atoms.push(atom);
		}
	}

	set name(name) {
		this._name = name;
	}

	get name() {
		return this._name;
	}

	isAtomIn(atom) {
		for (var i=0; i < this.atoms.length; i++) {
			if (this.atoms[i].index == atom.index) {
				return true;
			}
		}
		return false;
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
        } else {
            return "";
        }
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
    	if (pickingProxy) {
			currentBead.addAtom(pickingProxy.atom);
			currentRepresentation.setSelection(currentBead.selectionString);
			console.log(currentBead.atoms.length);
		}
    });
}

window.onload = main;
