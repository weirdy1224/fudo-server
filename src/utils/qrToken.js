const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const generateRegistrationQRToken = (registrationId, userName, sessionTitle, sessionDate) => {
  return jwt.sign(
    { registrationId, userName, sessionTitle, sessionDate, type: 'member-registration-qr' },
    process.env.JWT_SECRET
  );
};

const verifyRegistrationQRToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'member-registration-qr') return null;
    return decoded;
  } catch {
    return null;
  }
};

const generateRegistrationQRDataURL = async (token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/scan/${token}`;
  return await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#D62828', light: '#ffffff' },
  });
};

module.exports = {
  generateRegistrationQRToken,
  verifyRegistrationQRToken,
  generateRegistrationQRDataURL,
};
