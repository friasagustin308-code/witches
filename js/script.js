/* =================================================================
   BRUJAS — script principal
   - Menú desplegable (header)
   - Construcción de enlaces de WhatsApp (botón flotante + productos)
   - Formulario de pedido / presupuesto
   ================================================================= */

/* ============================================================
   1) CONFIGURÁ ACÁ EL NÚMERO DE WHATSAPP DE LA TIENDA
   ============================================================ */
const WHATSAPP_NUMBER = "5493812537575";

/* Conectado a Formspree: cada pedido del formulario también llega
   por email a la cuenta de Formspree configurada, además de
   redirigir a WhatsApp. Si en algún momento querés desconectarlo,
   alcanza con dejar este valor como cadena vacía: "". */
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xrevnapz";

function buildWhatsAppLink(message){
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Menú desplegable ---------- */
  const trigger  = document.getElementById("navTrigger");
  const dropdown = document.getElementById("navDropdown");
  const overlay  = document.getElementById("navOverlay");

  function openNav(){
    dropdown.classList.add("is-open");
    overlay.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  }
  function closeNav(){
    dropdown.classList.remove("is-open");
    overlay.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  }
  if (trigger && dropdown && overlay){
    trigger.addEventListener("click", () => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      isOpen ? closeNav() : openNav();
    });
    overlay.addEventListener("click", closeNav);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- Enlaces de WhatsApp (botón flotante, pie de página, etc.) ---------- */
  document.querySelectorAll("[data-wa-message]").forEach((el) => {
    const customMsg = el.getAttribute("data-wa-message") ||
      "Hola Brujas! 🌙 Quiero hacer una consulta.";
    el.setAttribute("href", buildWhatsAppLink(customMsg));
  });

  /* ---------- Botones "Pedir por WhatsApp" en tarjetas de producto ---------- */
  document.querySelectorAll(".wa-product-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      if (!card) return;

      const nombre = card.getAttribute("data-product") || "producto";
      const precio = card.getAttribute("data-price") || "";
      const talleSelect = card.querySelector(".talle-select");
      const colorSelect = card.querySelector(".color-select");
      const talle = talleSelect ? talleSelect.value : "";
      const color = colorSelect ? colorSelect.value : "";

      let mensaje = `Hola Brujas! 🌙 Quiero pedir:\n• Producto: ${nombre}`;
      if (talle) mensaje += `\n• Talle: ${talle}`;
      if (color) mensaje += `\n• Color: ${color}`;
      if (precio) mensaje += `\n• Precio: ${precio}`;
      mensaje += `\n\n¿Me confirman disponibilidad? ¡Gracias!`;

      window.open(buildWhatsAppLink(mensaje), "_blank", "noopener");
    });
  });

  /* ---------- Formulario de pedido / presupuesto ---------- */
  const pedidoForm = document.getElementById("pedidoForm");
  if (pedidoForm){
    pedidoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = document.getElementById("pedidoStatus");
      const data = new FormData(pedidoForm);

      const nombre      = (data.get("nombre") || "").trim();
      const apellido    = (data.get("apellido") || "").trim();
      const telefono    = (data.get("telefono") || "").trim();
      const email       = (data.get("email") || "").trim();
      const sector      = (data.get("sector") || "").trim();
      const producto    = (data.get("producto") || "").trim();
      const talle       = (data.get("talle") || "").trim();
      const cantidad    = (data.get("cantidad") || "").trim();
      const comentarios = (data.get("comentarios") || "").trim();

      if (!nombre || !telefono){
        if (status){
          status.textContent = "Por favor completá al menos tu nombre y tu teléfono.";
          status.className = "form-status show err";
        }
        return;
      }

      // Envío del lead a Formspree (en paralelo con el armado del mensaje de WhatsApp).
      // No bloquea ni cancela la redirección a WhatsApp si llegara a fallar:
      // WhatsApp es el canal principal, Formspree es el respaldo por email.
      if (FORMSPREE_ENDPOINT){
        try{
          const fsRes = await fetch(FORMSPREE_ENDPOINT, {
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre, apellido, telefono, email, sector, producto, talle, cantidad, comentarios,
              _subject: `Nuevo pedido BRUJAS — ${nombre} ${apellido}`.trim(),
              ...(email ? { _replyto: email } : {})
            })
          });
          if (!fsRes.ok){
            const fsBody = await fsRes.json().catch(() => ({}));
            console.warn("Formspree devolvió un error al guardar el lead:", fsRes.status, fsBody);
          }
        }catch(err){
          console.warn("No se pudo conectar con Formspree para guardar el lead:", err);
        }
      }

      let mensaje = `Hola Brujas! 🌙 Quiero pedir un presupuesto:\n`;
      mensaje += `• Nombre: ${nombre} ${apellido}`.trim() + `\n`;
      mensaje += `• Teléfono: ${telefono}\n`;
      if (email) mensaje += `• Email: ${email}\n`;
      if (sector) mensaje += `• Sector: ${sector}\n`;
      if (producto) mensaje += `• Producto/s: ${producto}\n`;
      if (talle) mensaje += `• Talle: ${talle}\n`;
      if (cantidad) mensaje += `• Cantidad: ${cantidad}\n`;
      if (comentarios) mensaje += `• Comentarios: ${comentarios}\n`;
      mensaje += `\n¡Quedo a la espera de su respuesta!`;

      if (status){
        status.textContent = "¡Listo! Te llevamos a WhatsApp para confirmar el pedido…";
        status.className = "form-status show ok";
      }

      window.open(buildWhatsAppLink(mensaje), "_blank", "noopener");
      pedidoForm.reset();
    });
  }

  /* ---------- Año dinámico en el pie de página ---------- */
  document.querySelectorAll(".current-year").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});