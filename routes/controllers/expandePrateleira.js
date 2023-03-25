// Aqui nessa funcao estamos expandindo as prateleiras, quando ja temos a área definida e a estante
// e o sistema vai procurar a ultima prateleira mais alta criada dentro dentro dessa area e estante pre-definida
const endereco = require("../../models/Endereco");

function expandePrateleira(area, estante, qtde_prateleiras, qtde_posicoes, ultima_prateleira) {
  const prox_estante = parseInt(ultima_prateleira) + 1;
  const prateleira_maxima =
    parseInt(qtde_prateleiras) + parseInt(ultima_prateleira);

  // cria as prateleiras
  for (var p = prox_estante; p <= prateleira_maxima; p++) {
    // cria as posições
    for (var pos = 1; pos <= qtde_posicoes; pos++) {
      const novoEndereco = {
        endereco: area + "." + estante + "." + p + "." + pos,
      };
      new endereco(novoEndereco).save();
    }
  }
}

module.exports = expandePrateleira;
