// Confirms a PayPhone transaction server-side (so the merchant's Token never
// has to be trusted from the browser for the confirm step) and, once really
// approved, logs the order to a Google Sheet so it isn't only recoverable
// through the customer's own WhatsApp message.
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const { id, clientTransactionId, shipping, cart } = payload;
    if (!id || !clientTransactionId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing id or clientTransactionId' }) };
    }

    const token = process.env.PAYPHONE_TOKEN;
    if (!token) {
        return { statusCode: 500, body: JSON.stringify({ error: 'PAYPHONE_TOKEN no está configurado en Netlify' }) };
    }

    let confirmation;
    let ppHttpStatus;
    try {
        const ppRes = await fetch('https://paymentbox.payphonetodoesposible.com/api/confirm', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: Number(id), clientTxId: clientTransactionId })
        });
        ppHttpStatus = ppRes.status;
        confirmation = await ppRes.json();
        console.log('PayPhone confirm response', ppHttpStatus, JSON.stringify(confirmation));
    } catch (err) {
        console.error('Error calling PayPhone confirm:', err);
        return { statusCode: 502, body: JSON.stringify({ error: 'No se pudo contactar a PayPhone', detail: String(err) }) };
    }

    const approved = !!(confirmation && confirmation.statusCode === 3);

    if (approved && process.env.SHEETS_WEBHOOK_URL) {
        try {
            await fetch(process.env.SHEETS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionId: confirmation.transactionId,
                    clientTransactionId,
                    authorizationCode: confirmation.authorizationCode,
                    amount: confirmation.amount ? (confirmation.amount / 100).toFixed(2) : null,
                    cardBrand: confirmation.cardBrand,
                    shipping: shipping || {},
                    cart: cart || []
                })
            });
        } catch (err) {
            // The payment itself is still real and approved even if the sheet
            // logging fails - don't fail the whole request over it.
            console.error('Failed to log order to sheet:', err);
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            approved,
            transactionId: confirmation.transactionId,
            authorizationCode: confirmation.authorizationCode,
            amount: confirmation.amount,
            cardBrand: confirmation.cardBrand,
            debugHttpStatus: ppHttpStatus,
            debugResponse: confirmation
        })
    };
};
