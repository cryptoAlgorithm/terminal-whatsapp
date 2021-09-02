const { WAConnection, MessageType} = require('@adiwajshing/baileys');
const { format } = require('date-fns');
const blessed = require('blessed');
const fs = require('fs');
const qrCode = require('qrcode-terminal');
require('colors');

const LOAD_BLOCKS = 25;

// Create a screen object.
const screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    cursor: {
        artificial: true,
        shape: 'line'
    },
    ignoreLocked: ['escape', 'q', 'Q', 'C-c'],
    dockBorders: true
});

screen.key(['escape', 'q', 'Q', 'C-c'], () => {
    return process.exit(0);
});

screen.key(['tab'], () => {
    screen.focusNext()
});

let conn = new WAConnection();
conn.logger.level = 'silent';
conn.connectOptions.logQR = false;

const getTextFromMsg = (msg) => {
    const msgType = Object.keys(msg)[0];
    switch (msgType) {
        case MessageType.text: return msg.conversation;
        case MessageType.extendedText: return msg.extendedTextMessage.text;
        case MessageType.image: return `<${'imageMessage'.blue}> ` + msg.imageMessage.caption;
        case 'buttonsResponseMessage':
            return `<${'buttonResponse'.blue}> [${msg.buttonsResponseMessage.selectedButtonId.green}] ` +
                `${msg.buttonsResponseMessage.selectedDisplayText.bgGreen.black.bold}`
        case MessageType.buttonsMessage:
            return `<${'buttonMessage'.blue}>
                ${msg.buttonsMessage.contentText}
                {#757575-fg}${msg.buttonsMessage.footerText}{/}
                ${msg.buttonsMessage.buttons.map(v => v.buttonText.displayText.bgGreen.black.bold).join(' | '.bold.dim)}`
        default: return `{#b71c1c-fg}Message type ${msgType} is not implemented yet{/}`;
    }
}

const chatsList = blessed.list({
    top: 0,
    left: 0,
    width: 30,
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
        fg: 'white',
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
const msgList = blessed.box({
    top: 0,
    left: 29,
    width: '100%-29',
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
        fg: '#ffffff',
        border: { fg: 'grey' },
        scrollbar: { bg: '#646464' },
        focus: { border: {fg: 'blue'} },
    }
});
const loadMoreBox = blessed.button({
    top: '100%-3',
    left: 29,
    width: '100%-29',
    height: 3,
    content: 'Click to load more',
    tags: true,
    border: { type: 'line' },
    mouse: true,
    keys: true,
    clickable: true,
    style: {
        fg: '#ffffff',
        border: { fg: 'grey' },
        hover: { bg: 'blue' },
        focus: { border: {fg: 'blue'}, bg: '#333333' },
    }
});


const initUI = () => {
    screen.title = 'WhatsApp Viewer';

    // Draw the UI
    screen.append(chatsList);
    screen.append(msgList);
    screen.append(loadMoreBox);

    // Quit on Escape, q, or Control-C.

    chatsList.focus();
    // Render the screen.
    screen.render();
}

const appendToMsgList = (messages, useShift = false) => {
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (!msg.message) continue;

        const messageQuote = msg.message.extendedTextMessage?.contextInfo;
        const sender = msg.participant || msg.key.remoteJid;

        const txt = `{grey-fg}${format(msg.messageTimestamp.low * 1000, 'dd MMM yy HH:mm')}{/} ` +
            (msg.key.fromMe ? 'You'.bold.red
                : (conn.contacts[sender]?.name?.bold.green
                    ?? conn.contacts[sender]?.notify?.bold.blue
                    ?? sender?.bold.blue.dim)) + (messageQuote ? '' : ':') + ' ' +
            (messageQuote
                    ? '\n                {#757575-fg}▐{/} {#bdbdbd-fg}'
                    + getTextFromMsg(messageQuote?.quotedMessage).replace('\n', ' ')
                    + '{/}\n                ' : ''
            )
            + getTextFromMsg(msg.message)

        useShift ? msgList.insertTop(txt) : msgList.pushLine(txt);
    }
}

async function connectToWhatsApp () {
    const loadingDialog = blessed.loading({
        top: 'center',
        left: 'center',
        width: 36,
        height: 5,
        tags: true,
        border: {
            type: 'line'
        },
        style: {
            fg: 'white',
            border: { fg: '#f0f0f0' },
        }
    });

    const QRDialog = blessed.box({
        top: 'center',
        left: 'center',
        width: 49,
        height: 28,
        tags: true,
        hidden: true,
        border: {type: 'line'},
        style: {
            fg: 'white',
            border: { fg: 'green' },
        }
    });

    screen.append(loadingDialog);
    screen.append(QRDialog);
    loadingDialog.load('\n{center}Logging in to WhatsApp...{/center}')
    screen.render();

    let cursor, messages, selectedID;

    loadMoreBox.on('press', async () => {
        if (!selectedID) return;

        const posFromBottom = msgList.getScrollHeight() - msgList.getScroll();

        loadingDialog.load('\n{center}Loading more messages...{/}');
        screen.render();

        const data = await conn.loadMessages(conn.chats.all()[selectedID].jid, LOAD_BLOCKS, cursor);
        messages = data.messages; cursor = data.cursor;

        if (!messages || messages.length === 0) {
            loadingDialog.stop();
            loadingDialog.load('\n{center}No more messages{/}');
            screen.render();
            setTimeout(() => {
                loadingDialog.stop();
                screen.render();
            }, 2000);
            return;
        }

        loadingDialog.stop();

        appendToMsgList(messages.reverse(), true);
        msgList.setScroll(msgList.getScrollHeight() - posFromBottom);
        msgList.focus();
        screen.render();
    });

    // called when WA sends chats
    // this can take up to a few minutes if you have thousands of chats!
    conn.on('chats-received', async () => {
        loadingDialog.stop();
        QRDialog.hide();

        const chats = conn.chats.all();
        chatsList.setItems(chats.map(c => c.name ?? c.jid.dim));
        chatsList.on('select', async (it, idx) => {
            selectedID = idx

            msgList.setLabel(`{bold}${chats[selectedID].name ?? chats[selectedID].jid}{/bold}`);
            msgList.setContent('{grey-fg}{bold}Loading chat messages...{/}');
            msgList.setScrollPerc(0); // If not some really weird stuff happens
            loadingDialog.load('\n{center}Loading chat messages...{/center}')
            screen.render();

            const response = await conn.loadMessages(chats[selectedID].jid, LOAD_BLOCKS);
            messages = response.messages; cursor = response.cursor;

            msgList.setContent('');

            appendToMsgList(messages);

            msgList.setScrollPerc(100);
            msgList.focus();
            loadingDialog.stop();
            screen.render();
        });

        screen.render();
    });

    conn.on('open', () => {
        const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
        fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo, null, '\t')) // save this info to a file
    });

    conn.on('qr', qr => {
        // Now, use the 'qr' string to display in QR UI or send somewhere\
        QRDialog.show();
        qrCode.generate(qr, {small: true}, c => {
            QRDialog.setContent(`{center}Scan the QR code to login:\n${c}Press ESC, Ctrl + C, or 'Q' to quit{/}`);
            screen.render()
        });
        screen.render();
    });

    try {conn.loadAuthInfo ('./auth_info.json')} catch {}
    await conn.connect();
}

initUI();
// run in main file
connectToWhatsApp ()
    .catch (err => console.log("unexpected error: " + err) ) // catch any errors

