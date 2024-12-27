const { createBot, createProvider, createFlow, addKeyword, addAction } = require('@bot-whatsapp/bot');
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
    const queryCitas = `
        CREATE TABLE IF NOT EXISTS citas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fecha DATE NOT NULL,
            hora TIME NOT NULL,
            ocupado BOOLEAN DEFAULT FALSE
        );
    `;
    
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
const flowReservarTeatro = addKeyword(['1', 'reservar', 'teatro'])
.addAnswer('🎭 Has seleccionado *Reservar Teatro*.', 'Estas son las fechas disponibles para reservar el teatro:', async (ctx, { flowDynamic }) => {
    // Consultar las citas disponibles (no ocupadas)
    const query = 'SELECT id, fecha, hora FROM citas WHERE ocupado = FALSE';
    
    connection.query(query, async (err, results) => {  // Aquí usamos async/await para las consultas
        if (err) {
            console.error('Error al consultar las citas:', err);
            await flowDynamic([{ body: 'Lo siento, hubo un problema al obtener las citas disponibles.' }]);
            return;
        }

        if (results.length === 0) {
            await flowDynamic([{ body: 'No hay citas disponibles en este momento.' }]);
            return;
        }

        // Crear los mensajes dinámicos con las fechas y horas disponibles
        const mensajes = results.map(cita => ({
            body: `ID: ${cita.id},Fecha: ${cita.fecha}, Hora: ${cita.hora}`
        }));

        // Enviar los mensajes dinámicos con las citas disponibles
        await flowDynamic(mensajes);  // Asegúrate de usar await aquí
    });
});
const flowSoporte = addKeyword(['2', 'soporte']).addAnswer([ 
    '🛠️ Has seleccionado *Soporte*.', 
    'Por favor, describe brevemente tu problema para ayudarte.', 
]);


const flowPrincipal = addKeyword(['hola', 'buenas', 'chat-tic', 'Hola']).addAnswer( 
    [ 
        '🙌 Bienvenido a *Chat-TIC*!', 
        'Elige una de las siguientes opciones:', 
        '1️⃣ *Reservar Teatro*', 
        '2️⃣ *Soporte*', 
        '\nEnvía el número de la opción que deseas.', 
    ], 
    null, 
    null, 
    [flowReservarTeatro, flowSoporte]
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