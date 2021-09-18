const blessed = require('blessed');

const Screen = require('./screen');
const ChatsList = require('./chats_list'); 
const MsgList = require('./msg_list');
const LoadMoreButton = require('./load_more_button');
const InputButton = require('./input_button');


// ====== UI Element Objects ====== //
const screen = Screen();

const msgList = new MsgList();

const chatsList = new ChatsList();

const loadMoreButton = new LoadMoreButton();

const inputButton = new InputButton();

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

module.exports = {
    screen,
    loadMoreButton,
    inputButton,
    loadingDialog,
    QRDialog,
    msgList,
    chatsList
}
