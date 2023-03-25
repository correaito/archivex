const endereco = require("../../models/Endereco.js");

function buscarMaiorNumeroPrateleira(area, estante) {
  return new Promise((resolve, reject) => {
    endereco.aggregate([
      {
        $match: {
          endereco: { $regex: new RegExp(`^${area}\.${estante}\.`) }
        }
      },
      {
        $project: {
          numeroPrateleira: {
            $toInt: { $arrayElemAt: [{ $split: ["$endereco", "."] }, 2] }
          }
        }
      },
      {
        $group: {
          _id: null,
          maiorNumeroPrateleira: { $max: "$numeroPrateleira" }
        }
      }
    ], function(err, result) {
      if (err) {
        console.error(err);
        return reject(err);
      }

      resolve(result.shift().maiorNumeroPrateleira);
    });
  });
}

  

module.exports = buscarMaiorNumeroPrateleira;