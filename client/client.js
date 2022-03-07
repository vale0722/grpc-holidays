let grpc = require("grpc");
let protoLoader = require("@grpc/proto-loader");
let readline = require("readline");

let reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

let proto = grpc.loadPackageDefinition(
    protoLoader.loadSync("../proto/holidays.proto", {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    })
);

const ADDRESS_URL = "0.0.0.0:2022";

let username;
let holidays;
let days;

let client = new proto.holidays.Holidays(ADDRESS_URL, grpc.credentials.createInsecure());

let Menu = () => {
    reader.question("Que desea Realizar: " +
        "\n 1. Solicitar Vacaciones.  " +
        "\n 2. Registrar Usuario " +
        "\n 3. Listar Usuarios", answer => {

        switch (answer) {
            case '2':
                Register();
                break;
            case '3':
                Index();
                break;
            default:
                StartRequest();
        }
    });
    console.log('\n')
}

Menu();

let Register = () => {
    reader.question("Ingrese el nombre de usuario:", answer => {
        username = answer;
        reader.question("Ingrese número de dias de vacaciones disponibles:", answer => {
            holidays = answer;
            let channel = client.register();
            channel.write({
                user: username,
                holidays: holidays
            });

            channel.on('data', (response) => {
                console.log(`${response.user}: ${ response.holidays }`);
                console.log('\n')
                Menu();
                channel.end();
            })
        });
    });
}

let StartRequest = () => {
    reader.question("Ingrese el nombre de usuario que realizará la petición:", answer => {
        username = answer;
        reader.question("Cuantos dias requiere:", (answer) => {
            days = answer;

            let channel = client.query();
            channel.write({
                user: username,
                days: days
            });

            channel.on('data', (message) => {
                console.log(`Respuesta solicitud a ${message.user}: ${message.response}`);
                console.log('\n')
                Menu();
            })
        });
    });
}

let Index = () => {
    let channel = client.index();
    channel.on('data', (message) => {
        message.users.forEach((item) => {
            console.log(`${item.user}: ${item.holidays}`)
        })
        Menu();
    })
}