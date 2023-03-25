const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    nome: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now(),
    },
  });

// criando a collection chamada "Situacao"
const situacao = mongoose.model("Situacao", categorySchema, "situacao");

// e aqui vamos exportar esse módulo
module.exports = situacao;
