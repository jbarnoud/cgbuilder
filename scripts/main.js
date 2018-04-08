function main() {
    // Create NGL Stage object
    var stage = new NGL.Stage( "viewport" );

    // Handle window resizing
    window.addEventListener( "resize", function( event ){
        stage.handleResize();
    }, false );


    var beads = [];

    // Load PDB entry 1CRN
    //stage.loadFile( "rcsb://1crn", { defaultRepresentation: true } );
	stage.loadFile("data/benzene_atb.pdb", { defaultRepresentation: true } );
	// Remove preset action on atom pick.
	// As of NGL v2.0.0-dev.11, the left click atom pick is binded to the
	// centering of the view on the selected atom. In previous versions, this
	// behavior was linked on shift-click, instead.
	stage.mouseControls.remove("clickPick-left");
	// Bind our own selection beheviour.
    stage.signals.clicked.add(function (pickingProxy) {
        beads.push(pickingProxy.atom); console.log(beads.length)
    });
}

window.onload = main;
