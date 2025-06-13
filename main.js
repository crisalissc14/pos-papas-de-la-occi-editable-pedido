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
const { jsPDF } = window.jspdf;

const productos = [
  { nombre: "Salchi Papa", precio: 1.5 },
  { nombre: "Salchi Huevo", precio: 1.75 },
  { nombre: "Papi Carne", precio: 2.0 },
  { nombre: "Papi Pollo", precio: 2.25 },
  { nombre: "Completa UNO 1", precio: 3.0 },
  { nombre: "Completa DOS 2", precio: 3.25 },
  { nombre: "PAPA Súper Completa", precio: 4.0 },
  { nombre: "Porción de papas", precio: 1.25 },
  { nombre: "Hamburguesa SIMPLE", precio: 1.5 },
  { nombre: "Carne y huevo", precio: 1.75 },
  { nombre: "Carne y queso", precio: 2.0 },
  { nombre: "Carne y jamón", precio: 2.0 },
  { nombre: "Carne, queso y jamón", precio: 2.5 },
  { nombre: "Carne, queso, jamón y huevo", precio: 2.75 },
  { nombre: "Doble carne", precio: 2.25 },
  { nombre: "Carne, queso, piña", precio: 2.5 },
  { nombre: "Sencilla + PAPAS", precio: 2.5 },
  { nombre: "Carne y huevo + PAPAS", precio: 2.75 },
  { nombre: "Carne y queso + PAPAS", precio: 3.0 },
  { nombre: "Carne y jamón + PAPAS", precio: 3.0 },
  { nombre: "Carne, queso y jamón + PAPAS", precio: 3.5 },
  { nombre: "Carne, queso, jamón y huevo + PAPAS", precio: 3.75 },
  { nombre: "Doble carne + PAPAS", precio: 3.25 },
  { nombre: "Carne, queso, piña + PAPAS", precio: 3.5 },
  { nombre: "Hamburguesa Completa", precio: 3.0 },
  { nombre: "Hambuguesa Súper completa", precio: 3.25 },
  { nombre: "Hamburguesa Completa + PAPAS", precio: 4.0 },
  { nombre: "Hamburguesa Súper completa + PAPAS", precio: 4.25 },
  { nombre: "Gaseosa PEQUEÑA 250ml", precio: 0.5 },
  { nombre: "Gaseosa GRANDE 500ml", precio: 0.75 },
  { nombre: "Agua sin gas 600ml", precio: 0.75 }
];

let carrito = [];
let ventas = [];
let local = localStorage.getItem("local");

if (!local) {
  local = prompt("¿Desde qué local estás vendiendo? (ej: Celular 1, Sucursal B)");
  localStorage.setItem("local", local);
}


const app = document.getElementById("app");

function render() {
  const total = getTotal();
  app.innerHTML = `
    <div class="max-w-screen-lg mx-auto p-4">
      <h1 class="text-3xl font-bold mb-6 text-center">POS PAPAS DE LA OCCI</h1>

      <div id="productos" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-[32rem] overflow-y-auto"></div>

      <div class="mb-4">
        <h2 class="font-semibold text-xl mb-2">Pedido actual:</h2>
        <ul id="carrito-lista" class="text-base mb-2"></ul>
        <div class="text-xl font-semibold">Total: $<span id="total">${total.toFixed(2)}</span></div>
      </div>

      <div class="flex flex-col md:flex-row gap-4 mb-4">
        <button id="registrar" class="bg-green-600 text-white px-6 py-3 rounded text-lg w-full">Registrar pedido</button>
        <button id="reporte" class="bg-blue-600 text-white px-6 py-3 rounded text-lg w-full">Ver reporte</button>
      </div>

      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <button id="reporteDiario" class="bg-yellow-600 text-white px-6 py-3 rounded text-lg w-full">Reporte Diario</button>
        <button id="limpiar" class="bg-red-600 text-white px-6 py-3 rounded text-lg w-full">Limpiar pedidos viejos</button>
      </div>

      <div id="reporteVentas" class="mt-6 text-base"></div>
    </div>
  `;

  const productosDiv = document.getElementById("productos");
  productos.forEach((prod, idx) => {
    const btn = document.createElement("button");
    btn.textContent = `${prod.nombre} ($${prod.precio.toFixed(2)})`;
    btn.className = "bg-white border border-gray-300 text-left px-4 py-3 rounded-lg shadow-md text-base font-semibold hover:bg-gray-100 transition";
    btn.onclick = () => {
      carrito.push(prod);
      render();
    };
    productosDiv.appendChild(btn);
  });

  const carritoLista = document.getElementById("carrito-lista");
  carrito.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center border-b py-2";
    li.innerHTML = `
      <span>${item.nombre} ($${item.precio.toFixed(2)})</span>
      <button class="text-red-500 text-sm font-bold" onclick="eliminarProducto(${index})">❌</button>
    `;
    carritoLista.appendChild(li);
  });

  document.getElementById("registrar").onclick = async () => {
    if (carrito.length > 0) {
      try {
        const pedido = {
          timestamp: serverTimestamp(),
          productos: carrito,
          total: getTotal(),
          local: local// agregaste esto
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
window.eliminarProducto = eliminarProducto

async function generarReporteDiario() {
  const ahora = new Date();
  const inicioDelDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioTimestamp = Timestamp.fromDate(inicioDelDia);

  const pedidosRef = collection(db, "pedidos");
  const q = query(pedidosRef, where("timestamp", ">=", inicioTimestamp));
  const snapshot = await getDocs(q);

  const resumenPorLocal = {};
  const conteoPorLocal = {};

  snapshot.forEach(doc => {
    const pedido = doc.data();
    const local = pedido.local || "Desconocido";

    if (!resumenPorLocal[local]) {
      resumenPorLocal[local] = {};
      conteoPorLocal[local] = { total: 0, pedidos: 0 };
    }

    if (Array.isArray(pedido.productos)) {
      pedido.productos.forEach(prod => {
        if (!resumenPorLocal[local][prod.nombre]) {
          resumenPorLocal[local][prod.nombre] = { unidades: 0, total: 0 };
        }
        resumenPorLocal[local][prod.nombre].unidades++;
        resumenPorLocal[local][prod.nombre].total += prod.precio;
        conteoPorLocal[local].total += prod.precio;
      });
      conteoPorLocal[local].pedidos++;
    }
  });

  const fecha = ahora.toISOString().split("T")[0]; // YYYY-MM-DD

  // Generar PDF con múltiples locales
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Reporte Diario - ${fecha}`, 10, 10);
  let y = 20;

  for (const local in resumenPorLocal) {
    doc.setFontSize(12);
    doc.text(`📍 ${local}`, 10, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total vendido: $${conteoPorLocal[local].total.toFixed(2)}`, 10, y); y += 6;
    doc.text(`Total de pedidos: ${conteoPorLocal[local].pedidos}`, 10, y); y += 8;
    doc.text("Detalle por producto:", 10, y); y += 6;

    for (const nombre in resumenPorLocal[local]) {
      const { unidades, total } = resumenPorLocal[local][nombre];
      doc.text(`${nombre}: ${unidades} uds - $${total.toFixed(2)}`, 10, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    }

    y += 10;
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  }

  doc.save(`reporte_${fecha}.pdf`);
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