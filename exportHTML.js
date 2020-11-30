'use strict';

const Changeset = require('ep_etherpad-lite/static/js/Changeset');

const _analyzeLine = function (alineAttrs, apool) {
    var image = null;
    if (alineAttrs) {
        var opIter = Changeset.opIterator(alineAttrs);
        if (opIter.hasNext()) {
            var op = opIter.next();
            image = Changeset.opAttributeValue(op, 'img', apool);
        }
    }

    return image;
};

exports.getLineHTMLForExport = function (hook, context) {
    var image = _analyzeLine(context.attribLine, context.apool);
    if (image) {
        context.lineContent = image;
    }
};
