// Do some math
Math.sin(Math.PI) // Sine of PI - 0
Math.round(1.5) // Returns 2
Math.random() // A random decimal value between 0 and 1

// instantiate
/*const table = new Table({
    head: ['Chat Name', 'Chat JID'],
    colWidths: [48, 32]
});

// table is an Array, so you can `push`, `unshift`, `splice` and friends
for (let i = 0; i < chats.length; i++) {
    const chat = chats[i];
    table.push([chat.name ?? "Unknown", chat.jid]);
}*/

/*while (1) {
    // console.log('\nTable of Chats - Ordered by latest message sent first')
    console.log(table.toString());
    const jid = await input('Enter a chat JID:');
    if (jid === 'q') {
        console.log('Goodbye!');
        process.exit(0);
    }

    let {messages, cursor} = await conn.loadMessages(jid.trim(), 25);
    if (!messages || messages.length === 0) {
        console.log('This chat does not exist');
        continue;
    }

    console.log('\n#### Chat:'.dim, conn.chats.get(jid.trim()).name.bold.underline, '####'.dim);
    while (1) {
        if (!cursor || messages.length === 0) {
            console.log('#### End of conversation ####');
            break;
        }

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (!msg.message) continue;

            const messageQuote = msg.message.extendedTextMessage?.contextInfo;
            const sender = msg.participant || msg.key.remoteJid;

            console.log(`[${format(msg.messageTimestamp.low * 1000, 'dd MMM yy HH:mm')}]`.dim,
                (msg.key.fromMe ? 'You'.bold.red
                : (conn.contacts[sender]?.name?.bold.green
                    ?? conn.contacts[sender]?.notify?.bold.blue
                    ?? sender?.bold.blue.dim)) + (messageQuote ? '' : ':'),
                (messageQuote
                    ? '\n                  ▐ '.bold.dim
                    + getTextFromMsg(messageQuote?.quotedMessage).replace('\n', ' ').grey
                    + '\n                  ' : ''
                )
                + getTextFromMsg(msg.message)
            );
        }
        const act = await input('--MORE [25]--'.italic.grey);
        console.log('=============================='.bold);
        if (act === 'q') break;

        const number = parseInt(act.toString());
        const msg = await conn.loadMessages(jid.trim(), isNaN(number) ? 25 : Math.max(1, number), cursor);
        messages = msg.messages;
        cursor = msg.cursor;
    }
}*/
