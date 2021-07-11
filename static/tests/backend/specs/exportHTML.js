'use strict';

const common = require('ep_etherpad-lite/tests/backend/common');
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

let agent;
const apiKey = common.apiKey;
const apiVersion = 1;

const createPad = async (padID) => {
  const res = await agent.get(`/api/${apiVersion}/createPad?apikey=${apiKey}&padID=${padID}`);
  if (res.body.code !== 0) throw new Error('Unable to create new Pad');
};

const setHTML = async (padID, html) => {
  const res =
      await agent.get(`/api/${apiVersion}/setHTML?apikey=${apiKey}&padID=${padID}&html=${html}`);
  if (res.body.code !== 0) throw new Error('Unable to set pad HTML');
};

describe(__filename, function () {
  let padID;

  before(async function () { agent = await common.init(); });

  // create a new pad before each test run
  beforeEach(async function () {
    padID = randomString(5);
    await createPad(padID);
    const uploadSVG =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    await setHTML(padID, `<html><body><img src="${uploadSVG}"></body></html>`);
  });

  it('returns HTML with img HTML tags', async function () {
    const res = await agent.get(`/api/${apiVersion}/getHTML?apikey=${apiKey}&padID=${padID}`)
        .expect(200)
        .expect('Content-Type', /json/);
    if (!res.body.data.html.includes('<img')) throw new Error('No image tag detected');
  });
});
