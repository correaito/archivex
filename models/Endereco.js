const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  endereco: {
    type: String,
    required: true,
  }, 
  status: {
    type: String,
    required: true, 
    default: "Vazio"
  },
  documento: {
    type: String,
    required: true,
    default: "0"
  },
});

// criando a collection chamada "Endereco"
const endereco = mongoose.model("Endereco", categorySchema);

// e aqui vamos exportar esse módulo
module.exports = endereco;
