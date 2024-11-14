CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
);

CREATE TABLE `user_addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) NOT NULL,
  PRIMARY KEY (`address_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  `rating` decimal(3,2) NOT NULL,
  `review_text` text,
  PRIMARY KEY (`review_id`),
  KEY `user_id` (`user_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` >= 0) AND (`rating` <= 5))
);

CREATE TABLE `restaurants` (
  `restaurant_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `phone_no` varchar(15) NOT NULL,
  `email` varchar(100) NOT NULL,
  `cuisine_id` int DEFAULT NULL,
  PRIMARY KEY (`restaurant_id`),
  UNIQUE KEY `email` (`email`),
  KEY `cuisine_id` (`cuisine_id`),
  CONSTRAINT `restaurants_ibfk_1` FOREIGN KEY (`cuisine_id`) REFERENCES `cuisines` (`cuisine_id`)
);

CREATE TABLE `restaurant_locations` (
  `location_id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) NOT NULL,
  PRIMARY KEY (`location_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `restaurant_locations_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE
);

CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `delivery_person_id` int DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `order_status` enum('pending','preparing','out for delivery','delivered') DEFAULT 'pending',
  `payment_status` enum('pending','paid') DEFAULT 'pending',
  `quantity` int NOT NULL DEFAULT '1',
  `address_id` int DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `menu_item_id` (`menu_item_id`),
  KEY `delivery_person_id` (`delivery_person_id`),
  KEY `fk_address_id` (`address_id`),
  CONSTRAINT `fk_address_id` FOREIGN KEY (`address_id`) REFERENCES `user_addresses` (`address_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`menu_item_id`),
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`delivery_person_id`) REFERENCES `delivery_person` (`delivery_person_id`) ON DELETE SET NULL
);

CREATE TABLE `offers` (
  `offer_id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `price` decimal(8,2) NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`offer_id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE,
  CONSTRAINT `offers_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`menu_item_id`) ON DELETE CASCADE,
  CONSTRAINT `offers_chk_1` CHECK (`price` >= 0)
);

CREATE TABLE `menu_items` (
  `menu_item_id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(100) NOT NULL,
  `description` text,
  `is_available` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`menu_item_id`)
);

CREATE TABLE `delivery_person` (
  `delivery_person_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `current_location` varchar(255) DEFAULT NULL,
  `vehicle_details` varchar(100) DEFAULT NULL,
  `status` enum('available','assigned','on_break') DEFAULT 'available',
  PRIMARY KEY (`delivery_person_id`),
  UNIQUE KEY `phone_number` (`phone_number`)
);

CREATE TABLE `cuisines` (
  `cuisine_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`cuisine_id`)
);

CREATE TABLE `cart` (
  `cart_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  PRIMARY KEY (`cart_id`),
  KEY `user_id` (`user_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`menu_item_id`) ON DELETE CASCADE
);

DELIMITER //

CREATE PROCEDURE `update_order_status_procedure`(IN order_id INT)
BEGIN
    DECLARE current_status ENUM('pending', 'preparing', 'out for delivery', 'delivered');

    SELECT order_status INTO current_status
    FROM orders
    WHERE order_id = order_id
    LIMIT 1;

    IF current_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order not found';
    ELSE
        IF current_status = 'pending' THEN
            UPDATE orders
            SET order_status = 'preparing', payment_status = 'paid'
            WHERE order_id = order_id;
        ELSEIF current_status = 'preparing' THEN
            UPDATE orders
            SET order_status = 'out for delivery'
            WHERE order_id = order_id;
        ELSEIF current_status = 'out for delivery' THEN
            UPDATE orders
            SET order_status = 'delivered'
            WHERE order_id = order_id;
        END IF;
    END IF;
END //

DELIMITER ;
