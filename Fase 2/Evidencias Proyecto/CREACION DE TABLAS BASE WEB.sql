CREATE DATABASE web CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE web;



CREATE TABLE articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    color VARCHAR(50),
    codigo_color VARCHAR(50),
    TEMPO VARCHAR(50),
    GENERO VARCHAR(50),
    CATEGORIA VARCHAR(100),
    SUB_CATEGORIA VARCHAR(100),
    imagen VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





CREATE TABLE genero (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cod_genero VARCHAR(4) NOT NULL,
    genero VARCHAR(50) NOT NULL
);

CREATE TABLE categoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cod_categoria VARCHAR(4) NOT NULL,
    categoria VARCHAR(50) NOT NULL
);

CREATE TABLE sub_categoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cod_subcategoria VARCHAR(4) NOT NULL,
    subcategoria VARCHAR(50) NOT NULL
);

CREATE TABLE stock_aristo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_color VARCHAR(6) NOT NULL,
    stock int NULL DEFAULT 0
);

CREATE TABLE stock_interco (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_color VARCHAR(6) NOT NULL,
    stock int NULL DEFAULT 0
);


CREATE TABLE color (
    color VARCHAR(4) NOT NULL,
    factor DECIMAL(5,5)
);

ALTER TABLE genero
ADD COLUMN factor DECIMAL(5,5);

ALTER TABLE categoria
ADD COLUMN factor DECIMAL(5,5);

ALTER TABLE sub_categoria
ADD COLUMN factor DECIMAL(5,5);

ALTER TABLE color
ADD COLUMN nombre_color VARCHAR(20) NOT NULL;

ALTER TABLE color
MODIFY COLUMN nombre_color VARCHAR(50) AFTER color;



CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'editor', 'usuario') DEFAULT 'usuario',
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion DATETIME NULL
);


ALTER TABLE color ADD UNIQUE (color);


INSERT INTO color (color, nombre_color, factor) VALUES
('00', 'Crudo', 0),
('01', 'Blanco', 0),
('02', 'Negro', 0),
('03', 'Cafe', 0),
('04', 'Rojo', 0),
('05', 'Azul', 0),
('06', 'Beige', 0),
('07', 'Celeste', 0),
('08', 'Verde', 0),
('09', 'Rosado', 0),
('10', 'Amarillo', 0),
('11', 'Gris', 0),
('12', 'Naranja', 0),
('13', 'Tostado', 0),
('14', 'Mostaza', 0),
('15', 'Rombo Azul', 0),
('16', 'Caramelo', 0),
('17', 'Lila', 0),
('19', 'Coral', 0),
('20', 'Negro_Negro', 0),
('21', 'Plateado', 0),
('22', 'Peltre', 0),
('23', 'Dorado', 0),
('24', 'Espiga Cafe', 0),
('26', 'Talpe', 0),
('27', 'Burdeo', 0),
('29', 'Rose', 0),
('30', 'Miel', 0),
('31', 'Fantasia Gris', 0),
('34', 'Fantasia Cafe', 0),
('35', 'Escoses Cafe', 0),
('36', 'Fantasia Burdeo', 0),
('37', 'Fant.Burd.Gris', 0),
('38', 'Pied Poul Vison', 0),
('39', 'Pied Poul Gris', 0),
('41', 'Escoses Gris', 0),
('45', 'Pie Poul Cafe', 0),
('46', 'Pie Poul Burdeo', 0),
('50', 'Listado Beige', 0),
('51', 'Cuadrito Marengo', 0),
('53', 'Escoses Burdeo Gris', 0),
('54', 'Listado Rojo', 0),
('55', 'Listado Azul', 0),
('56', 'Listado Beige', 0),
('57', 'Listado Celeste', 0),
('60', 'Arena', 0),
('66', 'Kaki', 0),
('70', 'Calipso', 0),
('71', 'Mezclilla', 0),
('75', 'Jeans', 0),
('77', 'Mezclilla', 0),
('80', 'Pistacho', 0),
('82', 'Negro Listado', 0),
('87', 'Celeste Listado', 0),
('88', 'Verde Listado', 0),
('90', 'Fucsia', 0),
('99', 'Multicolor', 0);



ALTER USER 'papatas'@'%' IDENTIFIED BY 'Patatas2024@';
GRANT ALL PRIVILEGES ON web.* TO 'papatas'@'%';
FLUSH PRIVILEGES;


SELECT user, host FROM mysql.user WHERE user = 'papatas';

CREATE USER 'papatas'@'%' IDENTIFIED BY 'Patatas2024@';
GRANT ALL PRIVILEGES ON web.* TO 'papatas'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;



ALTER TABLE stock_interco MODIFY codigo_color VARCHAR(20);
ALTER TABLE stock_aristo MODIFY codigo_color VARCHAR(20);








CREATE TABLE `proyeccion_ventas_total` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_linea` VARCHAR(100) NOT NULL,
  `Color` VARCHAR(10) NOT NULL,
  `Genero` VARCHAR(20) NOT NULL,
  `Categoria` VARCHAR(30) NOT NULL,
  `SubCategoria` VARCHAR(30) NOT NULL,
  `articulos_en_linea` INT DEFAULT 0,
  `venta_prom_6m_estimada` DECIMAL(15,2) DEFAULT 0.00,
  `venta_prom_x_articulo_estimada` DECIMAL(15,2) DEFAULT 0.00,
  `fecha_proyeccion` DATETIME NOT NULL,
  INDEX (`id_linea`),
  INDEX (`fecha_proyeccion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;









CREATE TABLE `proyeccion_ventas_detalle` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_linea` VARCHAR(100) NOT NULL,
  `Color` VARCHAR(10) NOT NULL,
  `Genero` VARCHAR(20) NOT NULL,
  `Categoria` VARCHAR(30) NOT NULL,
  `SubCategoria` VARCHAR(30) NOT NULL,
  `Mes` VARCHAR(10) NOT NULL,
  `venta_mes_estimada` DECIMAL(15,2) DEFAULT 0.00,
  `fecha_proyeccion` DATETIME NOT NULL,
  INDEX (`id_linea`),
  INDEX (`Mes`),
  INDEX (`fecha_proyeccion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




ALTER TABLE articulos ADD id_linea VARCHAR(200);

UPDATE articulos
SET id_linea = CONCAT(color, '_' , GENERO, '_', CATEGORIA, '_', SUB_CATEGORIA)
WHERE id > 0;

CREATE INDEX idx_articulos_id_linea ON articulos(id_linea);