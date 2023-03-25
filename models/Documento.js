const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  numero: {
    type: Number,
    required: true,
  },
  endereco: {
    type: String,
    endereco: true,
  },
  tipo: {
    type: String,
    required: true
  },
  conteudo: {
    type: String,
    required: true,
  },
  hash_code: {
    type: String,
    required: true
  },
  situação: {
    type: String,
    required: true
  }
});

// criando a collection chamada "documento"
const documento = mongoose.model("documento", categorySchema);

// e aqui vamos exportar esse módulo
module.exports = documento;
