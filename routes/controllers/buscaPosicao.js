const endereco = require("../../models/Endereco.js");

function buscarMaiorNumeroPosicao(area, estante, prateleira) {
  return new Promise((resolve, reject) => {
    endereco.aggregate([
      {
        $match: {
          endereco: {
            $regex: new RegExp(`^${area}.${estante}.${prateleira}.`),
          },
        }, 
      },
      {
        $project: {
          numeroPosicao: {
            $toInt: { $arrayElemAt: [{ $split: ["$endereco", "."] }, 3] },
          },
        },
      },
      {
        $group: {
          _id: null,
          maiorNumeroPosicao: { $max: "$numeroPosicao" },
        },
      },
    ], function(err, result) {
      if (err) {
        console.error(err);
        return reject(err);
      }

      resolve(result[0].maiorNumeroPosicao);
    });
  });
}



module.exports = buscarMaiorNumeroPosicao;
