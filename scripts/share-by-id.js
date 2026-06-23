const { google } = require('googleapis');
const path = require('path');

async function share(spreadsheetId, saEmail, keyFile = 'lib/credentials/service-account.json') {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(keyFile),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const client = await auth.getClient();
  const drive = google.drive({ version: 'v3', auth: client });

  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      type: 'user',
      role: 'reader',
      emailAddress: saEmail,
    },
    sendNotificationEmail: false,
  });

  console.log('Shared', spreadsheetId, 'to', saEmail);
}

if (require.main === module) {
  const [, , spreadsheetId, saEmail, keyFile] = process.argv;
  if (!spreadsheetId || !saEmail) {
    console.error('Usage: node scripts/share-by-id.js <SPREADSHEET_ID> <SERVICE_ACCOUNT_EMAIL> [KEY_FILE]');
    process.exit(1);
  }
  share(spreadsheetId, saEmail, keyFile).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { share };
