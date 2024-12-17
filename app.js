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

// Obtener las citas disponibles de la base de datos
let citasDisponibles = [];

const obtenerCitasDisponibles = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM citas WHERE ocupado = FALSE';
        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error al obtener las citas:', err);
                reject(err);
            }
            citasDisponibles = results; // Guardar las citas obtenidas en la variable global
            resolve(results);
        });
    });
};

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

// Flujo para mostrar las citas disponibles
const flowReservarTeatro = addKeyword(['1', 'reservar', 'teatro']).addAnswer([ 
    '🎭 Has seleccionado *Reservar Teatro*.',
    'Estas son las citas disponibles para reservar:'
], async (ctx) => {
    try {
        // Verificar si ya se han obtenido las citas
        if (citasDisponibles.length === 0) {
            // Si no se han obtenido, hacer la consulta y guardar las citas
            await obtenerCitasDisponibles();
        }

        if (citasDisponibles.length === 0) {
            ctx.reply('⚠️ Actualmente no hay citas disponibles. Intenta más tarde.');
        } else {
            // Crear el texto con todas las citas disponibles
            let citasText = citasDisponibles.map((cita, index) => {
                // Formatear las fechas y horas para mostrarlo de manera más legible
                const fecha = new Date(cita.fecha);
                const hora = new Date(cita.hora);
                return `${index + 1}. Fecha: ${fecha.toLocaleDateString()} Hora: ${hora.toLocaleTimeString()}`;
            }).join('\n');
            
            ctx.reply(`Estas son las citas disponibles:\n\n${citasText}\n\nPor favor, selecciona el número de la cita que deseas reservar.`);
        }
    } catch (error) {
        ctx.reply('❌ Hubo un error al obtener las citas disponibles. Por favor, inténtalo de nuevo más tarde.');
        console.error('Error al obtener las citas:', error);
    }
});

/**
 * Flujo principal
 */
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
    [flowReservarTeatro]
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

// Obtener citas antes de iniciar el bot
obtenerCitasDisponibles().then(() => {
    main();
}).catch((error) => {
    console.error('Error al obtener las citas al inicio:', error);
});
