/**
 * @class
 * Класс предназначен для обеспечения управления различными моделями сервоприводов с удержанием угла. Позволяет осуществлять инициализацию и управление сервоприводом в соответствии с его характеристиками: возмоные углы поворота, мин. и макс. длины импульса, положение по-умолчанию.   
 */
class ClassServo extends ClassMiddleActuator {
    /**
     * @constructor
     * @param {ActuatorPropsType} _actuatorProps 
     * @param {ActuatorOptsType} _opts
     */
    constructor(_actuatorProps, _opts) {
        ClassMiddleActuator.call(this, _actuatorProps, _opts);

        const changeNotation = str => `_${str[0].toUpperCase()}${str.substr(1)}`;       //converts "propName" -> "_PropName"

        if (typeof _actuatorProps.maxRange !== 'number' || 
            typeof _actuatorProps.maxPulse !== 'number' ||
            typeof _actuatorProps.minPulse !== 'number') throw new Error('Some arg are missing');
        if (_actuatorProps.minRange && typeof _actuatorProps.minRange !== 'number' ||
            _actuatorProps.minRange >= _actuatorProps.maxRange ||
            _actuatorProps.minPulse >= _actuatorProps.maxPulse ||
            _actuatorProps.defaultPos && typeof _actuatorProps.defaultPos !== 'number' ||
            _actuatorProps.defaultPos < _actuatorProps.minRange || 
            _actuatorProps.defaultPos > _actuatorProps.maxRange) throw new Error('Invalid arg');
        
        this._MinRange = _actuatorProps.minRange || 0;
        this._MaxRange = _actuatorProps.maxRange;
        this._MaxPulse = _actuatorProps.maxPulse;
        this._MinPulse = _actuatorProps.minPulse;
        this._DefaultPos = _actuatorProps.defaultPos || this._MinRange;
        this._LastInput = undefined;
        this.Reset();
    }
    /**
     * @getter
     * Возвращает позицию, в которую был установлен сервопривод
     * @returns {Number} величина в градусах
     */
    get Position() { return this._LastInput; }

    On(_chNum, _deg) {
        if (typeof _deg !== 'number') throw new Error('Invalid arg');

        let deg = E.clip(_deg, this._MinRange, this._MaxRange);
        if (_deg !== deg) throw new Error('Invalid degree value');
        //функция преобразует число, пропорционально приводя его к одного диапазона к другому
        //пример: proportion(5, 0, 10, 10, 20) -> 15 
        const proportion = (x, in_low, in_high, out_low, out_high) => {
            return (x - in_low) * (out_high - out_low) / (in_high - in_low) + out_low;
        }
        const freq = 20;    //частота ШИМа
        const msec = proportion(deg, this._MinRange, this._MaxRange, this._MinPulse, this._MaxPulse);   //градусы -> длина импульса в мс
        const val = proportion(msec, 0, 20, 0, 1);  //мс -> число [0 : 1] (на практике приблизительно [0.027 : 0.12])
        
        this._IsChOn[0] = true;
        analogWrite(this._Pins[0], val, { freq: freq, soft: false });   //ШИМ
        this._LastInput = deg;  //сохраняется последний корректный ввод
    }
    Off() {
        digitalWrite(this._Pins[0], 1);     //прерывание ШИМа
        this._IsChOn[0] = false;
    }
    Reset() {
        this.On(this._DefaultPos);      //установка сервопривода в стандартное положение
        setTimeout(() => {
            digitalWrite(this._Pins[0], 1);  //выкл. удержания позиции после таймаута
            this._IsChOn[0] = false;
        }, 1000);
    }
}