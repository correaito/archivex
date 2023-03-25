// Nessa função ele cria a quantidade de áreas que o usuario desejar, expansão ou criação.
// Não há referencias de hierarquia, mas o sistema irá checar qual foi a ultima área criada, e gerar a partir dai

const endereco = require("../../models/Endereco");

function expandeArea(qtde_area, qtde_estantes, qtde_prateleiras, qtde_posicoes, ultima_area) {

  if (!ultima_area) {
    for (let i = 0; i < qtde_area; i++) {
      // Gera a parte da letra da codificação
      const letra = String.fromCharCode(65 + (i % 26));

      // gera a parte do número da codificação
      const numero = Math.floor(i / 26) + 1; 
      // cria as estantes
      for (var e = 1; e <= qtde_estantes; e++) {
        // cria as prateleiras
        for (var p = 1; p <= qtde_prateleiras; p++) {
          // cria as posições
          for (var pos = 1; pos <= qtde_posicoes; pos++) {
            const novoEndereco = {
              endereco: letra + numero + "." + e + "." + p + "." + pos};
            new endereco(novoEndereco).save();
          }
        }
      }
    }
  } else {
    // aqui faremos as conversoes
    let prim_termo = ultima_area.charCodeAt(0);
    let letra = prim_termo + 1;

    numero = ultima_area.charAt(1);

    // aqui ele irá criar as áreas
    for (let i = 0; i < qtde_area; i++) {
      // cria as estantes
      for (let e = 1; e <= qtde_estantes; e++) {
        // cria as prateleiras
        for (let p = 1; p <= qtde_prateleiras; p++) {
          // cria as posições
          for (let pos = 1; pos <= qtde_posicoes; pos++) {
            const novoEndereco = {
              endereco: String.fromCharCode(letra) + numero + "." + e + "." + p + "." + pos};
            new endereco(novoEndereco).save();
          }
        }
      }

      // atualiza a letra e o número da codificação
      if (letra === 90) {
        letra = 65;
        numero++;
      } else {
        letra = letra + 1;
      }
    }
  }
}


module.exports = expandeArea;
