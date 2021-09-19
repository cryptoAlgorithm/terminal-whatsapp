const blessed = require('blessed');
const { getTextFromMsg } = require('../utils/utils');
const { format } = require('date-fns');

// === Message List UI Component  === //

module.exports = class MsgList {
	constructor() {
		this.ui = blessed.box({
		    top: 0,
		    left: 27,
		    width: '100%-27',
		    height: '100%-2',
		    content: '{grey-fg}No chat selected{/}',
		    label: '{bold}Select a Chat{/bold}',
		    tags: true,
		    border: { type: 'line' },
		    scrollbar: { ch: ' ' },
		    scrollable: true,
		    mouse: true,
		    keys: true,
		    clickable: true,
		    style: {
		        border: { fg: 'grey' },
		        scrollbar: { bg: '#646464' },
		        focus: { border: {fg: 'blue'} },
		    }
		});
		this.conn = null;
	}

	init(conn) {
		this.conn = conn;
	}

	append(messages, useShift = false, addDate = true) {
	    for (let i = 0; i < messages.length; i++) {
	        const msg = messages[i];
	        if (!msg.message) continue;

	        const messageQuote = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
	        const sender = msg.participant || msg.key?.remoteJid;
	        const isDifferentDay = messages.length > 1 && ((i === 0 && addDate)
	            || format(messages[i - 1].messageTimestamp.low * 1000, 'yyyyDDD') !== format(msg.messageTimestamp.low * 1000, 'yyyyDDD'));

	        const txt = (isDifferentDay ? `      {#a0a0a0-fg}{bold}——— ${format(msg.messageTimestamp.low * 1000, 'do MMMM yyyy')} ———{/}\n` : '')
	            + `{grey-fg}${format(msg.messageTimestamp.low * 1000, 'HH:mm')}{/} ` +
	            (msg.key.fromMe ? 'You'.bold.red
	                : (this.conn.contacts[sender]?.name?.bold.green
	                    ?? this.conn.contacts[sender]?.notify?.bold.blue
	                    ?? sender?.bold.blue.dim)) + (messageQuote ? '' : ':') + ' ' +
	            (messageQuote
	                    ? '\n     {#757575-fg}▎{/}{#bdbdbd-fg}'
	                    + getTextFromMsg(this.conn, messageQuote).replace('\n', ' ')
	                    + '{/}\n      ' : ''
	            )
	            + getTextFromMsg(this.conn, msg.message)

	        useShift ? this.ui.insertTop(txt) : this.ui.pushLine(txt);
	    }
	}


};