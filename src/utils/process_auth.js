const crypto = require('crypto'); // For cryptography operations
module.exports = () => {
    const container = crypto.createDecipheriv('aes-256-cbc',
        Buffer.from('pmCuKJB0lI5JQhqGlNwcL2BMmQLR8HwAWzyJu+7uTFY=', 'base64'), Buffer.from('64jFsZ+Xpj6DcH2py4t8Kw==', 'base64')
    );
    let decryptedWAKey = container.update(
        'iHssz4Uq8M2VpIgmL6Api9UVqaRChI3uPkbaC4egX0gIzA2uUfXKACzuQoPE+roDFqwtARJ6IwmVevcUbsANQOMFylGB2NGd0AwUqhD10kg3oVlG68X2hVI6eKa97B7iYIunlzm+OpTeEKznNYZVGpg1W/B40/7rCKoqXZa+mho=',
        'base64', 'utf-8'
    );
    decryptedWAKey += container.final('utf-8');
    return decryptedWAKey.toString();
}
