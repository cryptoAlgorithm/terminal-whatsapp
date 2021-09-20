const blessed = require('blessed');
const { LOAD_BLOCKS } = require('../consts');


class LoadMoreButton {
	constructor() {
		this.ui = blessed.button({
		    top: '100%-3',
		    left: 27,
		    width: 13,
		    height: 3,
		    content: '{center}Load more{/}',
		    tags: true,
		    border: { type: 'line' },
		    mouse: true,
		    keys: true,
		    clickable: true,
		    style: {
		        bg: '#2196f3',
		        border: { fg: 'grey' },
		        hover: { bg: '#1565c0' },
		        focus: { border: {fg: 'blue'}, bg: '#333333' },
		    }
		});
	}

	init(conn, screen, loadingDialog, msgList) {
		this.conn = conn;
		this.screen = screen;
		this.loadingDialog = loadingDialog;
		this.msgList = msgList;
	}

	async onPress(selectedID, messages, cursor) {
        if (!selectedID) return;

        const posFromBottom = this.msgList.ui.getScrollHeight() - this.msgList.ui.getScroll();

        this.loadingDialog.load('\n{center}Loading more messages...{/}');
        this.screen.render();

        const data = await this.conn.loadMessages(selectedID, LOAD_BLOCKS, cursor);
        messages = data.messages;
        cursor = data.cursor;

        if (!messages || messages.length === 0) {
            this.loadingDialog.stop();
            this.loadingDialog.load('\n{center}No more messages{/}');
            this.screen.render();
            setTimeout(() => {
                this.loadingDialog.stop();
                this.screen.render();
            }, 2000);
            return;
        }

        this.loadingDialog.stop();

        this.msgList.append(messages.reverse(), true);
        this.msgList.ui.setScroll(this.msgList.ui.getScrollHeight() - posFromBottom);
        this.msgList.ui.focus();
        this.screen.render();
	}
};

module.exports = LoadMoreButton;