// Aqui nessa funcao estamos expandindo as posicoes, quando ja temos a área definida, a estante e a prateleira
// e o sistema vai procurar a ultima posicao mais alta criada dentro dentro dessa area, estante e prateleira pre-definida

const endereco = require("../../models/Endereco");

function expandePosicao(area, estante, prateleira, qtde_posicoes, ultima_posicao) {
  // padroes que o usuario vai definir

  const prox_posicao = parseInt(ultima_posicao) + 1;
  const posicao_maxima = parseInt(qtde_posicoes) + parseInt(ultima_posicao);

  // cria as posições
  for (var pos = prox_posicao; pos <= posicao_maxima; pos++) {
    const novoEndereco = {
      endereco: area + "." + estante + "." + prateleira + "." + pos,
    };
    new endereco(novoEndereco).save();
  }
}

module.exports = expandePosicao;