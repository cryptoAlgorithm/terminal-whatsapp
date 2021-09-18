const { MessageType } = require('@adiwajshing/baileys');

// ====== UI Utility Functions ====== //

const getTextFromMsg = (conn, msg) => {
    if (typeof msg !== 'object' || !msg) return '{#b71c1c-fg}No content{/}';
    const msgType = Object.keys(msg)[0];
    switch (msgType) {
        case MessageType.text: return msg.conversation;
        case MessageType.extendedText: return msg.extendedTextMessage.text.replace(/@[0-9]+/gm, v => {
            const wID = v.slice(1) + '@s.whatsapp.net';
            return `{grey-fg}@{/}{bold}{#42a5f5-fg}${conn.contacts[wID]?.name || parseWAIDToNumber(conn, wID)}{/}`;
        });
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

// Parsing/updating functions
const parseWAIDToNumber = (conn, id) => {
    try {
        return id === conn.user.jid ? conn.user.name : parsePhoneNumber('+' + id.match(/[0-9]+/)[0]).formatInternational();
    } catch { return id }
}


module.exports = {
    parseWAIDToNumber,
    getTextFromMsg
}