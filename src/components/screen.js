const blessed = require('blessed');

function Screen() {
	// Create a screen object.
	const screen = blessed.screen({
	    smartCSR: true,
	    autoPadding: true,
	    cursor: {
	        artificial: true,
	        shape: 'line',
	        blink: true,
	    },
	    ignoreLocked: ['C-c', 'C-q', 'escape'],
	    dockBorders: true
	});

	screen.key(['escape', 'C-c', 'C-q'], () => {
	    return process.exit(0);
	});

	screen.key(['tab'], () => {
	    screen.focusNext()
	    return false;
	});

	return screen;
}



module.exports = Screen;