# Frontend Changes — Variant `color` is now Optional

## Summary

On the backend, a variant's **`color` is no longer required**. Products (and their
variants) can now be created, updated, and ordered **without a color**.

This was needed for products whose colors can't be represented as a single hex
value (prints, patterns, multi‑color, etc.).

These changes are **backward‑compatible**: every request that already sends a
`color` keeps working exactly as before. The only new behavior is that `color`
may now be **omitted on write** and may come back as **`null` on read**.

---

## What the frontend needs to do

1. **Allow submitting variants without a color** in the create/edit UI.
2. **Render `color` defensively** — it can be `null` in any response that returns
   variants or order items.

---

## Endpoints affected

### 1. Create product — `POST /product/create`

Variants are sent inline. `color` inside each variant is now **optional**.

```jsonc
{
  "name": { "ar": "...", "en": "..." },
  "description": { "ar": "...", "en": "..." },
  "price": 250,
  "category": "<categoryId>",
  "defaultImage": "<url>",
  "variants": [
    { "size": "M", "color": "<colorId>", "quantity": 5 }, // with color (as before)
    { "size": "L", "quantity": 3 }                          // ✅ no color — now valid
  ]
}
```

- `color`, when provided, is a **Color `_id`** (24‑char Mongo ObjectId).
- `size` is optional and defaults to `"one size"` if omitted.
- `quantity` is still **required**.

### 2. Create a single variant — `POST /variant`

```jsonc
{
  "productId": "<productId>",
  "size": "M",
  "color": "<colorId>", // ✅ now optional
  "quantity": 5
}
```

- `size` and `quantity` are **required**; `color` is **optional**.

### 3. Update variants (bulk) — `PATCH /variant/bulk`

This is **the** endpoint used to edit existing variants. `color` was already
optional here.

```jsonc
{
  "productId": "<productId>",
  "variants": [
    { "_id": "<variantId>", "size": "M", "color": "<colorId>", "quantity": 8 },
    { "_id": "<variantId>", "quantity": 2 } // update quantity only
  ]
}
```

- Each item must include `_id`. `size`, `color`, `quantity` are each optional.
- If `color` is provided it must be a **24‑char hex ObjectId**.
- Only fields that are **present** in the request are updated; omitted fields are
  left unchanged.

### 4. Update product + its variants in one request — `PATCH /product/update/:productId`

This endpoint now **also accepts an optional `variants` array**, so you can edit
the product fields and its variants in a single call.

```jsonc
{
  "name": { "ar": "...", "en": "..." }, // any product fields are optional
  "price": 300,
  "variants": [
    { "_id": "<variantId>", "color": "<colorId>", "quantity": 20 }, // update existing
    { "size": "44", "quantity": 10 },                                // create new (no _id, no color)
    { "size": "38", "color": "<colorId>", "quantity": 7 }            // create new (with color)
  ]
}
```

Reconciliation rules:

- **Item with `_id`** → updates that existing variant (only the fields you send:
  `size` / `color` / `quantity`).
- **Item without `_id`** → creates a new variant. `quantity` is **required**,
  `size` defaults to `"one size"`, `color` is optional.
- **Existing variants that are NOT in the array are kept untouched** — this
  endpoint never deletes. To remove a variant, use `DELETE /variant/bulk`.
- Product fields and variants are saved together in a single transaction (all or
  nothing).

> You can still use the dedicated `/variant` endpoints below if you prefer to
> manage variants separately — both approaches work.

---

## Endpoints that do NOT touch color

| Endpoint | What it does |
|---|---|
| `PATCH /variant/:variantId` | Updates the variant **quantity only**. Does not touch color. |
| `DELETE /variant/bulk` | Removes variants. This is the **only** way to delete a variant. |

---

## Reading data — handle `null` color

Any response that returns variants or order items may now contain `color: null`.
Make sure the UI does not assume a color object exists.

Endpoints that return variant/order `color` (populated, can be `null`):

- `GET /product/get-one-product/:productId` (admin) — `variants[].color`
- `GET /product/...` user product list / details — `variants[].color`
- `GET /variant/product/:productId` — `variants[].color`
- `GET /variant/:variantId` — `color`
- Order responses — `products[].color`

When `color` is present it is the populated Color object:

```jsonc
{
  "color": { "name": { "ar": "أسود", "en": "Black" }, "hex": "#000000" }
}
```

When the variant has no color:

```jsonc
{ "color": null }
```

**UI guidance:** when `color` is `null`, hide the color swatch/label (or show a
neutral placeholder). Do not read `color.name` / `color.hex` without a null check.

---

## Validation summary

| Field (context) | Before | After |
|---|---|---|
| `variants[].color` in `POST /product/create` | required | **optional** |
| `color` in `POST /variant` | required | **optional** |
| `variants[].color` in `PATCH /variant/bulk` | optional | optional (unchanged) |
| `variants` in `PATCH /product/update` | not allowed (error) | **accepted (optional)** |

---

## Notes & limitations

- **Color filter** (`GET` product list with `?color=<id>`) is unchanged. Products
  created without a color simply won't appear when filtering by a color.
- **Sending `variants` to `PATCH /product/update` used to fail** with
  `"variants" is not allowed`. It is now supported (create + update; never delete).
- Updating a variant (via `PATCH /variant/bulk` or `PATCH /product/update`)
  **sets** a color but does not currently support **clearing** an existing color
  (sending `null` is not accepted). If "remove color from an existing variant" is
  needed in the UI, ask backend to add support for it.
- Deleting variants is only possible via `DELETE /variant/bulk`.
- No other behavior changed — response shapes are the same; only `color` can be
  absent/`null`.
