const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  eAdmin: {
    type: Number,
    default: 0
  },
  senha: {
    type: String,
    required: true,
  },
});

// criando a collection chamada "Usuario"
const usuario = mongoose.model("Usuario", categorySchema);

// e aqui vamos exportar esse módulo
module.exports = usuario;