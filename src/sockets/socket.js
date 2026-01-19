export function socketMain(client) {
    client.on("login", function (data) {
        client.broadcast.emit(`logout/${data.userId}`);
    })
    client.on("newPatient", function (data) {
        client.broadcast.emit(`newPatient/${data.doctorId}`);
    })
}