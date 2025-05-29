import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  doc
} from "./firebase.js";
import { jsPDF } from "jspdf";

const categorias = {
  "Papas": [
    { nombre: "Salchi Papa", precio: 1.5 },
    { nombre: "Salchi Huevo", precio: 1.75 },
    { nombre: "Papi Carne", precio: 2.0 },
    { nombre: "Papi Pollo", precio: 2.25 }
  ],
  "Hamburguesas": [
    { nombre: "Hamburguesa Sencilla", precio: 1.5 },
    { nombre: "Carne y huevo", precio: 1.75 },
    { nombre: "Carne y queso", precio: 2.0 },
    { nombre: "Carne y jamón", precio: 2.0 },
    { nombre: "Carne, queso y jamón", precio: 2.5 },
    { nombre: "Carne, queso, jamón y huevo", precio: 2.75 },
    { nombre: "Doble carne", precio: 2.25 },
    { nombre: "Carne, queso, piña", precio: 2.5 }
  ],
  "Combos": [
    { nombre: "Sencilla + papas", precio: 2.5 },
    { nombre: "Carne y huevo + papas", precio: 2.75 },
    { nombre: "Carne y queso + papas", precio: 3.0 },
    { nombre: "Carne y jamón + papas", precio: 3.0 },
    { nombre: "Carne, queso y jamón + papas", precio: 3.5 },
    { nombre: "Carne, queso, jamón y huevo + papas", precio: 3.75 },
    { nombre: "Doble carne + papas", precio: 3.25 },
    { nombre: "Carne, queso, piña + papas", precio: 3.5 },
    { nombre: "Completa", precio: 3.0 },
    { nombre: "Súper completa", precio: 3.25 },
    { nombre: "Completa + papas", precio: 4.0 },
    { nombre: "Súper completa + papas", precio: 4.25 }
  ],
  "Extras": [
    { nombre: "Porción de papas", precio: 1.25 }
  ],
  "Bebidas": [
    { nombre: "Gaseosa 250ml", precio: 0.5 },
    { nombre: "Gaseosa 500ml", precio: 0.75 },
    { nombre: "Agua sin gas 600ml", precio: 0.75 }
  ]
};

let carrito = [];
let ventas = [];

const app = document.getElementById("app");

function render() {
  const total = getTotal();
  app.innerHTML = `
    <h1 class="text-2xl font-bold mb-4 text-center">POS PAPAS DE LA OCCI</h1>
    <div id="productos" class="mb-4 max-h-96 overflow-y-auto"></div>

    <div class="mb-2">
      <h2 class="font-semibold text-lg">Pedido actual:</h2>
      <ul id="carrito-lista" class="text-sm mb-2"></ul>
      <div class="text-lg">Total: $<span id="total">${total.toFixed(2)}</span></div>
    </div>

    <div class="flex gap-2 mb-2">
      <button id="registrar" class="bg-green-600 text-white px-4 py-2 rounded w-full">Registrar pedido</button>
      <button id="reporte" class="bg-blue-600 text-white px-4 py-2 rounded w-full">Ver reporte</button>
    </div>

    <div class="flex gap-2 mb-4">
      <button id="reporteDiario" class="bg-yellow-600 text-white px-4 py-2 rounded w-full">Reporte Diario</button>
      <button id="limpiar" class="bg-red-600 text-white px-4 py-2 rounded w-full">Limpiar pedidos viejos</button>
    </div>

    <div id="reporteVentas" class="mt-4 text-sm"></div>
  `;

  const productosDiv = document.getElementById("productos");
  productosDiv.innerHTML = "";

  for (const categoria in categorias) {
    const titulo = document.createElement("h3");
    titulo.textContent = categoria;
    titulo.className = "text-xl font-bold mt-4 mb-2";
    productosDiv.appendChild(titulo);

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-2 sm:grid-cols-3 gap-2";

    categorias[categoria].forEach((prod) => {
    const card = document.createElement("div");
    card.className = "producto-card";

    card.innerHTML = `
      <div class="producto-nombre">${prod.nombre}</div>
      <div class="producto-precio">S/ ${prod.precio.toFixed(2)}</div>
    `;

    card.onclick = () => {
      carrito.push(prod);
      render();
    };

    grid.appendChild(card);
  });



    productosDiv.appendChild(grid);
  }

  const carritoLista = document.getElementById("carrito-lista");
  carritoLista.innerHTML = ""; // Asegúrate de limpiar la lista antes de renderizar

  carrito.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center border-b py-1";

    const span = document.createElement("span");
    span.textContent = `${item.nombre} ($${item.precio.toFixed(2)})`;

    const button = document.createElement("button");
    button.className = "text-red-500 text-xs";
    button.textContent = "❌";
    button.addEventListener("click", () => {
      eliminarProducto(index);
    });

    li.appendChild(span);
    li.appendChild(button);
    carritoLista.appendChild(li);
  });

  const totalElement = document.getElementById("total");
  totalElement.textContent = total.toFixed(2);

  document.getElementById("registrar").onclick = async () => {
    if (carrito.length > 0) {
      try {
        const pedido = {
          timestamp: serverTimestamp(),
          productos: carrito,
          total: getTotal()
        };
        await addDoc(collection(db, "pedidos"), pedido);
        ventas.push([...carrito]);
        carrito = [];
        alert("Pedido guardado en la nube ✅");
        render();
      } catch (e) {
        console.error("Error al guardar en Firebase:", e);
        alert("Error al guardar pedido ❌");
      }
    }
  };

  document.getElementById("reporte").onclick = () => {
    const resumen = {};
    ventas.forEach(pedido => {
      pedido.forEach(prod => {
        if (resumen[prod.nombre]) {
          resumen[prod.nombre].unidades++;
          resumen[prod.nombre].total += prod.precio;
        } else {
          resumen[prod.nombre] = { unidades: 1, total: prod.precio };
        }
      });
    });

    const totalVentas = ventas.flat().reduce((a, b) => a + b.precio, 0).toFixed(2);
    const totalPedidos = ventas.length;

    let reporteHTML = `<strong>Total vendido:</strong> $${totalVentas}<br><strong>Pedidos:</strong> ${totalPedidos}<br><br>`;
    reporteHTML += `<div class="text-left"><strong>Detalle por producto:</strong><ul>`;
    for (const nombre in resumen) {
      const r = resumen[nombre];
      reporteHTML += `<li>${nombre}: ${r.unidades} uds - $${r.total.toFixed(2)}</li>`;
    }
    reporteHTML += `</ul></div>`;
    document.getElementById("reporteVentas").innerHTML = reporteHTML;
  };

  document.getElementById("reporteDiario").onclick = generarReporteDiario;
  document.getElementById("limpiar").onclick = limpiarPedidosAntiguos;
}

function eliminarProducto(index) {
  carrito.splice(index, 1);
  render();
}

function getTotal() {
  return carrito.reduce((a, b) => a + b.precio, 0);
}

window.eliminarProducto = eliminarProducto;

function generarPDF(fecha, totalVentas, totalPedidos, resumen) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Reporte Diario - ${fecha}`, 10, 10);
  doc.setFontSize(12);
  doc.text(`Total de pedidos: ${totalPedidos}`, 10, 20);
  doc.text(`Total vendido: $${totalVentas.toFixed(2)}`, 10, 30);

  doc.setFontSize(10);
  doc.text("Detalle por producto:", 10, 40);

  let y = 50;
  for (const nombre in resumen) {
    const { unidades, total } = resumen[nombre];
    doc.text(`${nombre}: ${unidades} uds - $${total.toFixed(2)}`, 10, y);
    y += 8;
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  }

  doc.save(`reporte_${fecha}.pdf`);
}
 
  const { jsPDF } = window.jspdf;

async function generarReporteDiario() {
  const ahora = new Date();
  const inicioDelDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioTimestamp = Timestamp.fromDate(inicioDelDia);

  const pedidosRef = collection(db, "pedidos");
  const q = query(pedidosRef, where("timestamp", ">=", inicioTimestamp));
  const snapshot = await getDocs(q);

  const resumen = {};
  let total = 0;
  let pedidos = 0;

  snapshot.forEach(doc => {
    const pedido = doc.data();
    pedido.productos.forEach(prod => {
      if (!resumen[prod.nombre]) resumen[prod.nombre] = { unidades: 0, total: 0 };
      resumen[prod.nombre].unidades += 1;
      resumen[prod.nombre].total += prod.precio;
      total += prod.precio;
    });
    pedidos++;
  });

  const fechaHoy = ahora.toISOString().split("T")[0];

  let html = `<strong>Pedidos de hoy:</strong> ${pedidos}<br><strong>Total vendido:</strong> $${total.toFixed(2)}<br><br>`;
  html += "<ul>";
  for (const nombre in resumen) {
    const r = resumen[nombre];
    html += `<li>${nombre}: ${r.unidades} uds - $${r.total.toFixed(2)}</li>`;
  }
  html += "</ul>";
  document.getElementById("reporteVentas").innerHTML = html;

  generarPDF(fechaHoy, total, pedidos, resumen);
}

async function limpiarPedidosAntiguos() {
  const ahora = new Date();
  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  const limite = Timestamp.fromDate(hace24h);

  const pedidosRef = collection(db, "pedidos");
  const q = query(pedidosRef, where("timestamp", "<", limite));
  const snapshot = await getDocs(q);

  for (const docu of snapshot.docs) {
    await deleteDoc(doc(db, "pedidos", docu.id));
  }

  alert("Pedidos antiguos eliminados ✅");
}

render();
