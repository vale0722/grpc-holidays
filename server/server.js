let grpc = require('grpc');
let protoLoader = require('@grpc/proto-loader');

const server = new grpc.Server();
const SERVER_ADDRESS = "0.0.0.0:2022";

let proto = grpc.loadPackageDefinition(
    protoLoader.loadSync("../proto/holidays.proto", {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    })
);

let users = [];
let usersRegister = [];

let register = (call) => {
    users.push(call);
    call.on('data', (message) => {
        usersRegister.push(message);
        sendNotification({user: message.user, holidays: message.holidays})
    })
}

let query = (call) => {
    call.on('data', (message) => {
        getResponse({user: usersRegister.find((user) => user.user === message.user), days: message.days}, call)
    })
}

let sendNotification = (message) => {
    users.forEach(user => {
        user.write(message);
    })
}

let getResponse = (message, call) => {
        if(message.user) {
            if(parseInt(message.days) <= parseInt(message.user.holidays)) {
                message.user.holidays = message.user.holidays - message.days;
                call.write({
                    user: message.user.user,
                    response: `Se le ha autorizado el permiso, Le quedan ${message.user.holidays} días de vacaciones`
                });
                return;
            }

            call.write({
                user: message.user.user,
                response: `Lo lamentamos, la solicitud no se pudo realizar, no tienes los suficientes días de vacaciones\n ${message.user.user} tan solo tiene ${message.user.holidays} días de vacaciones`
            });
        } else {
            call.write({
                user: 0,
                response: 'El usuario ingresado no está registrado'
            });
        }
}

let index = (call) => {
    call.write({
        users: usersRegister
    });
}

server.addService(proto.holidays.Holidays.service, {register: register, query: query, index: index});
server.bind(SERVER_ADDRESS, grpc.ServerCredentials.createInsecure());
server.start();

