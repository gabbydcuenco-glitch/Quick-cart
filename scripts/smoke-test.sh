#!/bin/sh
# Smoke test: calls the health endpoints and one real catalog query THROUGH the proxy,
# exactly like a visitor would. Used by the Jenkins "Smoke Test" stage.
BASE=http://127.0.0.1:8080
call() { docker compose exec -T proxy wget -qO- "$BASE$1"; }

for i in $(seq 1 24); do
  if call /nginx-health >/dev/null \
  && call / | grep -q 'id="root"' \
  && call /api/catalog/health >/dev/null \
  && call /api/orders/health >/dev/null \
  && call /api/payment/health >/dev/null \
  && call /api/catalog/products | docker compose exec -T catalog-api node -e '
    let text = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => { text += chunk; });
    process.stdin.on("end", () => {
      try {
        const products = JSON.parse(text);
        if (!Array.isArray(products) || !products.length ||
            !products.every(p => Number.isInteger(p.id) && typeof p.name === "string" &&
              p.name.length > 0 && Number.isFinite(p.price) && p.price >= 0)) process.exit(1);
      } catch { process.exit(1); }
    });
  '; then
    echo "Smoke test passed: frontend, proxy, all APIs and database query verified"
    exit 0
  fi
  echo "Waiting for services... ($i)"
  sleep 5
done

echo "Smoke test failed"
exit 1
