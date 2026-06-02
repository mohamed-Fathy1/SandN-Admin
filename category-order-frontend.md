# Category `order` — Frontend Notes

An **`order`** field was added to Category to control the display order of categories.

> ⚠️ **Important:** Treat `order` as **required** in both create and update. The backend currently accepts it as optional (temporary) until the frontend is done, after which it will be made required on the backend too.

The only frontend changes needed are in **create and update**. Sorting/display is handled automatically by the backend — nothing changes in the listing screens.

---

## The field: `order`

| Property | Value |
|----------|-------|
| Type | `number` (integer) |
| Min | `0` |
| Meaning | Sort position — **lower shows first** (ascending) |
| Required (frontend) | ✅ Yes |

---

## 1) Create

`POST /category/create` — add `order` to the body.

```json
{
  "name": { "ar": "حمالات صدر", "en": "Bras" },
  "groupSize": "665f0a1c2b9d3e0012a4c111",
  "imageUrl": "https://cdn.example.com/categories/bras.png",
  "iconId": "665f0a1c2b9d3e0012a4c222",
  "order": 0
}
```

---

## 2) Update

`PATCH /category/update/:_id` — add `order` to the body.

```json
{
  "order": 3
}
```

**Reorder (drag & drop):** there is no bulk endpoint — send `PATCH update` for each category whose `order` changed, with its new value.

---

## 3) Response

The response shape is unchanged except that **`order` is now returned as an extra field** on each category. Lists come back already sorted by `order` ascending from the backend — just render them as received.

```jsonc
{
  "data": {
    "categories": [
      { "_id": "...", "name": { "ar": "...", "en": "..." }, "order": 0 },
      { "_id": "...", "name": { "ar": "...", "en": "..." }, "order": 1 }
      // ... sorted ascending by order
    ]
  }
}
```
