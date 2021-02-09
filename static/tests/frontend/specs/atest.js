'use strict';

describe('Image Upload', function () {
  // create a new pad before each test run
  beforeEach(function (cb) {
    helper.newPad(cb);
    this.timeout(60000);
  });

  const changeEtherpadLanguageTo = function (lang, callback) {
    const titles = {
      en: 'Upload image',
      et: 'Lae pilt üles',
    };
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

  it('Checks i18n', async function (done) {
    const chrome$ = helper.padChrome$;
    this.timeout(1000);
    const originalValue = chrome$('.image_upload').parent()[0].title;
    await changeEtherpadLanguageTo('et');
    // make sure the text hasn't changed
    expect(originalValue).to.not.eql(chrome$('.image_upload').parent()[0].title);
    done();
  });
});
