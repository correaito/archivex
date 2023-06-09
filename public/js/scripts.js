$(document).ready(function(){
  $('.dropdown-link').on("click", function(e){
      $(this).next('.dropdown-menu-subitem').toggle();
  e.stopPropagation();
  e.preventDefault();
  });
});


$(document).ready(function(){
  if (window.innerWidth < 768) {
    document.querySelector(".table-hover").classList.add("table-responsive");
    document.querySelector(".btn-primary").classList.add("mt-2");
  } else {
    document.querySelector(".table-hover").classList.remove("table-responsive");
    document.querySelector(".btn-primary").classList.remove("mt-2");
  }
});

$(document).ready(function () {
  $("#tabela-documentos").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],

    colReorder: true,

    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",

    columnDefs: [
      {
        "targets": 3,
        "render": function (data, type, row, meta) {
          return (data.length > 15) ?
            data.substr(0, 15) + "..." :
            data;
        }
      }
    ],

    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],

    language: {
      lengthMenu: "Mostrando _MENU_ resultados por página",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Anterior",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
  });
});

$(document).ready(function () {
  $("#tabela-enderecos").DataTable({
    lengthMenu: [
      [8, 25, 50, -1],
      [8, 25, 50, "Todos"],
    ],

    colReorder: true,

    dom: "Brft<'row'<'col-md-4'l><'col-md-8'p>>",

    buttons: [
      {
        extend: "pdfHtml5",
        text: "Salvar em PDF",
      },
      {
        extend: "excelHtml5",
        text: "Salvar em Excel",
      },
    ],

    language: {
      lengthMenu: "Mostrando _MENU_ resultados por página",
      zeroRecords: "Nada encontrado - desculpe",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sem resultados avaliados",
      infoFiltered: "(filtrado de _MAX_ total registros)",
      paginate: {
        first: "Primeiro",
        last: "Anterior",
        next: "Próximo",
        previous: "Anterior",
      },
      search: "Buscar:",
    },
  });
});

// mensagem de alerta quadno não há mais endereços vagos
if (document.getElementById("endereco")) {
  // mensagem de alerta quadno não há mais endereços vagos
  var endereco = document.getElementById("endereco");
  if (!endereco.value) {
    alert(
      "Alerta! Não há mais endereços vagos para arquivar documentos. Alerte o Administrador do Arquivo Morto!"
    );
  }
}

function goBack() {
  window.history.go(-1);
}




