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

// criando a collection chamada "Tipo"
const tipo = mongoose.model("Tipo", categorySchema, "tipo");

// e aqui vamos exportar esse módulo
module.exports = tipo;
