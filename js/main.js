document.addEventListener("DOMContentLoaded", async () => {
  const fallbackConfig = {
    contactEmail: "",
    whatsappNumber: "",
    whatsappMessage: "Hola, vi el portafolio de HELIX y me gustaría conocer más sobre sus servicios.",
  };
  let publicConfig = fallbackConfig;

  try {
    const configResponse = await fetch("/api/config", { headers: { Accept: "application/json" } });
    if (configResponse.ok) publicConfig = { ...fallbackConfig, ...(await configResponse.json()) };
  } catch {
    // Los valores de respaldo mantienen operativos los canales al abrir el HTML sin servidor.
  }

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
    link.href = publicConfig.contactEmail ? `mailto:${publicConfig.contactEmail}` : "#contacto";
  });
  document.querySelectorAll("[data-email-text]").forEach((element) => {
    element.textContent = publicConfig.contactEmail || "Correo por configurar";
  });

  const whatsappUrl = publicConfig.whatsappNumber
    ? `https://wa.me/${publicConfig.whatsappNumber}?text=${encodeURIComponent(publicConfig.whatsappMessage)}`
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
  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const requiredFields = [...contactForm.querySelectorAll("[required]")];
    requiredFields.forEach((field) => field.setAttribute("aria-invalid", String(!field.checkValidity())));

    if (!contactForm.checkValidity()) {
      status.textContent = "Revisa los campos obligatorios antes de continuar.";
      contactForm.querySelector(":invalid")?.focus();
      return;
    }

    const data = new FormData(contactForm);
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalButtonContent = submitButton.innerHTML;
    const payload = Object.fromEntries(data.entries());

    submitButton.disabled = true;
    submitButton.textContent = "Enviando…";
    status.className = "form-status";
    status.textContent = "Enviando tu solicitud de forma segura…";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "No pudimos enviar el mensaje en este momento.");
      }

      contactForm.reset();
      contactForm.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
      status.className = "form-status is-success";
      status.textContent = "¡Gracias! Recibimos tu solicitud y te contactaremos pronto.";
    } catch (error) {
      status.className = "form-status is-error";
      status.textContent = error.message || "Ocurrió un error. También puedes escribirnos directamente por correo o WhatsApp.";
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonContent;
    }
  });

  contactForm?.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
  });
});
