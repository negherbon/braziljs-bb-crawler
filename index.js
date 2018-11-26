const BancoDoBrasil = require('./bb/BancoDoBrasil');

(async () => {
  await new BancoDoBrasil().run();
})();

