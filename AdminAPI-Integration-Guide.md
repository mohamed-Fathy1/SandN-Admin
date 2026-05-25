# S&N Admin API — Integration Guide

> **Base URL variable:** `{{urlDev}}` — replace with your actual server URL.
> All requests and responses use **JSON** (`Content-Type: application/json`).
> Almost every endpoint requires a **Bearer token** in the `Authorization` header.
> Get the token from Step 2 of Authentication below.

```
Authorization: Bearer <your_access_token>
```

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [File Uploads (AWS S3)](#2-file-uploads-aws-s3)
3. [Group & Size Management](#3-group--size-management)
4. [Category Management](#4-category-management)
5. [Sub-Category Management](#5-sub-category-management)
6. [Color Management](#6-color-management)
7. [Shipping Management](#7-shipping-management)
8. [Product Management](#8-product-management)
9. [Variant Management](#9-variant-management)
10. [Image Slider (Hero Section)](#10-image-slider-hero-section)
11. [Social Reviews](#11-social-reviews)
12. [Offers](#12-offers)
13. [Wishlist (Admin View)](#13-wishlist-admin-view)
14. [Order Management](#14-order-management)
15. [Recommended Setup Order](#15-recommended-setup-order)
16. [Error Reference](#16-error-reference)

---

## 1. Authentication

### Step 1 — Request Activation Email

Send the admin email to receive a one-time activation code.

**Request**
```
POST {{urlDev}}/authentication/register-email
```
```json
{
  "email": "admin@example.com"
}
```

**Success Response (200)**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Welcome email sent successfully",
  "success": true
}
```

---

### Step 2 — Activate Account & Get Token

Submit the activation code from the email. On success, you receive an `accessToken`.

**Request**
```
POST {{urlDev}}/authentication/active-account
```
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

**Common Errors**

| Situation | Code | Message |
|-----------|------|---------|
| Wrong activation code | 400 | `"activeCode is incorrect"` |
| Code has expired | 400 | `"active code is expired"` |
| Missing fields | 400 | Validation error |

---

### Step 3 — Resend Activation Code

If the code expires or never arrived, request a new one.

**Request**
```
POST {{urlDev}}/authentication/email-new-code
```
```json
{
  "email": "admin@example.com"
}
```

---

## 2. File Uploads (AWS S3)

All image URLs used in categories, products, offers, etc. must be uploaded to S3 first. Follow these two steps every time you need to store an image.

### Step 1 — Get a Pre-signed Upload URL

**Request**
```
POST {{urlPr}}/aws/get-presigned-url
Authorization: Bearer <token>
```
```json
{
  "folder": "Offers",
  "files": [
    {
      "contentType": "image/jpg"
    }
  ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `folder` | Yes | One of: `Offers`, `ImageSlider`, `Category`, `SubCategory`, `SocialReview`, `Product` |
| `files[].contentType` | Yes | MIME type, e.g. `image/jpg`, `image/png` |
| `files[].fileName` | No | Reuse an existing file name to overwrite |

**Success Response** — returns a `uploadUrl` (the S3 pre-signed URL) and a `fileUrl` (the final public URL to save in your database).

---

### Step 2 — Upload the File to S3

Use the `uploadUrl` from Step 1. Send the raw binary file as the request body.

**Request**
```
PUT <uploadUrl from Step 1>
Content-Type: image/jpg   ← must match what you declared above
```
Body: raw binary image data.

**Success**: HTTP 200 with no body. The image is now live at the `fileUrl` you received in Step 1.

---

### Delete an Image

**Request**
```
DELETE {{url}}/aws/delete-presigned-url?fileName=<mediaId>
Authorization: Bearer <token>
```

Example: `?fileName=Offers/69cd86918e13c19f521dd29b_1775755379177_0`

---

## 3. Group & Size Management

Groups define the *type* of sizing used by a product (e.g. letters like S/M/L or numeric like 36/38/40). Sizes belong to groups. Set these up before creating categories.

### Group Operations

#### Create a Group
```
POST {{urlDev}}/group-size/group
Authorization: Bearer <token>
```
```json
{
  "name": "letters"
}
```
> Valid values: `"letters"` or `"numeric"`.

#### Get All Groups
```
GET {{urlDev}}/group-size/group-all
Authorization: Bearer <token>
```

#### Get Group by ID
```
GET {{urlDev}}/group-size/group/:groupId
Authorization: Bearer <token>
```

#### Update Group
```
PATCH {{urlDev}}/group-size/update-group/:groupId
Authorization: Bearer <token>
```
```json
{ "name": "numeric" }
```

---

### Size Operations

#### Create a Size
```
POST {{urlDev}}/group-size/size
Authorization: Bearer <token>
```
```json
{
  "groupSize": "<groupId>",
  "size": "XL",
  "order": 5
}
```
> `order` controls the display sort order.

#### Update a Size
```
PATCH {{urlDev}}/group-size/size/:sizeId
Authorization: Bearer <token>
```
```json
{
  "groupSize": "<groupId>",
  "size": "XXL",
  "order": 6
}
```

#### Delete a Size
```
DELETE {{urlDev}}/group-size/size/:sizeId
Authorization: Bearer <token>
```

#### Get All Sizes
```
GET {{urlDev}}/group-size/all-size
Authorization: Bearer <token>
```

#### Get All Sizes by Group ID
```
GET {{urlDev}}/group-size/all-sizes-by-group/:groupId
Authorization: Bearer <token>
```

#### Get Size by ID
```
GET {{urlDev}}/group-size/one-size/:sizeId
Authorization: Bearer <token>
```

---

## 4. Category Management

Categories require a `groupSize` ID. Create groups first.

### Create Category

Upload the image first (Section 2), then use the returned URL here.

**Request**
```
POST {{urlDev}}/category/create
Authorization: Bearer <token>
```
```json
{
  "name": {
    "ar": "حمالة صدر",
    "en": "Bras"
  },
  "groupSize": "<groupId>",
  "imageUrl": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/..."
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name.ar` | Yes | Arabic name |
| `name.en` | Yes | English name |
| `groupSize` | Yes | `_id` from Group |
| `imageUrl` | Yes | S3 URL from Section 2 |

---

### Update Category
```
PATCH {{urlDev}}/category/update/:categoryId
Authorization: Bearer <token>
```
Same body as create.

### Soft Delete (hide without removing)
```
PATCH {{urlDev}}/category/soft-delete/:categoryId
Authorization: Bearer <token>
```

### Restore a Soft-Deleted Category
```
PATCH {{urlDev}}/category/restore/:categoryId
Authorization: Bearer <token>
```

### Hard Delete (permanent)
```
DELETE {{urlDev}}/category/hard-delete/:categoryId
Authorization: Bearer <token>
```

### Get All Deleted Categories
```
GET {{urlDev}}/category/all-categories-deleted
Authorization: Bearer <token>
```

### Get All Categories
```
GET {{urlDev}}/category/get-all-categories
Authorization: Bearer <token>
```

### Get Category by ID
```
GET {{urlDev}}/category/get-one-category/:categoryId
Authorization: Bearer <token>
```

---

## 5. Sub-Category Management

Sub-categories belong to a category and also require a `groupSize`.

### Create Sub-Category
```
POST {{urlDev}}/sub-category/create
Authorization: Bearer <token>
```
```json
{
  "name": {
    "ar": "ملابس رياضية",
    "en": "sportWear"
  },
  "groupSize": "<groupId>",
  "category": "<categoryId>",
  "imageUrl": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/..."
}
```

### Update Sub-Category
```
PATCH {{urlDev}}/sub-category/update/:subCategoryId
Authorization: Bearer <token>
```
Same body as create.

### Soft Delete
```
PATCH {{urlDev}}/sub-category/soft-delete/:subCategoryId
Authorization: Bearer <token>
```

### Restore
```
PATCH {{urlDev}}/sub-category/restore/:subCategoryId
Authorization: Bearer <token>
```

### Hard Delete
```
DELETE {{urlDev}}/sub-category/hard-delete/:subCategoryId
Authorization: Bearer <token>
```

### Get All Deleted Sub-Categories
```
GET {{urlDev}}/sub-category/all-deleted-sub-categories
Authorization: Bearer <token>
```

### Get All Sub-Categories
```
GET {{urlDev}}/sub-category/get-all-sub-categories
Authorization: Bearer <token>
```

### Get Sub-Category by ID
```
GET {{urlDev}}/sub-category/get-one-sub-category/:subCategoryId
Authorization: Bearer <token>
```

---

## 6. Color Management

Colors are used when creating product variants.

### Create Color
```
POST {{urlDev}}/color
Authorization: Bearer <token>
```
```json
{
  "name": {
    "ar": "أحمر",
    "en": "Red"
  },
  "hex": "#FF0000"
}
```

### Update Color
```
PATCH {{urlDev}}/color/:colorId
Authorization: Bearer <token>
```
Same body as create.

### Delete Color
```
DELETE {{urlDev}}/color/:colorId
Authorization: Bearer <token>
```

### Get All Colors
```
GET {{urlDev}}/color
Authorization: Bearer <token>
```

### Get Color by ID
```
GET {{urlDev}}/color/:colorId
Authorization: Bearer <token>
```

---

## 7. Shipping Management

Shipping options are shown to customers at checkout. Create these before products go live.

### Create Shipping
```
POST {{urlDev}}/shipping
Authorization: Bearer <token>
```
```json
{
  "name": {
    "ar": "القاهرة",
    "en": "Cairo"
  },
  "cost": 75
}
```

**Success Response (201)**
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

### Update Shipping
```
PATCH {{urlDev}}/shipping/:shippingId
Authorization: Bearer <token>
```
Same body as create.

### Delete Shipping
```
DELETE {{urlDev}}/shipping/:shippingId
Authorization: Bearer <token>
```

### Get All Shipping Options
```
GET {{urlDev}}/shipping
Authorization: Bearer <token>
```

### Get Shipping by ID
```
GET {{urlDev}}/shipping/:shippingId
Authorization: Bearer <token>
```

---

## 8. Product Management

Products require categories, sub-categories, and colors to exist first. Images must be uploaded to S3 first (Section 2).

### Create Product
```
POST {{urlDev}}/product/create
Authorization: Bearer <token>
```
```json
{
  "name": {
    "ar": "بنطلون قطني",
    "en": "Cotton Pants"
  },
  "description": {
    "ar": "بنطلون قطني مريح للاستخدام اليومي",
    "en": "Comfortable cotton pants for daily use"
  },
  "price": 500,
  "wholesalePrice": 200,
  "salePrice": 350,
  "saleStartDate": 0,
  "saleEndDate": 0,
  "category": "<categoryId>",
  "subCategory": "<subCategoryId>",
  "defaultImage": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/...",
  "albumImages": [
    "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/...",
    "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/..."
  ],
  "sizeChartImage": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/...",
  "variants": [
    { "size": "xs", "color": "<colorId>", "quantity": 10 },
    { "size": "s",  "color": "<colorId>", "quantity": 5  },
    { "size": "m",  "color": "<colorId>", "quantity": 8  },
    { "size": "l",  "color": "<colorId>", "quantity": 3  }
  ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name.ar` / `name.en` | Yes | Bilingual name |
| `description.ar` / `description.en` | Yes | Bilingual description |
| `price` | Yes | Regular price |
| `wholesalePrice` | Yes | Wholesale price |
| `salePrice` | Yes | Discounted price |
| `saleStartDate` / `saleEndDate` | Yes | Unix timestamps; use `0` if no active sale |
| `category` | Yes | `_id` from Category |
| `subCategory` | Yes | `_id` from Sub-Category |
| `defaultImage` | Yes | Main product image URL |
| `albumImages` | Yes | Array of additional image URLs |
| `sizeChartImage` | No | Size guide image URL |
| `variants` | Yes | At least one variant required |
| `variants[].size` | Yes | Size string (e.g. `xs`, `s`, `m`) |
| `variants[].color` | Yes | `_id` from Color |
| `variants[].quantity` | Yes | Stock count |

**Common Errors**

| Situation | Code | Message |
|-----------|------|---------|
| Invalid category ID | 400 | `"Category not found"` |
| Invalid sub-category ID | 400 | `"SubCategory not found"` |
| Missing required fields | 400 | Validation error with field details |

---

### Update Product
```
PATCH {{urlDev}}/product/update/:productId
Authorization: Bearer <token>
```
Same body as create. Only send the fields you want to change.

### Soft Delete Product
```
PATCH {{urlDev}}/product/soft-delete/:productId
Authorization: Bearer <token>
```

### Restore Product
```
PATCH {{urlDev}}/product/restore/:productId
Authorization: Bearer <token>
```

### Hard Delete Product
```
DELETE {{urlDev}}/product/hard-delete/:productId
Authorization: Bearer <token>
```

### Get All Products (with Filters & Pagination)
```
GET {{urlDev}}/product/get-all-products?page=1
Authorization: Bearer <token>
```

### Get Product by ID
```
GET {{urlDev}}/product/get-one-product/:productId
Authorization: Bearer <token>
```

### Fuzzy Search Products
```
GET {{urlDev}}/product/search?searchQuery=<term>
Authorization: Bearer <token>
```

### Get Product Analysis
```
GET {{urlDev}}/product/get-analysis
Authorization: Bearer <token>
```

---

## 9. Variant Management

Variants are the individual size + color + stock combinations on a product. They are created automatically when you create a product, but can be managed separately.

### Create a Single Variant
```
POST {{urlDev}}/variant
Authorization: Bearer <token>
```
```json
{
  "productId": "<productId>",
  "size": "XS",
  "color": "<colorId>",
  "quantity": 5
}
```

### Update a Single Variant
```
PATCH {{urlDev}}/variant/:variantId
Authorization: Bearer <token>
```
Same body as create.

### Delete a Single Variant
```
DELETE {{urlDev}}/variant/:variantId
Authorization: Bearer <token>
```

### Bulk Update Variants (multiple at once)
```
PATCH {{urlDev}}/variant/bulk
Authorization: Bearer <token>
```
```json
{
  "productId": "<productId>",
  "variants": [
    { "_id": "<variantId>", "color": "<colorId>", "size": "m", "quantity": 55 },
    { "_id": "<variantId>", "color": "<colorId>", "size": "l", "quantity": 20 }
  ]
}
```

### Bulk Delete Variants
```
DELETE {{urlDev}}/variant/bulk
Authorization: Bearer <token>
```
```json
{
  "productId": "<productId>",
  "variantIds": ["<variantId1>", "<variantId2>"]
}
```

### Get All Variants for a Product
```
GET {{urlDev}}/variant/product/:productId
Authorization: Bearer <token>
```

### Get Variant by ID
```
GET {{urlDev}}/variant/:variantId
Authorization: Bearer <token>
```

---

## 10. Image Slider (Hero Section)

The hero section shows banner images on the storefront. Each record holds two images: one `small` and one `large`.

### Create Hero Section

Upload both images to S3 first (Section 2), then:

**Request**
```
POST {{urlDev}}/hero-section/create
Authorization: Bearer <token>
```
```json
{
  "images": {
    "image1": {
      "imageUrl": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/...",
      "imageType": "small"
    },
    "image2": {
      "imageUrl": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/...",
      "imageType": "large"
    }
  }
}
```

> `imageType` must be exactly `"small"` or `"large"`. Any other value returns a 400.

### Update Hero Section
```
PATCH {{urlDev}}/hero-section/:heroSectionId
Authorization: Bearer <token>
```
Same body as create.

### Delete Hero Section
```
DELETE {{urlDev}}/hero-section/:heroSectionId
Authorization: Bearer <token>
```

### Get All Hero Sections
```
GET {{urlDev}}/hero-section/all
Authorization: Bearer <token>
```

### Get Hero Section by ID
```
GET {{urlDev}}/hero-section/:heroSectionId
Authorization: Bearer <token>
```

---

## 11. Social Reviews

Social review images appear in the storefront's social proof section.

### Create Social Review

Upload image to S3 first, then:

```
POST {{urlDev}}/social-review
Authorization: Bearer <token>
```
```json
{
  "imageUrl": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/..."
}
```

### Update Social Review
```
PATCH {{urlDev}}/social-review/:socialReviewId
Authorization: Bearer <token>
```
```json
{
  "imageUrl": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/..."
}
```

### Delete Social Review
```
DELETE {{urlDev}}/social-review/:socialReviewId
Authorization: Bearer <token>
```

### Get All Social Reviews
```
GET {{urlDev}}/social-review
Authorization: Bearer <token>
```

### Get Social Review by ID
```
GET {{urlDev}}/social-review/:socialReviewId
Authorization: Bearer <token>
```

---

## 12. Offers

Offers are promotions applied automatically at checkout. Two types are supported:

| Type | What it does |
|------|-------------|
| `fixed_discount` | Deducts a fixed amount from the order total when minimum is met |
| `free_shipping` | Removes shipping cost when minimum order amount is met |

### Create Offer

Upload offer image to S3 first, then:

```
POST {{urlDev}}/offers
Authorization: Bearer <token>
```

**Fixed Discount Example**
```json
{
  "type": "fixed_discount",
  "isActive": true,
  "image": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/...",
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
  "image": "https://amzn-s3-snlangire.s3.us-east-1.amazonaws.com/...",
  "description": {
    "ar": "شحن مجاني عند الشراء بـ 500 جنيه",
    "en": "Free shipping on orders above 500 EGP"
  },
  "minOrderAmount": 500
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `type` | Yes | `fixed_discount` or `free_shipping` |
| `isActive` | Yes | `true` to make it live immediately |
| `image` | Yes | S3 URL |
| `description.ar` / `description.en` | Yes | Bilingual description |
| `minOrderAmount` | Yes | Minimum cart total to trigger offer |
| `discountAmount` | Only for `fixed_discount` | Amount to subtract |

### Update Offer
```
PATCH {{urlDev}}/offers/:offerId
Authorization: Bearer <token>
```
Same body as create.

### Toggle Offer Active / Inactive
```
PATCH {{urlDev}}/offers/toggle/:offerId
Authorization: Bearer <token>
```
```json
{
  "isActive": false
}
```

### Delete Offer
```
DELETE {{urlDev}}/offers/:offerId
Authorization: Bearer <token>
```

### Get All Offers
```
GET {{urlDev}}/offers
Authorization: Bearer <token>
```

### Get Offer by ID
```
GET {{urlDev}}/offers/:offerId
Authorization: Bearer <token>
```

---

## 13. Wishlist (Admin View)

View all products customers have added to their wishlists.

### Get All Wishlist Items (Paginated)
```
GET {{urlDev}}/wishlist?page=1
Authorization: Bearer <token>
```

---

## 14. Order Management

### Get All Orders (Paginated + Filtered by Status)
```
GET {{urlDev}}/order/admin/all?page=1&status=ordered
Authorization: Bearer <token>
```

Available `status` values:

| Status | Meaning |
|--------|---------|
| `ordered` | Customer placed the order |
| `confirmed` | Admin confirmed the order |
| `under_review` | Order is being reviewed |
| `shipped` | Order dispatched |
| `delivered` | Order received by customer |
| `cancelled` | Order was cancelled |
| `deleted` | Order was deleted |

---

### Get Order by ID
```
GET {{urlDev}}/order/admin/:orderId
Authorization: Bearer <token>
```

---

### Update Order Status
```
PATCH {{urlDev}}/order/admin/status/:orderId
Authorization: Bearer <token>
```
```json
{
  "status": "confirmed"
}
```

**Success Response (200)**
```json
{
  "statusCode": 200,
  "data": {
    "order": {
      "_id": "69d86ef0eb2acbb10b71f854",
      "orderNumber": "ORD-856326-0109",
      ...
    }
  }
}
```

**Common Errors**

| Situation | Code | Message |
|-----------|------|---------|
| Invalid order ID | 400 | `"Order not found"` |

---

### Apply Free Shipping to an Order

Override the shipping cost to zero for a specific order.

```
PATCH {{urlDev}}/order/admin/free-shipping/:orderId
Authorization: Bearer <token>
```

---

## 15. Recommended Setup Order

Follow this sequence when setting up the system for the first time:

```
1.  POST /authentication/register-email     → request activation email
2.  POST /authentication/active-account     → get Bearer token
3.  POST /aws/get-presigned-url             → upload reference images to S3
4.  POST /group-size/group                  → create size groups (letters / numeric)
5.  POST /group-size/size                   → create individual sizes per group
6.  POST /color                             → create colors for product variants
7.  POST /shipping                          → create shipping regions & costs
8.  POST /category/create                   → create product categories
9.  POST /sub-category/create               → create sub-categories under categories
10. POST /product/create                    → create products with variants
11. POST /hero-section/create               → set up homepage image slider
12. POST /social-review                     → add social proof images
13. POST /offers                            → create promotions
```

---

## 16. Error Reference

All errors follow this envelope:

```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation Error!",
  "errors": [
    {
      "message": "Human readable error",
      "path": ["fieldName"],
      "type": "joi.error.type"
    }
  ]
}
```

For non-validation errors (resource not found, business logic failures):

```json
{
  "success": false,
  "message": "Category not found",
  "error": []
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request — check `errors` array for field-level detail |
| 401 | Unauthorized — token missing or invalid |
| 404 | Resource not found |
