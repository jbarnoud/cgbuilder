function main() {
    // Create NGL Stage object
    var stage = new NGL.Stage( "viewport" );

    // Handle window resizing
    window.addEventListener( "resize", function( event ){
        stage.handleResize();
    }, false );


    var beads = [];

    // Load PDB entry 1CRN
    stage.loadFile( "rcsb://1crn", { defaultRepresentation: true } );
    stage.signals.clicked.add(function (pickingProxy) {
        beads.push(pickingProxy.atom); console.log(beads.length)
    });
}

window.onload = main;
