const puppeteer = require('puppeteer');
const selectors = require('./selectors');

class BancoDoBrasil {

  async run() { 
    const browser = await puppeteer.launch({
      headless: false,
      handleSIGINT: false
    });

    const page = await browser.newPage();
    page.setViewport({
      width: 1280,
      height: 800
    });

    this._page = page;
    this._page.setRequestInterception(true);
    this._interceptors();

    this._credentials = {}; // your access credentials

    await this._page.goto('https://aapj.bb.com.br/aapj/loginpfe.bb');

    await this._login();

    await this._wait('.ui-dialog');

    await this._page.evaluate(() => {
      document.querySelector('.ui-dialog').remove();
      document.querySelector('.ui-widget-overlay').remove();
    }); 

    await this._wait(selectors.MENU.transfers);
    
    await this._page.evaluate(() => {
      document.querySelectorAll('[name="/transferencias/818.bb"]')[1].click();
    }); 

    const transfers = [];

    for (let i = 0; i < transfers.length; i++) {
      const transfer = transfers[i];

      await this._setTransfer(transfer);
    }

    await this._page.waitFor(400000);
  }

  async _login() {
    await this._wait(selectors.LOGIN.j_key_btn);
    await this._page.click(selectors.LOGIN.j_key_btn);

    await this._wait(selectors.LOGIN.user);
    await this._wait(selectors.LOGIN.password);
    await this._wait(selectors.LOGIN.btn);

    await this._page.type(selectors.LOGIN.user, this._credentials.user, {
      delay: 50
    });
    await this._page.type(selectors.LOGIN.password, this._credentials.password);

    await this._page.click(selectors.LOGIN.btn);
  }

  _wait(selector, options) { 
    return this._page.waitForSelector(selector, Object.assign({
      visible: true
    }, options));
  }

  async _setTransfer(transfer) { 
    await this._wait(selectors.BTN.ok);
    await this._page.click(selectors.BTN.ok);

    await this._wait(selectors.TRANSFER.agency);
    await this._wait(selectors.TRANSFER.account);
    await this._wait(selectors.TRANSFER.value);
    await this._wait(selectors.TRANSFER.password);
    await this._wait(selectors.BTN.sign);

    await this._page.type(selectors.TRANSFER.agency, transfer.agency_with_digit, {
      delay: 50
    });
    await this._page.type(selectors.TRANSFER.account, transfer.account_with_digit, {
      delay: 50
    });
    await this._page.type(selectors.TRANSFER.value, transfer.value, {
      delay: 50
    });

    await this._page.type(selectors.TRANSFER.password, this._credentials.electronicPassword, {
      delay: 50
    });

    await this._page.click(selectors.BTN.sign);

    await this._wait(selectors.BTN.new);

    const creditedName = await this._page.evaluate(() => {
      return document.querySelectorAll('.tabelaTsr')[1].querySelectorAll('tr')[1].querySelectorAll('td')[1].innerText;
    });

    if (creditedName === '${FAVORECIDO}') {
      console.log('TRANSFERENCIA EFETUADA COM SUCESSO');
    } else { 
      throw new Error('deu ruim');
    }
  }

  _interceptors() { 
    this._page.on('request', interceptedRequest => {
      if (interceptedRequest.url().includes('aapj.bb.com.br/aapj/imagemCaptcha.bb')) { 
        return interceptedRequest.abort();
      }

      return interceptedRequest.continue();
    });
  }

}

module.exports = BancoDoBrasil;