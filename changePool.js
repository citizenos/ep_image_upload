'use strict';

/**
 * Replaces all data attributes of embedded images with links to a file stored on disk.
 * When ep_image_upload is configured to use base64-encoded data URIs (default), these images occupy
 * space in the pool and in recent versions of Etherpad, the pool is stored on every 100th revisions.
 * When storing new changesets in the DB Etherpad also stores the full attributed text, including
 * the pool. So besides consuming a lot of space in every key revision, there are large DB queries
 * written to the pool on every changeset, which can slow down Etherpad.
 *
 * This script moves images to the directory that is configured in the ep_image_upload
 * block of settings.json. In case an attribute is changed, it will *remove* the pool
 * from all key revisions of that pad. In future versions this can be improved, so that
 * the pool of key revisions is changed in the same way the pool of the whole pad is
 * changed.
 *
 * When running this script, watch for error messages, ie
 * grep 'ERROR.*CHANGEPOOL' /var/log/etherpad/etherpad.log
 *
 * Depending on your settings there might be additional mime-types to consider.
 */

if (process.argv.length < 4) {
  console.error('USAGE: \n\
  node changePool.js days maxSize(kByte) [waitDelay(milliseconds)] \n\
  \n\
  days: limit the pads to be considered by time interval \n\
  maxSize: only consider images that are larger than maxSize \n\
  waitDelay: wait between database queries \n\
  \n\
  example:\n\
  node changePool.js 1000 1 20 \n\
  \n\
  moves all images that are larger than 1024 bytes from pads that where edited less than 1000 days ago\n\
  while waiting 20 ms between individual queries\n\
  ');
  process.exit(1);
}

const uuid = require('uuid');
const parseDataUrl = require('parse-data-url');

const delay = ms => new Promise(resolve => {
  setTimeout(resolve, ms)
});

// As of v14, Node.js does not exit when there is an unhandled Promise rejection. Convert an
// unhandled rejection into an uncaught exception, which does cause Node.js to exit.
process.on('unhandledRejection', (err) => {
  if (bytesWritten > 0) {
    console.log(`CHANGEPOOL stored images of size ${bytesWritten/1024/1024}MB to disk`);
  }
  throw err;
});

const newerThan = new Date(Date.now() - parseInt(process.argv[2]) * 24 * 3600 * 1000);
const maxSize = parseFloat(process.argv[3]) * 1024;
const waitDelay = parseInt(process.argv[4]);

(async () => {
  const settings = require('ep_etherpad-lite/node/utils/Settings');
  const baseFolder = settings.ep_image_upload.storage.baseFolder;
  const baseURL = settings.ep_image_upload.storage.baseURL;
  const path = require('path');
  const fsp = require('fs').promises;
  const padManager = require('ep_etherpad-lite/node/db/PadManager');
  const db = require('ep_etherpad-lite/node/db/DB');
  await db.init();
  const pads = await padManager.listAllPads();

  console.log(`CHANGEPOOL there are ${pads.padIDs.length} pads on the instance`);

  let bytesWritten = 0;
  for (const padId of pads.padIDs) {
    if (waitDelay) {
      await delay(waitDelay);
    }
    let pad;
    try {
      pad = await padManager.getPad(padId);
    } catch(err) {
      console.error(`CHANGEPOOL error processing pad ${padId}`);
      continue;
    }

    if (pad.pool == null) {
      console.error(`CHANGEPOOL ${pad.id} Missing attribute pool`);
      continue;
    }

    const headRev = pad.getHeadRevisionNumber();
    if (typeof headRev !== 'number') {
      console.error(`CHANGEPOOL head revision ${headRev} not found in ${pad.id}`);
      continue;
    }

    let lastEdited;
    const padHead = await db.get(`pad:${pad.id}:revs:${headRev}`);
    if (padHead && padHead.meta && padHead.meta.timestamp) {
      lastEdited = padHead.meta.timestamp;
    } else {
      console.error(`CHANGEPOOL no timestamp found in pad:${pad.id}:revs:${headRev}`);
      continue;
    }

    // pad was not edited within the last x days
    if (lastEdited < newerThan) {
      continue;
    }

    let foundImage = false;
    // iterate over the whole pool
    for (const attribNum of Object.keys(pad.pool.numToAttrib)) {
      const [name, value] = pad.pool.getAttrib(attribNum);

      // an embedded image larger than maxSize was found
      if (name === 'img' && value.length > maxSize) {
        let image = parseDataUrl(value);
        let slice;
        if (image) {
          console.log(`CHANGEPOOL found image with attribute number ${attribNum} in pad ${pad.id} contentType: ${image.contentType}`);
          foundImage = true;
        } else {
          // sometimes images are stored using complete HTML, ie `<img src=data:...`, try to repair them
          slice = value.match(/(data:[^">]*)/);
	        if (slice && slice[0]) {
	          image = parseDataUrl(slice[0]);
            if (image) {
              console.log(`CHANGEPOOL repaired image with attribute number ${attribNum} in pad ${pad.id} contentType: ${image.contentType}`);
              foundImage = true;
            } else {
              console.error(`CHANGEPOOL found image with non-valid data attribute ${attribNum} in pad ${pad.id}. The first 30 bytes are: ${value.slice(0,30)}`);
              continue;
            }
	        } else {
            console.error(`CHANGEPOOL cannot parse image attribute ${attribNum} in pad ${pad.id}. The first 30 bytes are: ${value.slice(0,30)}`);
            continue;
          }
        }
        const contentType = image.contentType;
        let fileExt;
        if (contentType === 'image/gif') {
          fileExt = 'gif';
        } else if (contentType === 'image/jpeg') {
          fileExt = 'jpeg';
        } else if (contentType === 'image/jpg') {
          fileExt = 'jpg';
        } else if (contentType === 'image/pjpeg') {
          fileExt = 'pjpeg';
        } else if (contentType === 'image/png') {
          fileExt = 'png';
        } else if (contentType === 'image/heic') {
          fileExt = 'heic';
        } else if (contentType === 'image/webp') {
          fileExt = 'webp';
        } else if (contentType === 'image/svg+xml') {
          fileExt = 'svg';
        } else if (contentType === 'text/html') {
          fileExt = 'html';
        } else if (contentType === 'audio/mpeg') {
          fileExt = 'mp3';
        } else if (contentType === 'video/x-matroska') {
          fileExt = 'mkv';
        } else if (contentType === 'text/calendar') {
          fileExt = 'ics';
        } else if (contentType === 'application/pdf') {
          fileExt = 'pdf';
        } else if (contentType === 'application/octet-stream') {
          fileExt = 'data';
        } else if (contentType === 'application/msword') {
          fileExt = 'doc';
        } else if (contentType === 'application/vnd.oasis.opendocument.text') {
          fileExt = 'odt';
        } else if (contentType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          fileExt = 'pptx';
        } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          fileExt = 'docx';
        } else if (contentType === undefined) {
          fileExt = 'data';
        } else {
          console.error(`CHANGEPOOL ignoring image attribute ${attribNum} with type ${contentType} in pad ${pad.id}`);
          if (!foundImage) foundImage = false;
          continue;
        }

        const fileName = uuid.v4();
        const newFilePath = `${path.join(baseFolder, pad.id, fileName)}.${fileExt}`;
        const dirname = path.dirname(newFilePath);
        const imageLink = `${baseURL}${pad.id}/${fileName}.${fileExt}`;
        try {
          await fsp.stat(dirname);
        } catch (err) {
          if (err.code === 'ENOENT') {
            await fsp.mkdir(dirname);
            console.log(`CHANGEPOOL created directory ${dirname}`);
          }
        }
        await fsp.writeFile(newFilePath, image.toBuffer());
        bytesWritten += image.toBuffer().length;
        console.log(`CHANGEPOOL storing ${pad.id}:${attribNum} to ${newFilePath}`);

        pad.pool.numToAttrib[attribNum] = [name, imageLink];
        delete pad.pool.attribToNum[String(name, value)];
        pad.pool.attribToNum[String(name, imageLink)] = attribNum;
        console.log(`CHANGEPOOL changed attribute ${attribNum} of pad ${pad.id} to ${imageLink}`);
      }
    }
    if (!foundImage) {
      continue;
    } else {
      // construct the whole pad object
      const dbObject = {};
      const attributeBlackList = ['id'];
      const jsonableList = ['pool'];

      for (const attr in pad) {
        if (typeof pad[attr] === 'function') continue;
        if (attributeBlackList.indexOf(attr) !== -1) continue;

        dbObject[attr] = pad[attr];

        if (jsonableList.indexOf(attr) !== -1) {
          dbObject[attr] = dbObject[attr].toJsonable();
        }
      }
      await db.set(`pad:${pad.id}`, dbObject);
      console.log(`CHANGEPOOL wrote pool of pad ${pad.id}`);

      let keyRevs = [];
      let poolsDeleted = 0;
      for (let i=0;i < Math.round(headRev/100 + 1); i++) {
        keyRevs.push(100 + 100*i);
      }

      // delete the pool from key revisions
      for (const keyRev of keyRevs) {
        if (waitDelay) {
          await delay(waitDelay);
        }
        let revData = await db.get(`pad:${pad.id}:revs:${keyRev}`);
        if (revData && revData.meta && revData.meta.pool) {
          delete revData.meta.pool;
          await db.set(`pad:${pad.id}:revs:${keyRev}`, revData);
          poolsDeleted += 1;
        }
      }
      if (poolsDeleted) {
        console.log(`CHANGEPOOL pool of pad ${pad.id} was deleted from ${poolsDeleted} key revisions`);
      }
    }
  }

  if (bytesWritten > 0) {
    console.log(`CHANGEPOOL stored images of size ${bytesWritten/1024/1024}MB to disk`);
  }

  await db.shutdown();
  process.exit(0);
})();
