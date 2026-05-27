# S&N Admin API — Integration Guide

> **Base URL:** `{{baseUrl}}` — replace with your actual server URL (e.g. `https://api.example.com`).
> All requests and responses use **JSON** (`Content-Type: application/json`).
> Endpoints below the **Authentication** section require a **Bearer token** in the `Authorization` header unless noted otherwise.

```
Authorization: Bearer <your_access_token>
```

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [File Uploads (AWS S3)](#2-file-uploads-aws-s3)
3. [Group & Size Management](#3-group-size-management)
4. [Category Management](#4-category-management)
5. [Category Icons](#5-category-icons)
6. [Sub-Category Management](#6-sub-category-management)
7. [Color Management](#7-color-management)
8. [Shipping Management](#8-shipping-management)
9. [Product Management](#9-product-management)
10. [Variant Management](#10-variant-management)
11. [Image Slider (Hero Section)](#11-image-slider-hero-section)
12. [Social Reviews](#12-social-reviews)
13. [Offers](#13-offers)
14. [Wishlist (Admin View)](#14-wishlist-admin-view)
15. [Order Management](#15-order-management)
16. [Product Analysis (Dashboard)](#16-product-analysis-dashboard)
17. [Recommended Setup Order](#17-recommended-setup-order)
18. [Standard Response Envelope](#18-standard-response-envelope)
19. [Error Reference](#19-error-reference)

---

## 1. Authentication

Authentication is email-based with a one-time activation code. No password is used.

### 1.1 — Register / Request Activation Email

Send the admin email to receive a 6-digit activation code. If the email does not exist, a new user account is created. If it belongs to an admin, an activation code is sent.

```
POST {{baseUrl}}/authentication/register-email
```

**Request Body**

| Field   | Type   | Required | Notes                           |
|---------|--------|----------|---------------------------------|
| `email` | string | Yes      | Valid email address (lowercase) |

```json
{
  "email": "admin@example.com"
}
```

**Responses**

| Scenario             | Code | Message                          | `data`       |
|----------------------|------|----------------------------------|--------------|
| New user created     | 201  | `"User created successfully"`    | `null`       |
| Admin — code sent    | 200  | `"email sent successfully"`      | `{ "email" }` |
| Non-admin user       | 200  | `"Welcome email sent successfully"` | `null`    |

---

### 1.2 — Activate Account & Get Token

Submit the 6-digit activation code. On success you receive an `accessToken` (JWT). The code expires after **5 minutes**.

```
POST {{baseUrl}}/authentication/active-account
```

**Request Body**

| Field        | Type   | Required | Notes                          |
|--------------|--------|----------|--------------------------------|
| `email`      | string | Yes      | The same email from Step 1     |
| `activeCode` | string | Yes      | 6-digit code from the email    |

```json
{
  "email": "admin@example.com",
  "activeCode": "518371"
}
```

**Success Response (200)**

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "account activated successfully",
  "success": true
}
```

> **Save `accessToken`** — attach it as `Authorization: Bearer <token>` on every subsequent request.
>
> **Single session:** Only one active token exists per admin. Logging in from a new client invalidates the previous token immediately.

**Token Payload** (decoded JWT) — expires in **7 days**.

```json
{
  "_id": "mongo_user_id",
  "role": "admin",
  "email": "admin@example.com",
  "iat": 1711828000,
  "exp": 1712432800
}
```

**Errors**

| Situation            | Code | Message                      |
|----------------------|------|------------------------------|
| Email not found      | 400  | `"email not found"`          |
| Wrong activation code| 400  | `"activeCode is incorrect"`  |
| Code expired (>5min) | 400  | `"active code is expired"`   |
| Not an admin         | 403  | `"You do not have permission"` |

---

### 1.3 — Resend Activation Code

Request a fresh activation code if the previous one expired.

```
POST {{baseUrl}}/authentication/email-new-code
```

**Request Body**

| Field   | Type   | Required |
|---------|--------|----------|
| `email` | string | Yes      |

```json
{
  "email": "admin@example.com"
}
```

**Success Response (200)**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "email sent successfully",
  "success": true
}
```

---

## 2. File Uploads (AWS S3)

All image URLs used throughout the API must be uploaded to S3 first. This is a two-step process.

### 2.1 — Get Pre-signed Upload URL(s)

```
POST {{baseUrl}}/aws/get-presigned-url
Authorization: Bearer <token>
```

**Request Body**

| Field               | Type   | Required | Notes |
|---------------------|--------|----------|-------|
| `folder`            | string | Yes      | Target folder: `Offers`, `ImageSlider`, `Category`, `SubCategory`, `SocialReview`, `Product` |
| `files`             | array  | Yes      | At least 1 file entry |
| `files[].contentType` | string | Yes    | MIME type. Allowed: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`, `image/bmp`, `image/tiff` |
| `files[].fileName`  | string | No       | Existing file name to overwrite; if omitted a new name is generated |

```json
{
  "folder": "Product",
  "files": [
    { "contentType": "image/jpg" },
    { "contentType": "image/png" }
  ]
}
```

**Success Response (200)**

```json
{
  "statusCode": 200,
  "data": {
    "preSignedURLs": [
      {
        "preSignedURL": "https://bucket.s3.us-east-1.amazonaws.com/Product/userId_1711828000_0?X-Amz-Algorithm=...",
        "mediaUrl": "https://bucket.s3.us-east-1.amazonaws.com/Product/userId_1711828000_0"
      }
    ]
  },
  "message": "Success",
  "success": true
}
```

- `preSignedURL` — use this to upload the binary file (Step 2).
- `mediaUrl` — the final public URL. Use this value in create/update endpoints.

---

### 2.2 — Upload the File to S3

Use the `preSignedURL` from Step 1.

```
PUT <preSignedURL>
Content-Type: image/jpg   ← must match the contentType you declared
```

Body: **raw binary image data**.

**Success**: HTTP `200` with empty body. The image is now live at the `mediaUrl`.

---

### 2.3 — Delete an Image

```
DELETE {{baseUrl}}/aws/delete-presigned-url
Authorization: Bearer <token>
```

**Request Body**

| Field      | Type   | Required | Notes |
|------------|--------|----------|-------|
| `fileName` | string | Yes      | The `mediaId` (path portion), e.g. `Offers/userId_1711828000_0` |

```json
{
  "fileName": "Offers/69cd86918e13c19f521dd29b_1775755379177_0"
}
```

---

## 3. Group & Size Management

Groups define the **type** of sizing (e.g. `letters` → S/M/L or `numeric` → 36/38/40). Sizes belong to groups. Set these up **before** creating categories.

**Base path:** `{{baseUrl}}/group-size`

### Group Operations

#### 3.1 Create Group

```
POST {{baseUrl}}/group-size/group
Authorization: Bearer <token>
```

| Field  | Type   | Required | Notes |
|--------|--------|----------|-------|
| `name` | string | Yes      | Group name (e.g. `"letters"`, `"numeric"`) |

```json
{ "name": "letters" }
```

**Response (201)**
```json
{
  "statusCode": 201,
  "data": { "groupSize": { "_id": "...", "name": "letters" } },
  "message": "Group size created successfully",
  "success": true
}
```

#### 3.2 Get All Groups

```
GET {{baseUrl}}/group-size/group-all
Authorization: Bearer <token>
```

#### 3.3 Get Group by ID

```
GET {{baseUrl}}/group-size/group/:_id
Authorization: Bearer <token>
```

#### 3.4 Update Group

```
PATCH {{baseUrl}}/group-size/update-group/:_id
Authorization: Bearer <token>
```

| Field  | Type   | Required |
|--------|--------|----------|
| `name` | string | Yes      |

```json
{ "name": "numeric" }
```

---

### Size Operations

#### 3.5 Create Size

```
POST {{baseUrl}}/group-size/size
Authorization: Bearer <token>
```

| Field       | Type   | Required | Notes |
|-------------|--------|----------|-------|
| `groupSize` | string | Yes      | `_id` of the group |
| `size`      | string | Yes      | Display value (e.g. `"XL"`, `"38"`) |
| `order`     | number | Yes      | Sort order for display |

```json
{
  "groupSize": "<groupId>",
  "size": "XL",
  "order": 5
}
```

**Response (201)**
```json
{
  "statusCode": 201,
  "data": { "sizeCategory": { "_id": "...", "groupSize": "...", "size": "XL", "order": 5 } },
  "message": "Size category created successfully",
  "success": true
}
```

#### 3.6 Update Size

```
PATCH {{baseUrl}}/group-size/size/:_id
Authorization: Bearer <token>
```

| Field       | Type   | Required |
|-------------|--------|----------|
| `groupSize` | string | No       |
| `size`      | string | No       |
| `order`     | number | No       |

Response includes the populated `groupSize` name.

#### 3.7 Delete Size

```
DELETE {{baseUrl}}/group-size/size/:_id
Authorization: Bearer <token>
```

#### 3.8 Get All Sizes

```
GET {{baseUrl}}/group-size/all-size
Authorization: Bearer <token>
```

#### 3.9 Get All Sizes by Group

```
GET {{baseUrl}}/group-size/all-sizes-by-group/:groupId
Authorization: Bearer <token>
```

#### 3.10 Get Size by ID

```
GET {{baseUrl}}/group-size/one-size/:_id
Authorization: Bearer <token>
```

---

## 4. Category Management

Categories require a `groupSize` ID and an `iconId`. Create groups and icons first.

**Base path:** `{{baseUrl}}/category`

### 4.1 Create Category

Upload the image first (Section 2), then use the returned `mediaUrl` here.

```
POST {{baseUrl}}/category/create
Authorization: Bearer <token>
```

| Field      | Type   | Required | Notes |
|------------|--------|----------|-------|
| `name.ar`  | string | Yes      | Arabic name |
| `name.en`  | string | Yes      | English name |
| `groupSize`| string | Yes      | `_id` from Group |
| `imageUrl` | string | Yes      | S3 URL from Section 2 |
| `iconId`   | string | Yes      | `_id` from Category Icon |

```json
{
  "name": { "ar": "حمالة صدر", "en": "Bras" },
  "groupSize": "<groupId>",
  "imageUrl": "https://bucket.s3.amazonaws.com/Category/...",
  "iconId": "<categoryIconId>"
}
```

**Response (200)**
```json
{
  "statusCode": 200,
  "data": { "category": { "_id": "...", "name": { "ar": "...", "en": "..." }, "groupSize": "...", "image": { "mediaUrl": "...", "mediaId": "..." } } },
  "message": "Category created successfully",
  "success": true
}
```

### 4.2 Update Category

```
PATCH {{baseUrl}}/category/update/:_id
Authorization: Bearer <token>
```

| Field        | Type    | Required | Notes |
|--------------|---------|----------|-------|
| `name.ar`    | string  | No       |       |
| `name.en`    | string  | No       |       |
| `groupSize`  | string  | No       |       |
| `imageUrl`   | string  | No       |       |
| `iconId`     | string  | No       |       |

### 4.3 Soft Delete (hide)

```
PATCH {{baseUrl}}/category/soft-delete/:_id
Authorization: Bearer <token>
```

> **Cascading:** Also soft-deletes all sub-categories and products under this category.

### 4.4 Restore Soft-Deleted

```
PATCH {{baseUrl}}/category/restore/:_id
Authorization: Bearer <token>
```

> **Cascading:** Also restores all sub-categories and products under this category.

### 4.5 Hard Delete (permanent)

```
DELETE {{baseUrl}}/category/hard-delete/:_id
Authorization: Bearer <token>
```

> **Cascading:** Permanently deletes the category and all its sub-categories, products, variants, and associated S3 images. This is irreversible.

### 4.6 Get All Categories

```
GET {{baseUrl}}/category/get-all-categories
Authorization: Bearer <token>
```

Returns non-deleted categories with populated `subCategories` (name + image) and `icon` (key + svg).

### 4.7 Get All Deleted Categories

```
GET {{baseUrl}}/category/all-categories-deleted
Authorization: Bearer <token>
```

### 4.8 Get Category by ID

```
GET {{baseUrl}}/category/get-one-category/:_id
Authorization: Bearer <token>
```

Returns the category with populated:
- `subCategories` — full sub-category objects
- `sizeCategories` — sizes from the linked group (size + order)
- `icon` — SVG icon (key + svg)

---

## 5. Category Icons

SVG icons that can be assigned to categories. Each icon has a unique `key`.

**Base path:** `{{baseUrl}}/icons`

### 5.1 Create Icon

```
POST {{baseUrl}}/icons
Authorization: Bearer <token>
```

| Field      | Type    | Required | Notes |
|------------|---------|----------|-------|
| `key`      | string  | Yes      | Unique identifier (e.g. `"bras"`, `"pants"`) |
| `svg`      | string  | Yes      | SVG markup string |
| `isActive` | boolean | No       | Defaults to `true` |

```json
{
  "key": "bras",
  "svg": "<svg>...</svg>",
  "isActive": true
}
```

**Response (201)**
```json
{
  "statusCode": 201,
  "data": { "icon": { "_id": "...", "key": "bras", "svg": "<svg>...</svg>", "isActive": true } },
  "message": "Category icon created successfully",
  "success": true
}
```

**Errors**

| Situation         | Code | Message |
|-------------------|------|---------|
| Duplicate key     | 409  | `"An icon with this key already exists"` |

### 5.2 Get All Icons

```
GET {{baseUrl}}/icons
Authorization: Bearer <token>
```

### 5.3 Get Icon by Key

```
GET {{baseUrl}}/icons/:key
Authorization: Bearer <token>
```

### 5.4 Update Icon

```
PUT {{baseUrl}}/icons/:key
Authorization: Bearer <token>
```

| Field      | Type    | Required |
|------------|---------|----------|
| `svg`      | string  | No       |
| `isActive` | boolean | No       |

### 5.5 Delete Icon

```
DELETE {{baseUrl}}/icons/:key
Authorization: Bearer <token>
```

---

## 6. Sub-Category Management

Sub-categories belong to a category and also require a `groupSize`.

**Base path:** `{{baseUrl}}/sub-category`

### 6.1 Create Sub-Category

```
POST {{baseUrl}}/sub-category/create
Authorization: Bearer <token>
```

| Field       | Type   | Required | Notes |
|-------------|--------|----------|-------|
| `name.ar`   | string | Yes      | Arabic name |
| `name.en`   | string | Yes      | English name |
| `groupSize` | string | Yes      | `_id` from Group |
| `category`  | string | Yes      | `_id` from Category |
| `imageUrl`  | string | Yes      | S3 URL |

```json
{
  "name": { "ar": "ملابس رياضية", "en": "Sportswear" },
  "groupSize": "<groupId>",
  "category": "<categoryId>",
  "imageUrl": "https://bucket.s3.amazonaws.com/SubCategory/..."
}
```

### 6.2 Update Sub-Category

```
PATCH {{baseUrl}}/sub-category/update/:_id
Authorization: Bearer <token>
```

| Field          | Type    | Required |
|----------------|---------|----------|
| `name.ar`      | string  | No       |
| `name.en`      | string  | No       |
| `groupSize`    | string  | No       |
| `category`     | string  | No       |
| `imageUrl`     | string  | No       |

### 6.3 Soft Delete

```
PATCH {{baseUrl}}/sub-category/soft-delete/:_id
Authorization: Bearer <token>
```

> **Cascading:** Also soft-deletes all products under this sub-category.

### 6.4 Restore

```
PATCH {{baseUrl}}/sub-category/restore/:_id
Authorization: Bearer <token>
```

> **Cascading:** Also restores all products under this sub-category.

### 6.5 Hard Delete

```
DELETE {{baseUrl}}/sub-category/hard-delete/:_id
Authorization: Bearer <token>
```

> **Cascading:** Permanently deletes the sub-category and all its products, variants, and associated S3 images. This is irreversible.

### 6.6 Get All Sub-Categories

```
GET {{baseUrl}}/sub-category/get-all-sub-categories
Authorization: Bearer <token>
```

Returns non-deleted sub-categories with populated `category` (name + image).

### 6.7 Get All Deleted Sub-Categories

```
GET {{baseUrl}}/sub-category/all-deleted-sub-categories
Authorization: Bearer <token>
```

### 6.8 Get Sub-Category by ID

```
GET {{baseUrl}}/sub-category/get-one-sub-category/:_id
Authorization: Bearer <token>
```

Returns the sub-category with populated:
- `category` — full parent category object
- `sizeCategories` — sizes from the linked group (size + order)

---

## 7. Color Management

Colors are referenced by product variants.

**Base path:** `{{baseUrl}}/color`

### 7.1 Create Color

```
POST {{baseUrl}}/color
Authorization: Bearer <token>
```

| Field    | Type   | Required | Notes |
|----------|--------|----------|-------|
| `name.ar`| string | Yes      | Arabic name |
| `name.en`| string | Yes      | English name |
| `hex`    | string | Yes      | Hex code (e.g. `"#FF0000"`) |

```json
{
  "name": { "ar": "أحمر", "en": "Red" },
  "hex": "#FF0000"
}
```

**Response (201)**
```json
{
  "statusCode": 201,
  "data": { "color": { "_id": "...", "name": { "ar": "أحمر", "en": "Red" }, "hex": "#FF0000" } },
  "message": "Color created successfully",
  "success": true
}
```

### 7.2 Update Color

```
PATCH {{baseUrl}}/color/:_id
Authorization: Bearer <token>
```

| Field    | Type   | Required | Notes |
|----------|--------|----------|-------|
| `name`   | object | No       | If sent, both `ar` and `en` are required inside |
| `name.ar`| string | Yes (if `name` sent) | |
| `name.en`| string | Yes (if `name` sent) | |
| `hex`    | string | No       | |

### 7.3 Delete Color

```
DELETE {{baseUrl}}/color/:_id
Authorization: Bearer <token>
```

### 7.4 Get All Colors

```
GET {{baseUrl}}/color
Authorization: Bearer <token>
```

### 7.5 Get Color by ID

```
GET {{baseUrl}}/color/:_id
Authorization: Bearer <token>
```

---

## 8. Shipping Management

Shipping options shown at checkout. Accessible by both `admin` and `user` roles.

**Base path:** `{{baseUrl}}/shipping`

### 8.1 Create Shipping

```
POST {{baseUrl}}/shipping
Authorization: Bearer <token>
```

| Field    | Type   | Required |
|----------|--------|----------|
| `name.ar`| string | Yes      |
| `name.en`| string | Yes      |
| `cost`   | number | Yes      |

```json
{
  "name": { "ar": "القاهرة", "en": "Cairo" },
  "cost": 75
}
```

**Response (201)**
```json
{
  "statusCode": 201,
  "data": {
    "shipping": {
      "_id": "69cd883f8e13c19f521dd2ae",
      "name": { "ar": "القاهرة", "en": "Cairo" },
      "cost": 75
    }
  },
  "message": "Shipping created successfully",
  "success": true
}
```

### 8.2 Update Shipping

```
PATCH {{baseUrl}}/shipping/:_id
Authorization: Bearer <token>
```

| Field    | Type   | Required | Notes |
|----------|--------|----------|-------|
| `name`   | object | No       | If sent, both `ar` and `en` are required inside |
| `name.ar`| string | Yes (if `name` sent) | |
| `name.en`| string | Yes (if `name` sent) | |
| `cost`   | number | No       | |

### 8.3 Delete Shipping

```
DELETE {{baseUrl}}/shipping/:_id
Authorization: Bearer <token>
```

### 8.4 Get All Shipping Options

```
GET {{baseUrl}}/shipping
Authorization: Bearer <token>
```

### 8.5 Get Shipping by ID

```
GET {{baseUrl}}/shipping/:_id
Authorization: Bearer <token>
```

---

## 9. Product Management

Products require categories, colors, and at least one variant. Images must be uploaded to S3 first.

**Base path:** `{{baseUrl}}/product`

### 9.1 Create Product

```
POST {{baseUrl}}/product/create
Authorization: Bearer <token>
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name.ar` | string | Yes | Arabic name |
| `name.en` | string | Yes | English name |
| `description.ar` | string | Yes | Arabic description |
| `description.en` | string | Yes | English description |
| `price` | number | Yes | Regular price |
| `wholesalePrice` | number | No | Wholesale price |
| `salePrice` | number | No | Discounted price. Must be < `price` to activate sale |
| `saleStartDate` | number | No | Unix timestamp (ms). Use `0` for no date |
| `saleEndDate` | number | No | Unix timestamp (ms). Use `0` for no date |
| `category` | string | Yes | `_id` from Category |
| `subCategory` | string | No | `_id` from Sub-Category |
| `defaultImage` | string | Yes | Main image S3 URL |
| `albumImages` | string[] | No | Additional image S3 URLs |
| `sizeChartImage` | string | No | Size guide image S3 URL |
| `variants` | array | Yes | At least one variant |
| `variants[].size` | string | No | Size string. Defaults to `"one size"` |
| `variants[].color` | string | Yes | `_id` from Color |
| `variants[].quantity` | number | Yes | Stock count (min: 0) |

```json
{
  "name": { "ar": "بنطلون قطني", "en": "Cotton Pants" },
  "description": { "ar": "بنطلون قطني مريح", "en": "Comfortable cotton pants" },
  "price": 500,
  "wholesalePrice": 200,
  "salePrice": 350,
  "saleStartDate": 0,
  "saleEndDate": 0,
  "category": "<categoryId>",
  "subCategory": "<subCategoryId>",
  "defaultImage": "https://bucket.s3.amazonaws.com/Product/...",
  "albumImages": [
    "https://bucket.s3.amazonaws.com/Product/...",
    "https://bucket.s3.amazonaws.com/Product/..."
  ],
  "sizeChartImage": "https://bucket.s3.amazonaws.com/Product/...",
  "variants": [
    { "size": "xs", "color": "<colorId>", "quantity": 10 },
    { "size": "s", "color": "<colorId>", "quantity": 5 },
    { "size": "m", "color": "<colorId>", "quantity": 8 }
  ]
}
```

**Response (201)**
```json
{
  "statusCode": 201,
  "data": { "product": { "_id": "...", "name": {...}, ... } },
  "message": "Product created successfully",
  "success": true
}
```

**Auto-calculated fields:**
- `finalPrice` — equals `salePrice` if sale is active, otherwise equals `price`
- `isSale` — `true` if `salePrice > 0` and `salePrice < price`
- `isNewArrival` — defaults to `true` on creation

**Errors**

| Situation | Code | Message |
|-----------|------|---------|
| Invalid category ID | 400 | `"Category not found"` |
| Invalid sub-category ID | 400 | `"SubCategory not found"` |

---

### 9.2 Update Product

```
PATCH {{baseUrl}}/product/update/:productId
Authorization: Bearer <token>
```

Send only the fields you want to change. When `price` or `salePrice` change, `finalPrice` and `isSale` are **auto-recalculated**.

| Field | Type | Required |
|-------|------|----------|
| `name.ar` | string | No |
| `name.en` | string | No |
| `description.ar` | string | No |
| `description.en` | string | No |
| `price` | number | No |
| `wholesalePrice` | number | No |
| `salePrice` | number | No |
| `saleStartDate` | number | No |
| `saleEndDate` | number | No |
| `category` | string | No |
| `subCategory` | string | No |
| `defaultImage` | string | No |
| `albumImages` | string[] | No |
| `sizeChartImage` | string\|null | No | Send `null` to remove |
| `isBestSeller` | boolean | No |
| `isNewArrival` | boolean | No |

### 9.3 Soft Delete

```
PATCH {{baseUrl}}/product/soft-delete/:productId
Authorization: Bearer <token>
```

### 9.4 Restore

```
PATCH {{baseUrl}}/product/restore/:productId
Authorization: Bearer <token>
```

### 9.5 Hard Delete (permanent — also deletes variants and S3 images)

```
DELETE {{baseUrl}}/product/hard-delete/:productId
Authorization: Bearer <token>
```

### 9.6 Get All Products (Paginated + Filtered)

```
GET {{baseUrl}}/product/get-all-products
Authorization: Bearer <token>
```

**Query Parameters**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `page` | number | No | Page number (default: 1). 20 items per page |
| `category` | string | No | Filter by category `_id` |
| `subCategory` | string | No | Filter by sub-category `_id` |
| `isSale` | boolean | No | Only products on sale |
| `isNewArrival` | boolean | No | Only new arrivals |
| `isBestSeller` | boolean | No | Only best sellers |
| `isSoldOut` | boolean | No | Only sold-out products |
| `isDeleted` | boolean | No | `true` to show deleted products only |

**Response (200)**
```json
{
  "statusCode": 200,
  "data": {
    "products": [ ... ],
    "currentPage": 1,
    "totalItems": 42,
    "totalPages": 3
  },
  "message": "Product found successfully",
  "success": true
}
```

Each product in the array includes populated `category` and `subCategory` references.

### 9.7 Get Product by ID

```
GET {{baseUrl}}/product/get-one-product/:productId
Authorization: Bearer <token>
```

Returns the product with populated `category` (name only), `subCategory` (name only), and `variants` (with full color details). The `product` field is excluded from variant JSON responses.

### 9.8 Search Products (Fuzzy)

```
GET {{baseUrl}}/product/search?searchQuery=<term>
Authorization: Bearer <token>
```

| Param | Type | Required |
|-------|------|----------|
| `searchQuery` | string | Yes |

Returns matching products by name (Arabic and English) using fuzzy search. Results include `_id` and `name` only.

### 9.9 Get Product Analysis

```
GET {{baseUrl}}/product/get-analysis
Authorization: Bearer <token>
```

See [Section 16](#16-product-analysis-dashboard) for the full response shape.

---

## 10. Variant Management

Variants are individual **size + color + stock** combinations on a product. They are created automatically with the product, but can be managed individually.

**Base path:** `{{baseUrl}}/variant`

### 10.1 Create Single Variant

```
POST {{baseUrl}}/variant
Authorization: Bearer <token>
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `productId` | string | Yes | `_id` of the product |
| `size` | string | Yes | Size value |
| `color` | string | Yes | `_id` from Color |
| `quantity` | number | Yes | Stock count (min: 0) |

```json
{
  "productId": "<productId>",
  "size": "XS",
  "color": "<colorId>",
  "quantity": 5
}
```

**Response (201)**
```json
{
  "statusCode": 201,
  "data": { "variant": { "_id": "...", "size": "XS", "color": "...", "quantity": 5 } },
  "message": "Variant created successfully",
  "success": true
}
```

> **Unique constraint:** Each combination of `product + size + color` must be unique.

### 10.2 Update Single Variant (Quantity)

```
PATCH {{baseUrl}}/variant/:variantId
Authorization: Bearer <token>
```

| Field | Type | Required |
|-------|------|----------|
| `productId` | string | Yes |
| `quantity` | number | Yes |

```json
{
  "productId": "<productId>",
  "quantity": 15
}
```

### 10.3 Delete Single Variant

```
DELETE {{baseUrl}}/variant/:variantId
Authorization: Bearer <token>
```

The controller expects `productId` in the request body to update the product's sold-out status after deletion. The `variantId` comes from the URL path.

### 10.4 Bulk Update Variants

```
PATCH {{baseUrl}}/variant/bulk
Authorization: Bearer <token>
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `productId` | string | Yes | 24-char hex ObjectId |
| `variants` | array | Yes | Min 1 entry |
| `variants[]._id` | string | Yes | 24-char hex ObjectId |
| `variants[].size` | string | No | |
| `variants[].color` | string | No | 24-char hex ObjectId |
| `variants[].quantity` | number | No | Integer, min 0 |

```json
{
  "productId": "<productId>",
  "variants": [
    { "_id": "<variantId>", "color": "<colorId>", "size": "m", "quantity": 55 },
    { "_id": "<variantId>", "color": "<colorId>", "size": "l", "quantity": 20 }
  ]
}
```

**Response (200)** — returns MongoDB bulk write result:
```json
{
  "statusCode": 200,
  "data": { "result": { "matchedCount": 2, "modifiedCount": 2 } },
  "message": "Variant updated successfully",
  "success": true
}
```

### 10.5 Bulk Delete Variants

```
DELETE {{baseUrl}}/variant/bulk
Authorization: Bearer <token>
```

| Field | Type | Required |
|-------|------|----------|
| `productId` | string | Yes |
| `variantIds` | string[] | Yes |

```json
{
  "productId": "<productId>",
  "variantIds": ["<variantId1>", "<variantId2>"]
}
```

**Response (200)** — returns MongoDB delete result:
```json
{
  "statusCode": 200,
  "data": { "result": { "deletedCount": 2 } },
  "message": "Variant deleted successfully",
  "success": true
}
```

### 10.6 Get All Variants for a Product

```
GET {{baseUrl}}/variant/product/:productId
Authorization: Bearer <token>
```

Returns variants with populated `color` (name + hex).

### 10.7 Get Variant by ID

```
GET {{baseUrl}}/variant/:variantId
Authorization: Bearer <token>
```

Returns the variant with populated `color` (name + hex).

---

## 11. Image Slider (Hero Section)

Banner images on the storefront homepage. Each record holds two images: one `small` (mobile) and one `large` (desktop).

**Base path:** `{{baseUrl}}/hero-section`

### 11.1 Create Hero Section

Upload both images to S3 first.

```
POST {{baseUrl}}/hero-section/create
Authorization: Bearer <token>
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `images.image1.imageUrl` | string | Yes | S3 URL |
| `images.image1.imageType` | string | Yes | `"small"` or `"large"` |
| `images.image2.imageUrl` | string | Yes | S3 URL |
| `images.image2.imageType` | string | Yes | `"small"` or `"large"` |

```json
{
  "images": {
    "image1": {
      "imageUrl": "https://bucket.s3.amazonaws.com/ImageSlider/...",
      "imageType": "small"
    },
    "image2": {
      "imageUrl": "https://bucket.s3.amazonaws.com/ImageSlider/...",
      "imageType": "large"
    }
  }
}
```

### 11.2 Update Hero Section

```
PATCH {{baseUrl}}/hero-section/:_id
Authorization: Bearer <token>
```

Same body structure as create.

### 11.3 Delete Hero Section

```
DELETE {{baseUrl}}/hero-section/:_id
Authorization: Bearer <token>
```

> Also deletes the associated S3 images.

### 11.4 Get All Hero Sections

```
GET {{baseUrl}}/hero-section/all
Authorization: Bearer <token>
```

### 11.5 Get Hero Section by ID

```
GET {{baseUrl}}/hero-section/:_id
Authorization: Bearer <token>
```

---

## 12. Social Reviews

Social proof images displayed on the storefront.

**Base path:** `{{baseUrl}}/social-review`

### 12.1 Create Social Review

Upload image to S3 first.

```
POST {{baseUrl}}/social-review
Authorization: Bearer <token>
```

| Field | Type | Required |
|-------|------|----------|
| `imageUrl` | string | Yes |

```json
{
  "imageUrl": "https://bucket.s3.amazonaws.com/SocialReview/..."
}
```

### 12.2 Update Social Review

```
PATCH {{baseUrl}}/social-review/:_id
Authorization: Bearer <token>
```

| Field | Type | Required |
|-------|------|----------|
| `imageUrl` | string | No |

> **Note:** `_id` must be a 24-character hex string.

### 12.3 Delete Social Review

```
DELETE {{baseUrl}}/social-review/:_id
Authorization: Bearer <token>
```

> Also deletes the associated S3 image.

### 12.4 Get All Social Reviews

```
GET {{baseUrl}}/social-review
Authorization: Bearer <token>
```

### 12.5 Get Social Review by ID

```
GET {{baseUrl}}/social-review/:_id
Authorization: Bearer <token>
```

---

## 13. Offers

Promotions applied automatically at checkout.

**Base path:** `{{baseUrl}}/offers`

| Type | What it does |
|------|-------------|
| `fixed_discount` | Deducts a fixed amount from the order total when minimum is met |
| `free_shipping` | Removes shipping cost when minimum order amount is met |

### 13.1 Create Offer

Upload offer image to S3 first.

```
POST {{baseUrl}}/offers
Authorization: Bearer <token>
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string | Yes | `"fixed_discount"` or `"free_shipping"` |
| `isActive` | boolean | Yes | `true` to make it live immediately |
| `image` | string | Yes | S3 URL |
| `description.ar` | string | Yes | Arabic description |
| `description.en` | string | Yes | English description |
| `minOrderAmount` | number | Yes | Minimum cart total to trigger offer |
| `discountAmount` | number | Only for `fixed_discount` | Amount to subtract. Send `0` for `free_shipping` |

**Fixed Discount Example**
```json
{
  "type": "fixed_discount",
  "isActive": true,
  "image": "https://bucket.s3.amazonaws.com/Offers/...",
  "description": {
    "ar": "اشتري بـ 3000 جنيه واحصل على خصم 100 جنيه",
    "en": "Shop for 3000 EGP and get 100 EGP off"
  },
  "minOrderAmount": 3000,
  "discountAmount": 100
}
```

**Free Shipping Example**
```json
{
  "type": "free_shipping",
  "isActive": true,
  "image": "https://bucket.s3.amazonaws.com/Offers/...",
  "description": {
    "ar": "شحن مجاني عند الشراء بـ 500 جنيه",
    "en": "Free shipping on orders above 500 EGP"
  },
  "minOrderAmount": 500,
  "discountAmount": 0
}
```

> **Note:** When an offer is created or toggled to `isActive: true`, an email notification is automatically sent to all customers.

### 13.2 Update Offer

```
PATCH {{baseUrl}}/offers/:offerId
Authorization: Bearer <token>
```

Same fields as create, all optional. If a new `image` is provided, the old S3 image is deleted automatically.

### 13.3 Toggle Offer Active/Inactive

```
PATCH {{baseUrl}}/offers/toggle/:offerId
Authorization: Bearer <token>
```

| Field | Type | Required |
|-------|------|----------|
| `isActive` | boolean | Yes |

```json
{ "isActive": false }
```

### 13.4 Delete Offer

```
DELETE {{baseUrl}}/offers/:offerId
Authorization: Bearer <token>
```

> Also deletes the associated S3 image.

### 13.5 Get All Offers

```
GET {{baseUrl}}/offers
Authorization: Bearer <token>
```

### 13.6 Get Offer by ID

```
GET {{baseUrl}}/offers/:offerId
Authorization: Bearer <token>
```

---

## 14. Wishlist (Admin View)

View all products customers have added to their wishlists.

```
GET {{baseUrl}}/wishlist?page=1
Authorization: Bearer <token>
```

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `page` | number | No | Page number (integer, min: 1). 20 items per page |

**Response (200)**
```json
{
  "statusCode": 200,
  "data": {
    "wishlist": {
      "totalItems": 100,
      "totalPages": 5,
      "currentPage": 1,
      "products": [
        {
          "product": {
            "_id": "...",
            "name": { "ar": "...", "en": "..." },
            "defaultImage": { "mediaUrl": "...", "mediaId": "..." },
            "albumImages": [...],
            "finalPrice": 350,
            "category": { "name": { "ar": "...", "en": "..." }, "image": {...} }
          },
          "customer": {
            "_id": "...",
            "phone": "01012345678",
            "email": "customer@example.com"
          },
          "createdAt": 1711828000
        }
      ]
    }
  },
  "message": "wishlist found successfully",
  "success": true
}
```

Each wishlist item includes:
- `product` — product details with category (name + image)
- `customer` — phone number + email (resolved from customer info records)

---

## 15. Order Management

**Base path:** `{{baseUrl}}/order`

### 15.1 Get All Orders (Paginated + Filtered)

```
GET {{baseUrl}}/order/admin/all
Authorization: Bearer <token>
```

**Query Parameters**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `page` | number | No | Page number (default: 1). 10 items per page |
| `status` | string | No | Filter by order status |
| `search` | string | No | Search by order number (fuzzy match) |

**Available `status` values:**

| Status | Meaning |
|--------|---------|
| `under_review` | Order is being reviewed (initial status) |
| `confirmed` | Admin confirmed the order |
| `ordered` | Order placed/processed |
| `shipped` | Order dispatched |
| `delivered` | Order received by customer |
| `cancelled` | Order was cancelled |
| `deleted` | Order was deleted |

**Response (200)**
```json
{
  "statusCode": 200,
  "data": {
    "orders": [ ... ],
    "currentPage": 1,
    "totalItems": 56,
    "totalPages": 6,
    "filters": {
      "status": "ordered",
      "searchTerm": null
    }
  },
  "message": "Order found successfully",
  "success": true
}
```

**Order number format:** `ORD-XXXXXX-XXXX` (6 timestamp digits + 4 random digits).

Each order in the array is populated with:
- `customer` — phone number
- `customerInfo` — name, address, shipping details
- `shipping` — shipping name and cost
- `products[].productId` — product default image
- `products[].color` — color details

### 15.2 Get Order by ID

```
GET {{baseUrl}}/order/admin/:orderId
Authorization: Bearer <token>
```

Returns the full order with all populated references (customer, customerInfo, shipping, product images, colors).

### 15.3 Update Order Status

```
PATCH {{baseUrl}}/order/admin/status/:orderId
Authorization: Bearer <token>
```

| Field | Type | Required |
|-------|------|----------|
| `status` | string | Yes |

```json
{ "status": "confirmed" }
```

> **Stock management:** When transitioning between active statuses (`under_review`, `confirmed`, `ordered`, `shipped`, `delivered`) and inactive statuses (`cancelled`, `deleted`), variant stock quantities are automatically adjusted (restored or deducted).

### 15.4 Apply Free Shipping

Override the shipping cost to zero for a specific order.

```
PATCH {{baseUrl}}/order/admin/free-shipping/:orderId
Authorization: Bearer <token>
```

No request body needed. The `totalAmount` is recalculated automatically.

---

## 16. Product Analysis (Dashboard)

```
GET {{baseUrl}}/product/get-analysis
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "statusCode": 200,
  "data": {
    "analysis": {
      "products": {
        "total": 150,
        "soldOut": 5,
        "topSelling": [
          { "_id": "...", "name": { "ar": "...", "en": "..." }, "soldItems": 42, "defaultImage": {...}, "finalPrice": 350 }
        ],
        "mostWishlisted": [
          { "count": 15, "product": { "_id": "...", "name": {...}, "defaultImage": {...}, "finalPrice": 350 } }
        ],
        "totalFinalPrice": 75000,
        "totalWholesalePrice": 30000
      },
      "categories": {
        "total": 8,
        "subCategories": 24
      },
      "orders": {
        "total": 560,
        "todaySales": 2500,
        "todayOrders": 3,
        "totalRevenue": 150000,
        "averageOrderValue": 268,
        "byStatus": {
          "under_review": 10,
          "confirmed": 25,
          "shipped": 30,
          "delivered": 450,
          "cancelled": 45
        },
        "last7Days": [
          { "_id": "2026-05-21", "total": 3500, "orders": 5 },
          { "_id": "2026-05-22", "total": 2100, "orders": 3 }
        ]
      },
      "customers": {
        "total": 320
      }
    }
  },
  "message": "Success",
  "success": true
}
```

---

## 17. Recommended Setup Order

Follow this sequence when setting up the system for the first time:

```
 1. POST /authentication/register-email        → request activation email
 2. POST /authentication/active-account        → get Bearer token
 3. POST /aws/get-presigned-url                → upload reference images to S3
 4. POST /group-size/group                     → create size groups (letters / numeric)
 5. POST /group-size/size                      → create individual sizes per group
 6. POST /color                                → create colors for product variants
 7. POST /shipping                             → create shipping regions & costs
 8. POST /icons                                → create category icons (SVG)
 9. POST /category/create                      → create product categories
10. POST /sub-category/create                  → create sub-categories
11. POST /product/create                       → create products with variants
12. POST /hero-section/create                  → set up homepage image slider
13. POST /social-review                        → add social proof images
14. POST /offers                               → create promotions
```

---

## 18. Standard Response Envelope

### Success

```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Human-readable message",
  "success": true
}
```

### Validation Error (from Joi middleware)

Returned when request body/params/query fail validation. Uses `"errors"` (plural) key.

```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation Error!",
  "errors": [
    {
      "message": "\"email\" is required",
      "path": ["email"],
      "type": "any.required",
      "context": { "label": "email", "key": "email" }
    }
  ]
}
```

> **Note:** The validation middleware merges `req.body`, `req.params`, and `req.query` into a single object before validation.

### Business Logic / Resource Error (from global error handler)

Returned for non-validation errors (not found, unauthorized, business rule failures). Uses `"error"` (singular) key.

```json
{
  "success": false,
  "message": "Category not found",
  "error": []
}
```

### Database Error (duplicate / cast)

```json
{
  "success": false,
  "message": "Duplicate value for field: email",
  "error": null
}
```

---

## 19. Error Reference

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 201  | Created successfully |
| 400  | Bad request — validation error or business logic failure |
| 401  | Unauthorized — token missing, expired, or invalid |
| 403  | Forbidden — insufficient role/permissions |
| 404  | Resource not found |
| 409  | Conflict — duplicate entry |
| 500  | Internal server error |

### Authentication Errors

| Message | Code |
|---------|------|
| `"Authorization token is missing"` | 401 |
| `"Access token has expired"` | 401 |
| `"Access token is invalid"` | 401 |
| `"user token is invalid"` | 401 |
| `"no token provided or in-valid Bearer Key"` | 401 |
| `"Invalid token payload"` | 401 |
| `"Forbidden: You must have the role to access this resource"` | 403 |
| `"You do not have permission"` | 403 |

### Resource Errors

| Message | Code |
|---------|------|
| `"email not found"` | 400 |
| `"activeCode is incorrect"` | 400 |
| `"active code is expired"` | 400 |
| `"Category not found"` | 404 |
| `"SubCategory not found"` | 404 |
| `"Product not found"` | 400/404 |
| `"Color not found"` | 404 |
| `"Variant not found"` | 404 |
| `"Group size not found"` | 400 |
| `"Size category not found"` | 400 |
| `"Shipping not found"` | 404 |
| `"Order not found"` | 404 |
| `"Offer not found"` | 404 |
| `"Review not found"` | 404 |
| `"Customer not found"` | 404 |
| `"Category icon not found"` | 404 |
| `"An icon with this key already exists"` | 409 |
| `"No files provided"` | 400 |
| `"Unsupported file type"` | 400 |
| `"Some variants not found"` | 404 |
| `"No variants matched — check productId or variant IDs"` | 404 |

### Mongoose/Database Errors

| Situation | Code | Message |
|-----------|------|---------|
| Duplicate unique field | 409 | `"Duplicate value for field: <fieldName>"` |
| Invalid ObjectId | 400 | `"Invalid value for field: <path>"` |
| Schema validation failure | 400 | `"Validation failed"` with field-level details |
