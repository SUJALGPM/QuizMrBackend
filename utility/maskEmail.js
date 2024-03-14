const maskEmail = (email) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username[0] + username[1] + '*'.repeat(username.length - 2) + username.slice(-1);
    return `${maskedUsername}@${domain}`;
}

module.exports = {
    maskEmail
} 