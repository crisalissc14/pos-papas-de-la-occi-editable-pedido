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

const productos = [
  { nombre: "Salchi Papa", precio: 1.50 },
  { nombre: "Salchi Huevo", precio: 1.75 },
  { nombre: "Papi Carne", precio: 2.00 },
  { nombre: "Papi Pollo", precio: 2.25 },
  { nombre: "Completa 1", precio: 3.00 },
  { nombre: "Completa 2", precio: 3.25 },
  { nombre: "Súper Completa", precio: 4.00 },
  { nombre: "Porción de papas", precio: 1.25 },
  { nombre: "Hamburguesa Sencilla", precio: 1.50 },
  { nombre: "Carne y huevo", precio: 1.75 },
  { nombre: "Carne y queso", precio: 2.00 },
  { nombre: "Carne y jamón", precio: 2.00 },
  { nombre: "Carne, queso y jamón", precio: 2.50 },
  { nombre: "Carne, queso, jamón y huevo", precio: 2.75 },
  { nombre: "Doble carne", precio: 2.25 },
  { nombre: "Carne, queso, piña", precio: 2.50 },
  { nombre: "Sencilla + papas", precio: 2.50 },
  { nombre: "Carne y huevo + papas", precio: 2.75 },
  { nombre: "Carne y queso + papas", precio: 3.00 },
  { nombre: "Carne y jamón + papas", precio: 3.00 },
  { nombre: "Carne, queso y jamón + papas", precio: 3.50 },
  { nombre: "Carne, queso, jamón y huevo + papas", precio: 3.75 },
  { nombre: "Doble carne + papas", precio: 3.25 },
  { nombre: "Carne, queso, piña + papas", precio: 3.50 },
  { nombre: "Completa", precio: 3.00 },
  { nombre: "Súper completa", precio: 3.25 },
  { nombre: "Completa + papas", precio: 4.00 },
  { nombre: "Súper completa + papas", precio: 4.25 },
  { nombre: "Gaseosa 250ml", precio: 0.50 },
  { nombre: "Gaseosa 500ml", precio: 0.75 },
  { nombre: "Agua sin gas 600ml", precio: 0.75 },
];
let carrito = [];
let ventas = [];

const app = document.getElementById("app");

function getTotal() {
  return carrito.reduce((a, b) => a + b.precio, 0);
}

function eliminarProducto(index) {
  carrito.splice(index, 1);
  render();
}

// Exponer eliminarProducto global para el onclick en HTML dinámico
window.eliminarProducto = eliminarProducto;

function render() {
  const total = getTotal();
  app.innerHTML = `
    <h1 class="text-2xl font-bold mb-4 text-center">POS PAPAS DE LA OCCI</h1>
    <div id="productos" class="grid grid-cols-2 gap-2 mb-4 max-h-96 overflow-y-auto"></div>

    <div class="mb-2">
      <h2 class="font-semibold text-lg">Pedido actual:</h2>
      <ul id="carrito-lista" class="text-sm mb-2"></ul>
      <div class="text-lg">Total: $<span id="total">${total.toFixed(2)}</span></div>
    </div>

    <div class="flex gap-2 mb-4">
      <button id="registrar" class="bg-green-600 text-white px-4 py-2 rounded w-full">Registrar pedido</button>
      <button id="reporte" class="bg-blue-600 text-white px-4 py-2 rounded w-full">Ver reporte</button>
    </div>

    <div id="reporteVentas" class="mt-6 text-sm"></div>

    <div class="flex gap-2 mt-4">
      <button id="reporteDiario" class="bg-indigo-600 text-white px-4 py-2 rounded w-full">Reporte diario</button>
      <button id="limpiar" class="bg-red-600 text-white px-4 py-2 rounded w-full">Limpiar pedidos antiguos</button>
    </div>
  `;

  // Renderizar botones de productos
  const productosDiv = document.getElementById("productos");
  productos.forEach((prod) => {
    const btn = document.createElement("button");
    btn.textContent = `${prod.nombre} ($${prod.precio.toFixed(2)})`;
    btn.className = "bg-white border text-left px-2 py-1 rounded shadow text-sm";
    btn.onclick = () => {
      carrito.push(prod);
      render();
    };
    productosDiv.appendChild(btn);
  });

  // Renderizar carrito con opción eliminar
  const carritoLista = document.getElementById("carrito-lista");
  carrito.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center border-b py-1";
    li.innerHTML = `
      <span>${item.nombre} ($${item.precio.toFixed(2)})</span>
      <button class="text-red-500 text-xs" onclick="eliminarProducto(${index})">❌</button>
    `;
    carritoLista.appendChild(li);
  });

  // Evento para registrar pedido en Firebase
  document.getElementById("registrar").onclick = async () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío.");
      return;
    }
    try {
      const pedido = {
        timestamp: serverTimestamp(), // marca de tiempo del servidor Firebase
        productos: carrito,
        total: getTotal(),
      };
      await addDoc(collection(db, "pedidos"), pedido);
      ventas.push([...carrito]); // seguimiento local
      carrito = [];
      alert("Pedido guardado en la nube ✅");
      render();
    } catch (e) {
      console.error("Error al guardar en Firebase:", e);
      alert("Error al guardar pedido ❌");
    }
  };

  // Evento para mostrar reporte local
  document.getElementById("reporte").onclick = () => {
    if (ventas.length === 0) {
      document.getElementById("reporteVentas").innerHTML = "No hay ventas registradas localmente.";
      return;
    }

    const resumen = {};
    ventas.forEach(pedido => {
      pedido.forEach(prod => {
        if (!resumen[prod.nombre]) {
          resumen[prod.nombre] = { unidades: 0, total: 0 };
        }
        resumen[prod.nombre].unidades++;
        resumen[prod.nombre].total += prod.precio;
      });
    });

    const totalVentas = ventas.flat().reduce((acc, prod) => acc + prod.precio, 0).toFixed(2);
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

  // Evento para generar reporte diario desde Firebase
  document.getElementById("reporteDiario").onclick = async () => {
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

    let html = `<strong>Pedidos de hoy:</strong> ${pedidos}<br><strong>Total vendido:</strong> $${total.toFixed(2)}<br><br>`;
    html += "<ul>";
    for (const nombre in resumen) {
      const r = resumen[nombre];
      html += `<li>${nombre}: ${r.unidades} uds - $${r.total.toFixed(2)}</li>`;
    }
    html += "</ul>";

    document.getElementById("reporteVentas").innerHTML = html;
  };

  // Evento para limpiar pedidos antiguos (>24 horas)
  document.getElementById("limpiar").onclick = async () => {
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const limite = Timestamp.fromDate(hace24h);

    const pedidosRef = collection(db, "pedidos");
    const q = query(pedidosRef, where("timestamp", "<", limite));
    const snapshot = await getDocs(q);

    const borrados = [];
    for (const docu of snapshot.docs) {
      await deleteDoc(doc(db, "pedidos", docu.id));
      borrados.push(docu.id);
    }

    alert(`Pedidos antiguos eliminados ✅ (${borrados.length} pedidos borrados)`);
  };
}

render();
