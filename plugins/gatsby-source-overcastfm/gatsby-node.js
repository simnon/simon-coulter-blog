const fs = require("fs")
const uuid = require("uuid")
const { webkit, Download } = require('playwright');  // Or 'chromium' or 'firefox'.
const axios = require('axios');

exports.sourceNodes = async (commands, configOptions) => {
  console.log('gatsby-source-overcastfm: sourceNodes');
  await fetchOpml(commands, configOptions)
}

const fetchOpml = async (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
  const { createNode } = actions
  
  const browser = await webkit.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = process.env.OVERCAST_EMAIL ?? 'undefined';
  const password = process.env.OVERCAST_PASSWORD ?? 'undefined';
  await loginOvercast(email, 
                      password,
                      page, 
                      context)
  console.log('gatsby-source-overcastfm: login');
  await downloadOpml(context, configOptions.output);
  await browser.close();
  const fileExists = fs.existsSync(configOptions.output);
  if (!fileExists) {
    console.error('Opml file does not exist')
  } else {
    console.log('Opml file created successfully: ' + configOptions.output);
  }
}

const downloadOpml = async (context, opmlPath) => {
  const opmlUrl = 'https://overcast.fm/account/export_opml/extended';
  const cookies = await context.cookies();

  var options = {
    headers: {
      'Cookie': 'o=' + cookies[0].value,
      'Accept': 'application/xml',
    },
    url: opmlUrl,
    method: 'GET',
    responseType: 'stream'
  }
  
  const writer = fs.createWriteStream(opmlPath)
  const response = await axios(options);
  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
};

const loginOvercast = async ( username, 
                              password, 
                              page, 
                              context) => {

  const cookies = (await context.cookies()) ?? [];
  const needToLogin = cookies.length <= 0;

  if (needToLogin === true) {
    console.log('Need to login');
    await page.goto('https://overcast.fm/login');
    await page.fill('#email', username);
    await page.fill('#password', password);
    await page.locator('button:has-text("Log In")').click();
    await page.goto('https://overcast.fm/account/');
  } else {
    console.log('no need to login');
  }
};