const blessed = require('blessed');

// ===== Pops up a prompt object on screen ===== //

const Prompt = (screen, title, cb) => {
    const promptDialog = blessed.box({
        top: 'center',
        left: 'center',
        width: 50,
        height: 6,
        tags: true,
        shadow: true,
        border: {type: 'line'},
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
        border: { type: 'line' },
        style: {
            bg: '#d32f2f',
            hover: { bg: '#b71c1c' },
            border: { fg: '#f0f0f0' }
        }
    });

    screen.saveFocus();
    promptDialog.setContent(`\n  {bold}${title}{/}`);

    const close = () => {
        screen.remove(promptDialog);
        screen.remove(promptClose);
        screen.remove(promptInput);
        screen.restoreFocus();
        screen.render();
    }
    const subListener = () => {
        cb(promptInput.value);
        close();
    }
    screen.append(promptDialog);
    screen.append(promptClose);
    promptInput.on('submit', subListener);
    promptClose.on('press', close);
    promptInput.focus();
    screen.render();
}


module.exports = {Prompt};