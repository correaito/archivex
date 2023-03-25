const express = require("express");
const router = express.Router();
const Documento = require("../models/Documento");
const Endereco = require("../models/Endereco");
const Situacao = require("../models/Situacao");
const Tipo = require("../models/Tipo");
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const htmlToPdf = require("html-pdf");
const bcrypt = require("bcryptjs");
const passport = require("passport");
require("../models/Usuario");
const Usuario = mongoose.model("Usuario"); 
const {eAutenticado} = require("../helpers/eAdmin")

// rota para carregar a tela de login
router.get("/login", (req, res) => {
  res.render("./usuarios/login");
});

// quando o usuario fizer a autenticação com sucesso enviamos a mensagem de sucesso
// do contrario redirecionamos para rota login novamente
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/usuarios/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success_msg", "Logado com sucesso!");
    res.redirect("/usuarios/listar_arquivos");
  }
);

router.get("/logout", (req, res, next) => {
  // desde a versão 6 do passport, temos que criar uma funcao assincrona para efetuar ao logout
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success_msg", "Deslogado com sucesso!");
    res.redirect("/usuarios/listar_arquivos");
  });
});

// rota que irá arquivar os documentos
router.get("/arquivar", eAutenticado, async (req, res) => {
  try {
    const ultimoDocumento = await Documento.aggregate([
      { $addFields: { numeroInt: { $toInt: "$numero" } } },
      { $sort: { numeroInt: -1 } },
      { $limit: 1 }
    ]).exec(); // consulta para obter o último documento
    const tipos = await Tipo.find().lean();
    const situacao = await Situacao.find().lean();
    const numero = ultimoDocumento.length > 0 ? ultimoDocumento[0].numeroInt + 1 : 1; // define o valor padrão como 1 caso não haja resultados na consulta
    const endereco = await Endereco.findOne({ status: "Vazio" }).sort({ endereco: 1 })
      .exec(); // consulta para obter o endereço mais baixo com status "Vazio"
    const enderecoCodigo = endereco ? endereco.endereco : ""; // define o valor padrão como uma string vazia caso não haja resultados na consulta
    res.render("./usuarios/arquivar", {
      numero: numero,
      endereco: enderecoCodigo,
      tipos: tipos,
      situacao: situacao
    }); // passa os valores definidos para a página Handlebars
  } catch (err) {
    console.log(err);
    res.render("./usuarios/arquivar", { numero: 1, endereco: ""}); // define os valores padrão em caso de falha na consulta
  }
});

// rota que irá efetivamente arquivar um novo documento
router.post("/grava_arquivo", async (req, res) => {
  try {
    const { numero, endereco, tipo, conteudo, situacao, caixa, imprimir_etiqueta } = req.body;
    const hash_code = await QRCode.toDataURL(
      JSON.stringify({ numero, endereco, tipo, conteudo, situacao })
    );
    const doc = {
      numero: numero,
      endereco: endereco,
      tipo: tipo,
      conteudo: conteudo,
      situação: situacao,
      hash_code: hash_code,
    };
    new Documento(doc).save();

    // Procurar o endereço correspondente no bd Endereco e atualizar o campo "documento" e
    // alterar o status para "ocupado"
    const enderecoEncontrado = await Endereco.findOne({ endereco });
    if (enderecoEncontrado) {
      await Endereco.findOneAndUpdate(
        { endereco },
        { $set: { caixa, status: "Ocupado", documento: numero } }
      );
    }
    // caso o usuario tenha marcado a caixa de seleção "imprimir etiqueta"
    if (imprimir_etiqueta) {
      console.log('caiu aqui!');
      req.flash("success_msg", "Arquivo gravado com sucesso");
      const redirectUrl = "/usuarios/arquivar?msg=" + encodeURIComponent("Arquivo gravado com sucesso");
      const script = `
        <script>
          window.open("/usuarios/gerar_etiqueta/${numero}", "_blank");
          window.location.replace("${redirectUrl}");
        </script>
      `;
      res.send(script);

    } else {
      req.flash("success_msg", "Arquivo gravado com sucesso");
      res.redirect("/usuarios/arquivar");
    }
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Houve um erro ao gravar o Arquivo");
    res.redirect("/usuarios/arquivar");
  }
});

// rota que irá carregar a tela de listagem de documentos arquivados
router.get("/listar_arquivos", eAutenticado, async (req, res) => {
  try {
    const documentos = await Documento.find().sort({numero: 1}).lean();
    res.render("usuarios/listar_arquivos", { documentos });
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Houve um erro ao listar os Arquivos");
    res.redirect("/usuarios/listar_arquivos");
  }
});


// essa rota irá imprimir a etiqueta na listagem de documentos
router.get("/gerar_etiqueta/:numero", async (req, res) => {
  try {
    const documento = await Documento.findOne({ numero: req.params.numero });

    if (!documento) {
      return res.status(404).send("Documento não encontrado.");
    }

    const { numero, endereco, conteudo, hash_code } = documento;
    const qr_code = await QRCode.toDataURL(JSON.stringify({ numero, endereco, conteudo }));

    const template = `
      <html>
        <head>
          <title>Etiqueta de Arquivo</title>
          <style>
          html, body {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            height: 100%;
          }

          *, *::before, *::after {
            box-sizing: inherit;
          }
          
          body {
            background-color: #fff;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 16px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .container {
            width: 58%;
            margin: 0 auto;
            padding: 30px;
            border: 2px solid #ccc;
          }
          
          .container h2 {
            background-color: #ccc;
            margin-top: 30px;
            margin-bottom: 50px;
            padding: 35px 30px;
            text-transform: uppercase;
          }
          
          .container p {
            margin: 10px 0;
          }
          
          .container img {
            display: block;
            margin: 10px auto 0;
            max-width: 100%;
          }
          
          @media print {
            body {
              font-size: 12px;
            }
          
            .container h2 {
              font-size: 50px;
            }
          }

          .etiqueta {
            border: 1px solid black;
            padding: 10px;
            writing-mode: vertical-lr;
            text-align: center;
            font-size: 40px;
            font-weight: bold;
            background-color: #eee;
          }
         </style>
        </head>
        <body class="etiqueta">
        <div class="container">
            <h2><i>Arquivo Morto</i></h2>
            ${conteudo}<br><br>
            <p><strong>Caixa/Pasta:</strong> ${numero}</p>
            <p style="font-size: 30px"><strong>Endereço:</strong> ${endereco}</p>
            <img src="${qr_code}" alt="QR Code">
          </div>
        </body>
      </html>
    `;

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `inline; filename="${numero}.pdf"`);

    htmlToPdf.create(template).toStream((err, pdfStream) => {
      if (err) {
        console.error(err);
        res.status(500).end();
        return;
      }
      pdfStream.pipe(res);
    });
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Houve um erro ao gerar a etiqueta");
    res.redirect("/usuarios/listar_arquivos");
  }
});

// rota para realizar a movimentão de e/s de documentos
router.get('/movimentacao', eAutenticado, (req, res) => {
  res.render('usuarios/movimentacao', { title: 'Ler QRCode' });
});

// rota que efetivamente irá registrar o movimento do documento (entrada/saida)
router.post('/ler-qrcode', (req, res) => {
  const { numero, endereco, conteudo } = JSON.parse(req.body.qrcodeData);
  const situacao = req.body.situacao;
  Documento.findOneAndUpdate({ endereco: endereco }, { situação: situacao }, { new: true }, (err, doc) => {
    if (err) {
      console.error(err);
      req.flash("error_msg", "Houve um erro ao gerar a etiqueta");
      res.redirect("/usuarios/movimentacao");
    } else {
      req.flash("success_msg", "Movimentação gravada com sucesso");
      res.redirect("/usuarios/movimentacao");
    }
  });
});

// carrega a tela de login
router.get("/login", (req, res) => {
  res.render("usuarios/login");
});

// carrega a tela de registro
router.get("/registro", (req, res) => {
  res.render("usuarios/registro");
});

// rota que registra efetivamente um novo usuario no sistema
router.post("/registro", (req, res) => {
  var erros = [];

  if (
    !req.body.nome ||
    typeof req.body.nome == undefined ||
    req.body.nome == null
  ) {
    erros.push({ texto: "Nome inválido" });
  }

  if (
    !req.body.email ||
    typeof req.body.email == undefined ||
    req.body.email == null
  ) {
    erros.push({ texto: "E-mail inválido" });
  }

  if (
    !req.body.senha ||
    typeof req.body.senha == undefined ||
    req.body.senha == null
  ) {
    erros.push({ texto: "Senha inválida" });
  }

  if (req.body.senha.length < 4) {
    erros.push({ texto: "Senha muito curta" });
  }
  if (req.body.senha != req.body.senha2) {
    erros.push({ texto: "As senhas são diferentes, tente novamente!" });
  }
  if (erros.length > 0) {
    res.render("usuarios/registro", { erros: erros });
  } else {
    Usuario.findOne({ email: req.body.email })
      .then((usuario) => {
        if (usuario) {
          req.flash(
            "error_msg",
            "Já existe uma conta com esse e-mail no nosso sistema"
          );
          res.redirect("/usuarios/registro");
        } else {
          const novoUsuario = new Usuario({
            nome: req.body.nome,
            email: req.body.email,
            senha: req.body.senha,
          });

          bcrypt.genSalt(10, (erro, salt) => {
            bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
              if (erro) {
                req.flash(
                  "error_msg",
                  "Houve um erro durante do salvamento do usuario"
                );
                res.redirect("/");
              }

              novoUsuario.senha = hash;
              novoUsuario
                .save()
                .then(() => {
                  req.flash("success_msg", "Usuario criado com sucesso!");
                  res.redirect("/usuarios/login");
                })
                .catch((err) => {
                  req.flash(
                    "error_msg",
                    "Houve um erro ao criar o usuário! Tente novamente!"
                  );
                  res.redirect("/usuarios/registro");
                });
            });
          });
        }
      })
      .catch((err) => {
        req.flash("error_msg", "Houve um erro interno");
        res.redirect("/");
      });
  }
});

// Rota para carregar a tela de edição de documentos
router.get('/editar_arquivo/:numero', async (req, res) => {
  try {
    const numero = req.params.numero;
    const doc = await Documento.findOne({numero: numero}).lean();

    const sit_bd = await Situacao.find().lean();
    const tipo_bd = await Tipo.find().lean();

    if (!doc || !sit_bd) {
      return res.status(404).send('Documento não encontrado');
    }

    res.render('usuarios/editar_arquivo', { 
      numero: doc.numero,
      endereco: doc.endereco,
      tipo: doc.tipo,
      situacao: doc.situação,
      conteudo: doc.conteudo,
      situacao_bd: sit_bd,
      tipo_bd: tipo_bd
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao carregar dados do documento');
  }
});

// Rota para gravar efetivamente as alterações na tela /editar_arquivo
router.post('/atualiza_arquivo', async (req, res) => {
  const { numero, tipo, conteudo, situacao, endereco } = req.body;
  const verifica_ocupado = await Endereco.findOne({documento: numero});

  try {
    if (situacao == 'Expurgado') {
      const atualiza = await Endereco.findOneAndUpdate(
        { endereco: endereco }, {status: "Vazio", documento: 0}, { new: true });
    }
    if ((!verifica_ocupado) && (situacao == 'Arquivado')) {
      req.flash('error_msg', 'Você não pode alterar para "Arquivado" um documento que já foi Expurgado! Mas você pode rearquiva-lo novamente!');
      return res.redirect('/usuarios/listar_arquivos');
    }

    const documentoAtualizado = await Documento.findOneAndUpdate(
      { numero: numero }, {tipo: tipo, conteudo: conteudo, situação: situacao, endereco: endereco}, { new: true });

    if (!documentoAtualizado) {
      return res.status(404).send('Documento não encontrado');
    }

    // 
    req.flash('success_msg', 'Cadastro atualizado com sucesso!')
    res.redirect('/usuarios/listar_arquivos'); 
  } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Ocorreu um erro ao atualizar o arquivo!')
      res.redirect('/usuarios/listar_arquivos');
    }
});

// Rota para visualizar os dados do documento
router.get('/visualizar_arquivo/:numero', async (req, res) => {
  try {
    const numero = req.params.numero;
    const doc = await Documento.findOne({numero: numero}).lean();

    const sit_bd = await Situacao.find().lean();
    const tipo_bd = await Tipo.find().lean();

    if (!doc || !sit_bd) {
      return res.status(404).send('Documento não encontrado');
    }

    res.render('usuarios/visualizar_arquivo', { 
      numero: doc.numero,
      endereco: doc.endereco,
      tipo: doc.tipo,
      situacao: doc.situação,
      conteudo: doc.conteudo,
      situacao_bd: sit_bd,
      tipo_bd: tipo_bd
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao carregar dados do documento');
  }
});

// rota para visualizar os dados cadastrais do usuario
router.get("/dados_conta", eAutenticado, (req, res) => {
  res.render("./usuarios/account/dados_conta");
});

// rota para visualizar graficamente a disposição da estrutura do arquivo morto
router.get('/layout', eAutenticado, async (req, res) => {
  try {
    // Buscar todos os registros na ordem crescente do campo endereco
    const enderecos = await Endereco.find().sort({ endereco: 1 }).lean();
    const areas = new Set(enderecos.map(e => e.endereco.split('.')[0]));
    const sortedAreas = Array.from(areas).sort();

    // Separar os endereços em áreas, estantes, prateleiras e posições
    const areasEstantes = {};
    const maxPosicoesPorPrateleira = {};
    for (const endereco of enderecos) {
      const [area, estante, prateleira, posicao] = endereco.endereco.split('.');
      // aqui criamos uma função para verificar qual a posição máxima por cada prateleira (iremos usa-la mais a frente)
      const maxPosicao = maxPosicoesPorPrateleira[`${area}.${estante}.${prateleira}`] || 0;
      maxPosicoesPorPrateleira[`${area}.${estante}.${prateleira}`] = Math.max(maxPosicao, posicao);

      if (!areasEstantes[area]) {
        areasEstantes[area] = new Set();
      }
      areasEstantes[area].add(estante);
    }

    // Ordenar as áreas e estantes numericamente
    for (const area in areasEstantes) {
      areasEstantes[area] = Array.from(areasEstantes[area]).sort();
    }
    const sortedEstantes = Array.from(new Set(Object.values(areasEstantes).flat())).sort();

    // Construir o HTML dinamicamente
    const html = ` 
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ArchiveX</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" />
    </head>
    <style>
      body {
        font-family: "Lato", sans-serif;
      }

      .livro {
        width: 42px;
        height: 90px;
        background-color: #efefef;
        margin: 5px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        font-size: 13px;
        font-weight: bold;
        word-wrap: break-word;
      }

      .area {
        font-size: 30px;
        padding: 20px 0;
        font-weight: bold;
      }

      @media (min-width: 992px) {
        .prateleira {
          margin-right: 20px;
        }
      }

      @media (max-width: 767px) {
        .estante {
          margin-top: 20px;
        }
      }

      .ocupado {
        background-color: rgb(247, 145, 122);
      }

      .vazio {
        background-color: rgb(140, 251, 140);
      }
    </style>

    <body>

    <div class="container">
      ${sortedAreas.map((area) => `
        <div class="row">
          <div class="col-12">
            <div class="area">
              <div class="area-label text-center">Área: ${area}</div>
            </div>
          </div>
        </div>
        <div class="row justify-content-md-center">
          ${areasEstantes[area].map((estante) => `
            <div class="col-lg-auto col-sm-auto col-md-auto">
              <div class="estante mb-3" style="display:flex;justify-content: center; flex-direction:column;align-items:center">
                <div class="estante-label text-center">Area: ${area} - Estante ${estante}</div>
                ${enderecos.filter((endereco) => {
                  const [a, e, p, l] = endereco.endereco.split('.');
                  return a === area && e === estante;
                }).map((endereco) => {
                  const [a, e, p, l] = endereco.endereco.split('.');
                  const status = endereco.status || 'Vazio';
                  const documento = endereco.documento || '';
                  const classe = status === 'Vazio' ? 'vazio' : 'ocupado';
                  var livro = '';
                  if (l == 1) {
                    livro += `<div class="prateleira row"><div class="livro ${classe}">${status === 'Vazio' ? 'VAZIO' : 'CX '+documento} </div>`;
                  }
                  if (l != 1) {
                    livro += `<div class="livro ${classe}">${status === 'Vazio' ? 'VAZIO' : 'CX '+ documento} </div>`;
                  }
                  // aqui usamos a função que criamos anteriormente para verificar se estamos no volta de repetição que é 
                  // a ultima posição da prateleira, e se for, fechamos a div
                  if (l == maxPosicoesPorPrateleira[`${area}.${estante}.${p}`]) {
                    livro += `</div>`;
                  }
                  return livro;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  </body>
</html>`;

// Enviar resposta com o HTML
res.send(html);
} catch (error) {
// Enviar resposta com mensagem de erro em caso de falha
res.status(500).json({ message: error.message });
}
});

// endpoint que grava as alterações cadastrais do usuario
router.post('/altera_cadastro/:id', eAutenticado, async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { nome: req.body.nome, email: req.body.email },
      { new: true }
    );
    req.flash('success_msg', 'Cadastro de Usuário atualizado com sucesso!');
    res.redirect('/usuarios/dados_conta');
  } catch (err) {
    req.flash("error_msg", "Houve um erro interno ao tentar atualizar o cadastro!");
    res.redirect("/usuarios/dados_conta");
  }
});

// carrega a tela de alteração da senha do usuario
router.get("/altera_senha", eAutenticado, (req, res) => {
  res.render("./usuarios/account/altera_senha");
});

// endpoint que altera efetivamente a senha do usuario
router.post('/alterar_senha', async (req, res) => {
  try {
    const { senhaAtual, novaSenha, confirmacaoSenha } = req.body;
    const usuario = await Usuario.findOne({ email: req.user.email });

    if (!usuario) {
      req.flash("error_msg", "Usuário não encontrado!");
      return res.redirect("/usuarios/altera_senha");
    }

    // Verificar se a senha atual fornecida corresponde à senha armazenada no banco de dados
    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaCorreta) {
      req.flash("error_msg", "Senha atual incorreta!");
      return res.redirect("/usuarios/altera_senha");
    }

    // Verificar se a nova senha e a confirmação de senha correspondem e atendem aos critérios de segurança
    if (novaSenha !== confirmacaoSenha) {
      req.flash("error_msg", "As senhas não coincidem!");
      return res.redirect("/usuarios/altera_senha");
    }
    // Verificar se a senha tem pelo menos 6 caracteres
    if (novaSenha.length < 6) {
      req.flash("error_msg", "A nova senha deve ter pelo menos 6 caracteres!");
      return res.redirect("/usuarios/altera_senha");
    }

    // Criptografar a nova senha antes de salvá-la no banco de dados
    const salt = await bcrypt.genSalt(10);
    const hashNovaSenha = await bcrypt.hash(novaSenha, salt);

    // Atualizar a senha do usuário no banco de dados
    usuario.senha = hashNovaSenha;
    await usuario.save();

    req.flash('success_msg', 'Senha alterada com sucesso!');
    res.redirect('/usuarios/altera_senha');
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Houve um erro interno ao tentar atualizar a senha!");
    res.redirect("/usuarios/altera_senha");
  }
});

module.exports = router;