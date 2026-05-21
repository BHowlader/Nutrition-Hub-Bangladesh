const products = [
  {
    id: "iso-whey",
    name: "Iso Whey Performance",
    category: "protein",
    label: "Protein",
    badge: "Best seller",
    description: "Fast-mixing whey isolate for lean muscle and daily recovery.",
    price: 7850,
    accent: "#d8af5f",
  },
  {
    id: "creatine",
    name: "Creatine Monohydrate",
    category: "strength",
    label: "Strength",
    badge: "Lab tested",
    description: "Micronized strength support for high-intensity training.",
    price: 2450,
    accent: "#83e2b6",
  },
  {
    id: "omega",
    name: "Omega-3 Ultra",
    category: "wellness",
    label: "Wellness",
    badge: "Fresh stock",
    description: "Daily omega softgels for heart, brain, and joint support.",
    price: 1950,
    accent: "#7fb0f2",
  },
  {
    id: "multivitamin",
    name: "Daily Multivitamin",
    category: "vitamins",
    label: "Vitamins",
    badge: "Daily",
    description: "Balanced vitamin and mineral support for active routines.",
    price: 1650,
    accent: "#efb06a",
  },
  {
    id: "pre-workout",
    name: "Pre-Workout Charge",
    category: "strength",
    label: "Strength",
    badge: "New",
    description: "Clean focus and energy blend for demanding sessions.",
    price: 3200,
    accent: "#c891ef",
  },
  {
    id: "mass-gainer",
    name: "Lean Mass Gainer",
    category: "protein",
    label: "Protein",
    badge: "Value",
    description: "Calorie-dense nutrition for controlled size gain.",
    price: 5950,
    accent: "#f1d983",
  },
  {
    id: "zinc-mag",
    name: "Zinc Magnesium Complex",
    category: "wellness",
    label: "Wellness",
    badge: "Recovery",
    description: "Night-time mineral support for recovery-focused shoppers.",
    price: 1450,
    accent: "#8fd4c3",
  },
  {
    id: "vitamin-d3",
    name: "Vitamin D3 + K2",
    category: "vitamins",
    label: "Vitamins",
    badge: "Popular",
    description: "Compact daily support for bone and immune wellness.",
    price: 1350,
    accent: "#e2c15c",
  },
];

const cart = new Map();
const grid = document.querySelector("[data-product-grid]");
const filters = document.querySelectorAll("[data-filter]");
const cartDrawer = document.querySelector("[data-cart]");
const cartItems = document.querySelector("[data-cart-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartCount = document.querySelector("[data-cart-count]");
const cartTotal = document.querySelector("[data-cart-total]");

const formatTaka = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace("BDT", "Tk");

function renderProducts(category = "all") {
  const visible = category === "all" ? products : products.filter((product) => product.category === category);

  grid.innerHTML = visible
    .map(
      (product) => `
        <article class="product-card" style="--accent-color: ${product.accent}">
          <div class="product-visual" aria-hidden="true">
            <span class="cap"></span>
            <span class="tub"></span>
          </div>
          <div class="product-body">
            <div class="product-meta">
              <span>${product.label}</span>
              <em>${product.badge}</em>
            </div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-bottom">
              <strong>${formatTaka(product.price)}</strong>
              <button class="add-button" type="button" data-add="${product.id}">Add</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function updateCart() {
  const rows = [...cart.entries()].map(([id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return { ...product, quantity };
  });

  const itemCount = rows.reduce((sum, row) => sum + row.quantity, 0);
  const total = rows.reduce((sum, row) => sum + row.price * row.quantity, 0);

  cartCount.textContent = itemCount;
  cartTotal.textContent = formatTaka(total);
  cartEmpty.hidden = rows.length > 0;

  cartItems.innerHTML = rows
    .map(
      (row) => `
        <div class="cart-row">
          <div>
            <h3>${row.name}</h3>
            <p>${formatTaka(row.price)} × ${row.quantity}</p>
          </div>
          <div class="qty" aria-label="Quantity controls for ${row.name}">
            <button type="button" data-dec="${row.id}" aria-label="Decrease ${row.name}">−</button>
            <strong>${row.quantity}</strong>
            <button type="button" data-inc="${row.id}" aria-label="Increase ${row.name}">+</button>
          </div>
        </div>
      `
    )
    .join("");
}

function addToCart(id) {
  cart.set(id, (cart.get(id) || 0) + 1);
  updateCart();
}

function setCartOpen(open) {
  cartDrawer.classList.toggle("open", open);
  cartDrawer.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("cart-open", open);
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderProducts(button.dataset.filter);
  });
});

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const incButton = event.target.closest("[data-inc]");
  const decButton = event.target.closest("[data-dec]");

  if (addButton) {
    addToCart(addButton.dataset.add);
  }

  if (incButton) {
    addToCart(incButton.dataset.inc);
  }

  if (decButton) {
    const id = decButton.dataset.dec;
    const nextQuantity = (cart.get(id) || 0) - 1;
    if (nextQuantity > 0) cart.set(id, nextQuantity);
    else cart.delete(id);
    updateCart();
  }

  if (event.target.closest("[data-open-cart]")) {
    setCartOpen(true);
  }

  if (event.target.closest("[data-close-cart]") || event.target === cartDrawer) {
    setCartOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setCartOpen(false);
    if (siteHeader && siteHeader.classList.contains("menu-open")) {
      siteHeader.classList.remove("menu-open");
      mobileDrawer.classList.remove("open");
      mobileDrawer.setAttribute("aria-hidden", "true");
      if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "false");
    }
  }
});

// Mobile menu toggle logic
const menuTrigger = document.querySelector("[data-toggle-menu]");
const siteHeader = document.querySelector(".site-header");
const mobileDrawer = document.querySelector("[data-mobile-drawer]");

if (menuTrigger && siteHeader && mobileDrawer) {
  menuTrigger.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("menu-open");
    mobileDrawer.classList.toggle("open", isOpen);
    mobileDrawer.setAttribute("aria-hidden", String(!isOpen));
    menuTrigger.setAttribute("aria-expanded", String(isOpen));
  });

  // Close menu when clicking a link
  const mobileLinks = mobileDrawer.querySelectorAll("a");
  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteHeader.classList.remove("menu-open");
      mobileDrawer.classList.remove("open");
      mobileDrawer.setAttribute("aria-hidden", "true");
      menuTrigger.setAttribute("aria-expanded", "false");
    });
  });
}

// Close mobile menu if clicked outside
document.addEventListener("click", (event) => {
  if (siteHeader && siteHeader.classList.contains("menu-open")) {
    if (!siteHeader.contains(event.target)) {
      siteHeader.classList.remove("menu-open");
      mobileDrawer.classList.remove("open");
      mobileDrawer.setAttribute("aria-hidden", "true");
      if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "false");
    }
  }
});

renderProducts();
updateCart();
