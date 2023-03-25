const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
require("../models/Endereco.js");
const { eAdmin } = require("../helpers/eAdmin");
const Endereco = require("../models/Endereco");
const Usuario = require("../models/Usuario");
const Situacao = require("../models/Situacao");
const Tipo = require("../models/Tipo");

const buscarMaiorArea = require("./controllers/buscaArea");
const expandeArea = require("./controllers/expandeArea");

const buscarMaiorNumeroEstante = require("./controllers/buscaEstante");
const expandeEstante = require("./controllers/expandeEstante");

const buscarMaiorNumeroPrateleira = require("./controllers/buscaPrateleira");
const expandePrateleira = require("./controllers/expandePrateleira");

const buscarMaiorNumeroPosicao = require("./controllers/buscaPosicao");
const expandePosicao = require("./controllers/expandePosicao");

// rota de ampliação da estrutura do arquivo morto
// carrega auto nos campos de área/estante/prateleira/posicao os registros existentes do bd
router.get("/estrutura/ampliar", eAdmin, (req, res) => {
  Endereco.find()
    .lean()
    .then((enderecos) => {
      const lista_areas = [];
      const lista_estantes = [];
      const lista_prateleiras = [];
      const lista_posicoes = [];
      // Extrai os dois primeiros dígitos do endereçamento. Ex (A1.1.1.1), extrai o A1
      enderecos.forEach((obj) => {
        const partes = obj.endereco.split("."); // retorna ['A1', '2', '1', '1']
        lista_areas.push(partes[0]);
        lista_estantes.push(partes[1]);
        lista_prateleiras.push(partes[2]);
        lista_posicoes.push(partes[3]);
      });
      // remove os itens duplicados da lista
      const list_areas = [...new Set(lista_areas)];
      const list_estantes = [...new Set(lista_estantes)];
      const list_prateleiras = [...new Set(lista_prateleiras)];
      const list_posicoes = [...new Set(lista_posicoes)];

      res.render("./admin/estrutura/ampliar", {
        areas: list_areas,
        estantes: list_estantes,
        prateleiras: list_prateleiras,
        posicoes: list_posicoes,
      });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao carregar os endereços");
      res.redirect("./admin/estrutura/ampliar");
    });
});

// rota que irá ampliar a estrutura do arquivo morto efetivamente
router.post("/ampl/estrutura/", async (req, res) => {
  const area = req.body.area;
  const estante = req.body.estante;
  const prateleira = req.body.prateleira;
  const posicao = req.body.posicao;

  const ampliar_area = req.body.ampliar_area;
  const ampliar_estante = req.body.ampliar_estante;
  const ampliar_prateleira = req.body.ampliar_prateleira;
  const ampliar_posicao = req.body.ampliar_posicao;

  const padrao_estante = req.body.padrao_estante;
  const padrao_prateleira = req.body.padrao_prateleira;
  const padrao_posicao = req.body.padrao_posicao;

  if (area == "ampliar") {
    const ultima_area = await buscarMaiorArea();
    expandeArea(
      ampliar_area,
      padrao_estante,
      padrao_prateleira,
      padrao_posicao,
      ultima_area
    );
  } else if (estante == "ampliar") {
    const ultima_estante = await buscarMaiorNumeroEstante(area);
    expandeEstante(
      area,
      ampliar_estante,
      padrao_prateleira,
      padrao_posicao,
      ultima_estante
    );
  } else if (prateleira == "ampliar") {
    const ultima_prateleira = await buscarMaiorNumeroPrateleira(area, estante);
    expandePrateleira(
      area,
      estante,
      ampliar_prateleira,
      padrao_posicao,
      ultima_prateleira
    );
  } else if (posicao == "ampliar") {
    const ultima_posicao = await buscarMaiorNumeroPosicao(
      area,
      estante,
      prateleira
    );
    expandePosicao(area, estante, prateleira, ampliar_posicao, ultima_posicao);
  }

  // retorna a resposta para o cliente
  req.flash("success_msg", "Endereçamentos gravados com sucesso");
  res.redirect("/admin/estrutura/ampliar");
});

// rota que irá listar todos os endereços do arquivo morto
router.get("/listar_enderecos", eAdmin, async (req, res) => {
  const page_size = 6;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * page_size;

  try {
    const enderecos = await Endereco.find()
      .sort({ endereco: 1 })
      .skip(skip)
      .lean();
    res.render("admin/estrutura/listar_enderecos", { enderecos });
  } catch (err) {
    console.log(err);
    res.status(500).send("Erro ao listar endereços.");
  }
});

// rota usada para carregar os usuarios registrados do bd no campo 'usuario' da tela /usuarios/altera_nivel
router.get("/usuarios/:nome", async (req, res) => {
  const nome = req.params.nome;
  const usuarios = await Usuario.find({
    nome: new RegExp(`^${nome}`, "i"),
  }).limit(10);
  const nomesUsuarios = usuarios.map((usuario) => usuario.nome);
  res.json(nomesUsuarios);
});

// rota para alterar o nível do usuario no sistema (user/admin)
router.get("/altera_nivel", eAdmin, (req, res) => {
  res.render("./admin/altera_nivel");
});

// rota que altera efetivamente o nível do usuário no sistema (user/admin)
router.post("/alterar_usuario", async (req, res) => {
  const nome = req.body.nome;
  const nivel = req.body.nivel;

  try {
    if (nome) {
      await Usuario.findOneAndUpdate(
        { nome: nome },
        { $set: { eAdmin: nivel } }
      );

      req.flash("success_msg", "Nível de usuário atualizado com sucesso!");
      res.redirect("/admin/altera_nivel");
    } else {
      console.log("Nome do usuário não fornecido");
    }
  } catch (error) {
    req.flash("error_msg", "Ocorreu um erro ao atualizar o nível do usuário!");
    res.redirect("/admin/altera_nivel");
  }
});

// rota para cadastrar novas "situações"
router.get("/cadastro/situacoes", eAdmin, (req, res) => {
  res.render("./admin/cadastros/situacoes");
});

// rota que cadastra efetivamente uma nova "situação"
router.post("/cadastra_situacao", async (req, res) => {
  try {
    const nome = req.body.nome;
    const slug = req.body.slug;

    const novaSituacao = {
      nome: nome,
      slug: slug,
    };

    await new Situacao(novaSituacao).save();

    req.flash("success_msg", "Situação cadastrada com sucesso!");
    res.redirect("/admin/cadastro/situacoes");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao cadastrar a situação!");
    res.redirect("/admin/cadastro/situacoes");
  }
});

// rota para cadastrar novos "Tipos"
router.get("/cadastro/tipos", eAdmin, (req, res) => {
  res.render("./admin/cadastros/tipos");
});

// rota para cadastrar efetivamente novos "Tipos"
router.post("/cadastra_tipo", async (req, res) => {
  try {
    const nome = req.body.nome;
    const slug = req.body.slug;

    const novoTipo = {
      nome: nome,
      slug: slug,
    };

    await new Tipo(novoTipo).save();

    req.flash("success_msg", "Tipo cadastrado com sucesso!");
    res.redirect("/admin/cadastro/tipos");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Ocorreu um erro ao cadastrar o Tipo!");
    res.redirect("/admin/cadastro/tipos");
  }
});

module.exports = router;
