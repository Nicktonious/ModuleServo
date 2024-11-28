//Создание объекта класса
//Так как у серво только один канал, сразу сохраняем ссылку на него
let servo = SensorManager.CreateDevice('servo')[0];

//Смена положения с 0° до 180° и обратно по интервалу  
let flag = false;
setInterval(() => {
    let pos = flag ? 0 : 1;
    flag = !flag;

    servo.SetValue(pos);
}, 2000);