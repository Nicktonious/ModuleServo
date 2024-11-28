// Перед запуском не забудьте вернуть потенциометр в нулевое положение
let pot = SensorManager.CreateDevice('12')[0];
pot.DataRefine.SetLinearFunc(1, 0);
pot.DataRefine.SetLim(0, 1);
pot.Start();

let servo = SensorManager.CreateDevice('14')[0];

let interval = setInterval(() => {
    servo.SetValue((pot.Value).toFixed(1));
}, 20);
