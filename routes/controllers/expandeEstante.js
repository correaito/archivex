// Aqui nessa funcao estamos expandindo as estantes, quando ja temos a área definida, e o sistema vai procurar a ultima estante criada
// dentro dessa area
const endereco = require("../../models/Endereco");

function expandeEstante(area, qtde_estantes, qtde_prateleiras, qtde_posicoes, ultima_estante) {

  const prox_estante = parseInt(ultima_estante) + 1;
  const estante_maxima = parseInt(qtde_estantes) + parseInt(ultima_estante);

  // cria as estantes
  for (var e = prox_estante; e <= estante_maxima; e++) {
    // cria as prateleiras
    for (var p = 1; p <= qtde_prateleiras; p++) { 
      // cria as posições
      for (var pos = 1; pos <= qtde_posicoes; pos++) {
        const novoEndereco = {
          endereco: area + "." + e + "." + p + "." + pos,
        };
        new endereco(novoEndereco).save();
      }
    }
  }
}

module.exports = expandeEstante;