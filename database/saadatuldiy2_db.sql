-- =========================================================
--  Sa'adatul D.I.Y - MySQL / MariaDB database
--  Import in phpMyAdmin (Import tab) or run:
--    C:\xampp\mysql\bin\mysql.exe -u root < database\saadatuldiy2_db.sql
--  Safe to re-import: nothing is dropped, products are only
--  inserted when they do not exist yet.
-- =========================================================

CREATE DATABASE IF NOT EXISTS saadatuldiy2_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE saadatuldiy2_db;

-- ---------------------------------------------------------
--  CUSTOMERS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(30)  NULL,
    address       VARCHAR(255) NULL,
    city          VARCHAR(100) NULL,
    postcode      VARCHAR(20)  NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Failed logins, used to slow down password guessing.
CREATE TABLE IF NOT EXISTS login_attempts (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email        VARCHAR(254) NOT NULL,
    ip_address   VARCHAR(45)  NOT NULL,
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_attempts_email (email, attempted_at),
    KEY idx_attempts_ip (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
--  PRODUCTS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150) NOT NULL,
    slug        VARCHAR(160) NOT NULL,
    category    ENUM('keychain', 'figurine', 'plushie', 'accessory') NOT NULL,
    price       DECIMAL(10, 2) NOT NULL,
    description TEXT NULL,
    image       VARCHAR(255) NOT NULL,
    stock       INT UNSIGNED NULL COMMENT 'NULL = stock is not tracked',
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_slug (slug),
    KEY idx_products_category (category, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extra gallery photos shown on the product page.
CREATE TABLE IF NOT EXISTS product_images (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_product_image (product_id, image_path),
    CONSTRAINT fk_images_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
--  SHOPPING CART & FAVOURITES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity   INT UNSIGNED NOT NULL DEFAULT 1,
    added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cart_user_product (user_id, product_id),
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favourites (
    user_id    INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
--  ORDERS (checkout)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       INT UNSIGNED NOT NULL,
    email         VARCHAR(254) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(30)  NOT NULL,
    country       VARCHAR(100) NOT NULL,
    fulfilment    ENUM('delivery', 'pickup') NOT NULL,
    address       VARCHAR(255) NULL,
    city          VARCHAR(100) NULL,
    postcode      VARCHAR(20)  NULL,
    shipping_zone VARCHAR(50)  NULL,
    subtotal      DECIMAL(10, 2) NOT NULL,
    delivery_fee  DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total         DECIMAL(10, 2) NOT NULL,
    payment_proof VARCHAR(255) NOT NULL COMMENT 'File name inside uploads/payment-proofs/',
    status        ENUM('pending', 'confirmed', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_orders_user (user_id, created_at),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
        REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id     INT UNSIGNED NOT NULL,
    product_id   INT UNSIGNED NULL,
    product_name VARCHAR(150) NOT NULL,
    image        VARCHAR(255) NOT NULL,
    unit_price   DECIMAL(10, 2) NOT NULL,
    quantity     INT UNSIGNED NOT NULL,
    line_total   DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_items_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_items_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
--  CUSTOM ORDERS (price is confirmed later on WhatsApp)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_orders (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED NOT NULL,
    order_type      VARCHAR(30) NOT NULL DEFAULT 'keychain',
    details         LONGTEXT NOT NULL COMMENT 'JSON list of keychain choices',
    special_notes   TEXT NULL,
    estimated_total DECIMAL(10, 2) NOT NULL,
    final_price     DECIMAL(10, 2) NULL COMMENT 'Filled in after the WhatsApp discussion',
    status          ENUM('awaiting_whatsapp', 'in_discussion', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'awaiting_whatsapp',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_custom_user (user_id, created_at),
    CONSTRAINT fk_custom_user FOREIGN KEY (user_id)
        REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
--  PRODUCTS FROM shop.html
--  (add more products here or in phpMyAdmin; they appear on
--   the Shop page automatically)
-- ---------------------------------------------------------
INSERT IGNORE INTO products (name, slug, category, price, description, image, stock) VALUES
    ('Nailong Flower Keychain',   'nailong-flower-keychain',   'keychain', 30.00, NULL, 'photos/nailong.jpg', NULL),
    ('Assorted Flowers Keychain', 'assorted-flowers-keychain', 'keychain', 15.00, 'A flower that lasts forever.', 'photos/flowers.jpg', 5),
    ('BMO Keychain',              'bmo-keychain',              'keychain', 20.00, NULL, 'photos/bmo.jpg', NULL),
    ('Teletubbies Figurines',     'teletubbies-figurines',     'figurine', 30.00, NULL, 'photos/Teletubbies.jpg', NULL),
    ('Baby Elephant Plushie',     'baby-elephant-plushie',     'plushie',  95.00, NULL, 'photos/baby-elephant.jpg', NULL);

INSERT IGNORE INTO product_images (product_id, image_path, sort_order)
SELECT p.id, g.image_path, g.sort_order
FROM products p
JOIN (
    SELECT 'assorted-flowers-keychain' AS slug, 'photos/flowers.jpg'  AS image_path, 1 AS sort_order
    UNION ALL SELECT 'assorted-flowers-keychain', 'photos/rose.jpg',     2
    UNION ALL SELECT 'assorted-flowers-keychain', 'photos/flowers2.jpg', 3
    UNION ALL SELECT 'assorted-flowers-keychain', 'photos/flowers3.jpg', 4
) g ON g.slug = p.slug;
