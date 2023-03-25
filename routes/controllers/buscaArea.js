const endereco = require("../../models/Endereco.js");

function buscarMaiorArea() {
  return new Promise((resolve, reject) => {
    endereco.aggregate(
      [
        {
          $group: {
            _id: null,
            maiorCodigo: { $max: "$endereco" },
          },
        },
      ],
      function (err, result) {
        if (err) {
          console.error(err);
          return reject(err);
        }
        if (result.length === 0 || result[0].maiorCodigo === undefined) {
          return resolve(undefined);
        }
        const maiorCodigo = result[0].maiorCodigo;
        const indicePonto = maiorCodigo.indexOf(".");
        const primeiroCodigo = maiorCodigo.substring(0, indicePonto);
        return resolve(primeiroCodigo);
      }
    );
  });
}


module.exports = buscarMaiorArea;
