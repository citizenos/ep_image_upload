'use strict';

describe('Image Translations', function () {
  // create a new pad before each test run
  beforeEach(function (cb) {
    helper.newPad(cb);
    this.timeout(60000);
  });

  const titles = {
    en: 'Upload image',
    et: 'Lae pilt üles',
  };

  const changeEtherpadLanguageTo = function (lang, callback) {
    const chrome$ = helper.padChrome$;

    // click on the settings button to make settings visible
    const $settingsButton = chrome$('.buttonicon-settings');
    $settingsButton.click();

    // select the language
    const $language = chrome$('#languagemenu');
    $language.val(lang);
    $language.change();

    // hide settings again
    $settingsButton.click();

    helper.waitFor(() => chrome$('.image_upload').parent()[0].title === titles[lang])
        .done(callback);
  };

  it('Checks i18n', async function () {
    const chrome$ = helper.padChrome$;
    this.timeout(2000);
    await changeEtherpadLanguageTo('et');
    // make sure the text hasn't changed
    helper.waitForPromise(() => chrome$('.image_upload').parent()[0].title === titles.et);
  });
});
