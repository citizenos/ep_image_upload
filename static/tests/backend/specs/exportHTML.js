'use strict';

const common = require('ep_etherpad-lite/tests/backend/common');
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
import {generateJWTToken} from "ep_etherpad-lite/tests/backend/common";

let agent;
const apiKey = common.apiKey;
const apiVersion = 1;

const createPad = async (padID, callback) => {
  agent.get(`/api/${apiVersion}/createPad?&padID=${padID}`)
    .set("Authorization", await generateJWTToken())
    .end((err, res) => {
      if (err || (res.body.code !== 0)) callback(new Error('Unable to create new Pad'));
      callback(padID);
    });
};

const setHTML = async (padID, html, callback) => {
  agent.get(`/api/${apiVersion}/setHTML?padID=${padID}&html=${html}`)
    .set("Authorization", await generateJWTToken())
    .end((err, res) => {
      if (err || (res.body.code !== 0)) callback(new Error('Unable to set pad HTML'));
      callback(null, padID);
    });
};

describe(__filename, function () {
  let padID;

  before(async function () { agent = await common.init(); });

  // create a new pad before each test run
  beforeEach(function (done) {
    padID = randomString(5);

    createPad(padID, () => {
      const uploadSVG =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      setHTML(padID, `<html><body><img src="${uploadSVG}"></body></html>`, done);
    });
  });

  it('returns HTML with img HTML tags', async function () {
    const res = await agent.get(`/api/${apiVersion}/getHTML?padID=${padID}`)
        .set("Authorization", await generateJWTToken())
        .expect(200)
        .expect('Content-Type', /json/);
    if (!res.body.data.html.includes('<img')) throw new Error('No image tag detected');
  });
});
