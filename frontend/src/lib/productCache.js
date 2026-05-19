/**
 * productCache — a small in-memory cache for product list/detail and
 * categories with a short TTL, so SPA navigation does not re-hit the
 * (slow free-tier) MongoDB Atlas cluster on every route change.
 *
 * @author Yuchang Zhang
 */
import api from "../api";

const DEFAULT_TTL_MS = 5 * 60 * 1000;

const requestCache = new Map();
const productById = new Map();
let categoriesCache = null;

function now() {
  return Date.now();
}

function isFresh(entry, ttlMs) {
  return entry && now() - entry.timestamp < ttlMs;
}

function buildKey(path, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => search.set(key, String(value)));
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function seedProducts(products) {
  products.forEach((product) => {
    if (product?.id) productById.set(product.id, product);
  });
}

async function cachedFetch(key, fetcher, { ttlMs = DEFAULT_TTL_MS, force = false } = {}) {
  const cached = requestCache.get(key);
  if (!force && isFresh(cached, ttlMs) && cached.data !== undefined) {
    return cached.data;
  }
  if (!force && cached?.promise) {
    return cached.promise;
  }

  const promise = fetcher()
    .then((data) => {
      requestCache.set(key, { data, timestamp: now() });
      return data;
    })
    .catch((error) => {
      requestCache.delete(key);
      throw error;
    });

  requestCache.set(key, { ...cached, promise, timestamp: now() });
  return promise;
}

export async function getProducts(params = {}, options = {}) {
  const key = buildKey("/products", params);
  const data = await cachedFetch(
    key,
    async () => {
      const response = await api.get("/products", { params });
      seedProducts(response.data);
      return response.data;
    },
    options
  );
  seedProducts(data);
  return data;
}

export async function getCategories(options = {}) {
  if (!options.force && categoriesCache && isFresh(categoriesCache, options.ttlMs ?? DEFAULT_TTL_MS)) {
    return categoriesCache.data;
  }
  const data = await cachedFetch(
    "/products/categories",
    async () => {
      const response = await api.get("/products/categories");
      categoriesCache = { data: response.data, timestamp: now() };
      return response.data;
    },
    options
  );
  categoriesCache = { data, timestamp: now() };
  return data;
}

export async function getProduct(id, options = {}) {
  if (!options.force && productById.has(id)) {
    return productById.get(id);
  }
  const key = `/products/${id}`;
  const data = await cachedFetch(
    key,
    async () => {
      const response = await api.get(`/products/${id}`);
      if (response.data?.id) productById.set(response.data.id, response.data);
      return response.data;
    },
    options
  );
  if (data?.id) productById.set(data.id, data);
  return data;
}

export function invalidateProductCache() {
  requestCache.clear();
  productById.clear();
  categoriesCache = null;
}
