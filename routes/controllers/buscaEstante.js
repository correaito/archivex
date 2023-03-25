const endereco = require("../../models/Endereco.js");

function buscarMaiorNumeroEstante(codigoArea) {
  return new Promise((resolve, reject) => {
    endereco.aggregate([
      {
        $match: {
          endereco: { $regex: `^${codigoArea}\\.` }
        }
      },
      {
        $project: {
          numeroEstante: {
            $toInt: { $arrayElemAt: [{ $split: ["$endereco", "."] }, 1] }
          }
        }
      },
      {
        $group: {
          _id: null,
          maiorNumeroEstante: { $max: "$numeroEstante" }
        }
      }
    ], function(err, result) {
      if (err) {
        console.error(err);
        return reject(err);
      }
      resolve(result[0].maiorNumeroEstante);
    });
  });
}


  module.exports = buscarMaiorNumeroEstante;