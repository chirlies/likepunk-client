// script.js

const select = document.getElementById("productSelect");
const responseDiv = document.getElementById("response");
const priceDiv = document.getElementById("servicePrice");

function cleanName(name) {
  return name.replace(/[^ -~]+/g, '').replace(/\s+/g, ' ').trim();
}

const groups = {};

fetch("https://likepunk-backend-production.up.railway.app/products")
  .then(res => res.json())
  .then(data => {
    select.innerHTML = "";
    data.forEach(service => {
      const cleaned = cleanName(service.name);
      const [platform] = cleaned.split(" - ");
      if (!groups[platform]) {
        groups[platform] = [];
      }
      groups[platform].push({
        id: service.service,
        name: cleaned,
        rate: service.rate
      });
    });

    Object.entries(groups).forEach(([platform, services]) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = platform;

      services.forEach(service => {
        const option = document.createElement("option");
        option.value = service.id;
        option.dataset.rate = service.rate;
        option.textContent = `${service.name}`;
        optgroup.appendChild(option);
      });

      select.appendChild(optgroup);
    });
  })
  .catch(() => {
    select.innerHTML = "<option>Error loading services</option>";
  });

select.addEventListener("change", () => {
  const selected = select.options[select.selectedIndex];
  if (selected && selected.dataset.rate) {
    const rate = parseFloat(selected.dataset.rate);
    priceDiv.textContent = `Price: $${rate.toFixed(4)} per 1k`;
  } else {
    priceDiv.textContent = "";
  }
});

function orderNow() {
  const link = document.getElementById("link").value.trim();
  const quantity = parseInt(document.getElementById("quantity").value);
  const selectedOption = select.options[select.selectedIndex];

  const service = selectedOption?.value;
  const ratePer1k = parseFloat(selectedOption?.dataset?.rate || "0");

  if (!link || !service || !quantity || !ratePer1k) {
    alert("Please fill in all fields.");
    return;
  }

  const amount = (ratePer1k / 1000) * quantity;

  fetch("https://likepunk-backend-production.up.railway.app/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: parseFloat(amount.toFixed(4)),
      currency: "usd",
      order_id: `likepunk|${Date.now()}|${service}|${link}|${quantity}`
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        responseDiv.textContent = "Error creating payment.";
      }
    })
    .catch(() => {
      responseDiv.textContent = "Failed to send request.";
    });
}
