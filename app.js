const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MySQLAdapter = require('@bot-whatsapp/database/mysql');
const mysql = require('mysql');

/**
 * Configuración de la base de datos MySQL
 */
const MYSQL_DB_HOST = 'localhost';
const MYSQL_DB_USER = 'root';
const MYSQL_DB_PASSWORD = '';
const MYSQL_DB_NAME = 'chat';
const MYSQL_DB_PORT = '3306';

/**
 * Conexión a la base de datos MySQL
 */
const connection = mysql.createConnection({
    host: MYSQL_DB_HOST,
    user: MYSQL_DB_USER,
    password: MYSQL_DB_PASSWORD,
    database: MYSQL_DB_NAME,
    port: MYSQL_DB_PORT,
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.stack);
        return;
    }
    console.log('Conexión establecida con la base de datos');
});

// Crear las tablas si no existen
const crearTablas = () => {
    // Sentencia para crear la tabla 'personas'
    const queryPersonas = `
        CREATE TABLE IF NOT EXISTS personas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL
        );
    `;
    
    // Sentencia para crear la tabla 'soporte'
    const querySoporte = `
        CREATE TABLE IF NOT EXISTS soporte (
            id INT AUTO_INCREMENT PRIMARY KEY,
            descripcion TEXT NOT NULL,
            lugar VARCHAR(255) NOT NULL,
            idPersonal INT,
            FOREIGN KEY (idPersonal) REFERENCES personas(id)
        );
    `;
    
    // Sentencia para crear la tabla 'citas'
    const queryCitas = `
        CREATE TABLE IF NOT EXISTS citas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fecha DATE NOT NULL,
            hora TIME NOT NULL,
            ocupado BOOLEAN DEFAULT FALSE
        );
    `;
    
    // Ejecutar cada consulta por separado
    connection.query(queryPersonas, (err, results) => {
        if (err) {
            console.error('Error creando la tabla personas:', err);
            return;
        }
        console.log('Tabla personas creada con éxito');
    });

    connection.query(querySoporte, (err, results) => {
        if (err) {
            console.error('Error creando la tabla soporte:', err);
            return;
        }
        console.log('Tabla soporte creada con éxito');
    });

    connection.query(queryCitas, (err, results) => {
        if (err) {
            console.error('Error creando la tabla citas:', err);
            return;
        }
        console.log('Tabla citas creada con éxito');
    });
};

// Llamar a la función para crear las tablas
crearTablas();

/**
 * Flujos del chatbot
 */

// Opción 1: Reservar teatro
const flowReservarTeatro = addKeyword(['1', 'reservar', 'teatro']).addAnswer([ 
    '🎭 Has seleccionado *Reservar Teatro*.', 
    'Por favor, proporciona la fecha y hora que deseas reservar.', 
]);

// Opción 2: Soporte
const flowSoporte = addKeyword(['2', 'soporte']).addAnswer([ 
    '🛠️ Has seleccionado *Soporte*.', 
    'Por favor, describe brevemente tu problema para ayudarte.', 
]);

// Opción 3: Redes
const flowRedes = addKeyword(['3', 'redes']).addAnswer([ 
    '🌐 Has seleccionado *Redes*.', 
    'Síguenos en nuestras redes sociales:', 
    '- Facebook: https://facebook.com', 
    '- Instagram: https://instagram.com', 
    '- Twitter: https://twitter.com', 
]);

// Flujo principal
const flowPrincipal = addKeyword(['hola', 'buenas', 'chat-tic', 'Hola']).addAnswer( 
    [ 
        '🙌 Bienvenido a *Chat-TIC*!', 
        'Elige una de las siguientes opciones:', 
        '1️⃣ *Reservar Teatro*', 
        '2️⃣ *Soporte*', 
        '3️⃣ *Redes*', 
        '\nEnvía el número de la opción que deseas.', 
    ], 
    null, 
    null, 
    [flowReservarTeatro, flowSoporte, flowRedes] 
);

/**
 * Configuración principal del bot
 */
const main = async () => {
    const adapterDB = new MySQLAdapter({
        host: MYSQL_DB_HOST,
        user: MYSQL_DB_USER,
        database: MYSQL_DB_NAME,
        password: MYSQL_DB_PASSWORD,
        port: MYSQL_DB_PORT,
    });
    const adapterFlow = createFlow([flowPrincipal]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
