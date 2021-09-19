const blessed = require('blessed');
const { MessageType } = require('@adiwajshing/baileys');
const { Prompt } = require('./prompt');

class InputButton {
	constructor() {
		this.ui = blessed.button({
		    top: '100%-3',
		    left: 39,
		    width: '100%-39',
		    height: 3,
		    content: 'Click to compose message',
		    tags: true,
		    border: { type: 'line' },
		    mouse: true,
		    keys: true,
		    inputOnFocus: true,
		    style: {
		        bg: '#00897b',
		        border: { fg: 'grey' },
		        hover: { bg: '#00695c' },
		        focus: { border: {fg: 'blue'}, bg: '#333333' },
		    }
		});
	}

	init(conn, screen) {
		this.conn = conn;
		this.screen = screen;
	}

	onPress(selectedID) {
        if (!selectedID) return;
        
        Prompt(this.screen, 'Type a message', v => {
            if (v.trim().length === 0) return;
            this.conn.sendMessage(selectedID, v.trim(), MessageType.text);
        });
    }
};


module.exports = InputButton;