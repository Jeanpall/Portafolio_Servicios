document.addEventListener("DOMContentLoaded", () => {
  // Reemplaza estos datos con los canales oficiales de HELIX.
  const CONTACT_EMAIL = "contacto@tihelix.com";
  const WHATSAPP_NUMBER = ""; // Formato internacional, solo números. Ejemplo Colombia: 573001234567
  const WHATSAPP_MESSAGE = "Hola, vi el portafolio de HELIX y me gustaría conocer más sobre sus servicios.";

  const header = document.getElementById("header");
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = [...document.querySelectorAll(".nav__link")];
  const status = document.getElementById("form-status");

  const closeMenu = () => {
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Abrir menú");
    document.body.classList.remove("menu-open");
  };

  navToggle?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("is-open") ?? false;
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("menu-open", isOpen);
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const updateHeader = () => header?.classList.toggle("header--scrolled", window.scrollY > 24);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px" }
    );
    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 6, 4) * 70}ms`;
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  const observedSections = document.querySelectorAll("main section[id]");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-35% 0px -55%", threshold: 0 }
  );
  observedSections.forEach((section) => sectionObserver.observe(section));

  document.querySelectorAll("[data-email-link]").forEach((link) => {
    link.href = `mailto:${CONTACT_EMAIL}`;
  });
  document.querySelectorAll("[data-email-text]").forEach((element) => {
    element.textContent = CONTACT_EMAIL;
  });

  const whatsappUrl = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : "";

  document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
    if (whatsappUrl) {
      link.href = whatsappUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      return;
    }

    link.addEventListener("click", (event) => {
      event.preventDefault();
      document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
      if (status) status.textContent = "El número oficial de WhatsApp está pendiente de configurar.";
    });
  });

  const contactForm = document.getElementById("contact-form");
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const requiredFields = [...contactForm.querySelectorAll("[required]")];
    requiredFields.forEach((field) => field.setAttribute("aria-invalid", String(!field.checkValidity())));

    if (!contactForm.checkValidity()) {
      status.textContent = "Revisa los campos obligatorios antes de continuar.";
      contactForm.querySelector(":invalid")?.focus();
      return;
    }

    const data = new FormData(contactForm);
    const subject = `Consulta comercial HELIX — ${data.get("empresa") || data.get("nombre")}`;
    const body = [
      `Nombre: ${data.get("nombre")}`,
      `Empresa: ${data.get("empresa") || "No indicada"}`,
      `Correo de contacto: ${data.get("email")}`,
      `Servicio de interés: ${data.get("servicio") || "Por definir"}`,
      "",
      "Mensaje:",
      data.get("mensaje"),
    ].join("\n");

    status.textContent = "Abriendo tu aplicación de correo para que revises y envíes el mensaje.";
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  contactForm?.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
  });
});
