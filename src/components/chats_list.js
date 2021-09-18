const { format }  = require('date-fns');
const blessed = require('blessed');

const { LOAD_BLOCKS } = require('../consts');
const { parseWAIDToNumber } = require('../utils/utils.js');

class ChatsList {
	constructor(waConn) {
		this.ui = blessed.list({
		    top: 0,
		    left: 0,
		    width: 28,
		    height: '100%',
		    label: '{bold}Chats{/}',
		    items: ['(Empty)'],
		    hoverText: 'Double click item or use keyboard',
		    tags: true,
		    mouse: true,
		    keys: true,
		    border: { type: 'line' },
		    scrollbar: { ch: ' ' },
		    clickable: true,
		    style: {
		        border: { fg: 'grey' },
		        item: { fg: 'white', hover: { bg: '#1e88e5' } },
		        selected: {
		            fg: 'black',
		            bold: true,
		            bg: '#4caf50'
		        },
		        focus: { border: {fg: 'blue'} },
		        scrollbar: { bg: '#646464' }
		    }
		});

		this.conn = null;
	}

	init(conn, screen, loadingDialog, chatsList, msgList) {
		this.conn = conn;
		this.screen = screen;
		this.loadingDialog = loadingDialog;
		this.chatsList = chatsList;
		this.msgList = msgList;
	}

	update() {
		this.ui.setItems(this.conn.chats.all().map(c => c.name ?? parseWAIDToNumber(this.conn, c.jid)));
	}

	async onSelect(selectedChat) {
        let selectedID = selectedChat.jid

        this.msgList.ui.setLabel(`{bold}${selectedChat.name ?? parseWAIDToNumber(this.conn, selectedID)}{/bold}`);
        this.msgList.ui.setContent('{grey-fg}{bold}Loading chat messages...{/}');
        this.msgList.ui.setScrollPerc(0); // If not some really weird stuff happens
        this.loadingDialog.load('\n{center}Loading chat messages...{/center}')
        this.screen.render();

        const response = await this.conn.loadMessages(selectedID, LOAD_BLOCKS);
        let messages = response.messages
       	let cursor = response.cursor;

        this.msgList.ui.setContent('');
        this.msgList.append(messages);

        this.msgList.ui.setScrollPerc(100);
        this.msgList.ui.focus();
        this.loadingDialog.stop();
        this.screen.render();

        return [ selectedID, messages, cursor ];
	}

};

module.exports = ChatsList;